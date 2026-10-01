import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { currencyFromText } from '@/lib/command';
import { withinLimit } from '@/lib/rate-limit';
import type { ScanItem, ScanResponse } from '@/lib/api';

// Reads prices out of a photo (menu, price tag, receipt) with a vision model on
// Workers AI. The browser downsizes the photo first, so requests stay small.
// A scan costs ~35 neurons, so the free 10k/day allowance covers ~280 scans.

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
// ~1.1 MB of JPEG once decoded. The client sends ~1280px images well under this.
const MAX_IMAGE_CHARS = 1_500_000;
const MAX_ITEMS = 40;

const QUESTION = `List every price visible in this image (menu items, price tags, receipts, signs).
Reply with only JSON, no prose:
{"currency": "<currency symbol or code printed next to the prices, or null>", "items": [{"label": "<short item name>", "price": <number>}]}
Write each price as a plain number exactly as printed, without currency symbols or thousands separators.
If there are no prices, reply {"currency": null, "items": []}.`;

/** Pull the JSON object out of a model answer that may wrap it in prose or a code fence. */
function parseAnswer(answer: string): { currency?: unknown; items?: unknown } | null {
  const start = answer.indexOf('{');
  const end = answer.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(answer.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;
  const n = parseFloat(value.replace(/[^\d.]/g, ''));
  return isFinite(n) && n > 0 ? n : null;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    currency: { type: ['string', 'null'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { label: { type: 'string' }, price: { type: 'number' } },
        required: ['label', 'price'],
      },
    },
  },
  required: ['currency', 'items'],
};

export async function POST(request: NextRequest) {
  let env: CloudflareEnv;
  try {
    env = getCloudflareContext().env;
  } catch {
    return NextResponse.json({ error: 'Scanning is unavailable here' }, { status: 503 });
  }
  if (!env.AI) return NextResponse.json({ error: 'Scanning is unavailable here' }, { status: 503 });

  if (!(await withinLimit('SCAN_LIMITER', request))) {
    return NextResponse.json(
      { error: 'Too many scans. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let image: unknown;
  try {
    ({ image } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (
    typeof image !== 'string' ||
    !/^data:image\/(jpeg|png|webp);base64,/.test(image) ||
    image.length > MAX_IMAGE_CHARS
  ) {
    return NextResponse.json(
      { error: 'Send a JPEG, PNG or WebP photo under 1 MB' },
      { status: 400 },
    );
  }

  let answer: string;
  try {
    const output = (await env.AI.run(MODEL, {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: QUESTION },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
      temperature: 0,
      max_tokens: 1200,
    })) as { response?: unknown };
    // JSON mode may hand back the parsed object rather than a string
    answer =
      typeof output.response === 'string' ? output.response : JSON.stringify(output.response ?? '');
  } catch (err) {
    console.error('Price scan failed', err);
    // Workers AI's free daily allowance running out surfaces here too
    return NextResponse.json(
      { error: 'The scanner is busy right now. Try again later.' },
      { status: 502 },
    );
  }

  const parsed = parseAnswer(answer);
  const printed = typeof parsed?.currency === 'string' ? parsed.currency.slice(0, 12) : null;
  const items: ScanItem[] = [];
  if (Array.isArray(parsed?.items)) {
    for (const raw of parsed.items.slice(0, MAX_ITEMS)) {
      const price = toNumber((raw as { price?: unknown })?.price);
      if (price == null) continue;
      const label = String((raw as { label?: unknown })?.label ?? '')
        .trim()
        .slice(0, 60);
      items.push({ label: label || 'Item', price });
    }
  }

  const body: ScanResponse = { currency: currencyFromText(printed) ?? null, printed, items };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
