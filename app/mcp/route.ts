// Zento as a tool for AI assistants: an MCP server over Streamable HTTP at /mcp.
// Stateless, so every request gets a fresh server and nothing is kept between calls,
// which is what a Worker wants. All data comes from the same cached layer as the site.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { APP_URL } from '@/lib/config';
import { CURRENCIES, getCurrency, hasHistory } from '@/lib/currencies';
import { ECB_START } from '@/lib/dates';
import { getEcbTable, getHistory, getLatestTable } from '@/lib/rates';
import { withinLimit } from '@/lib/rate-limit';

const code = z
  .string()
  .length(3)
  .transform((s) => s.toUpperCase())
  .refine((s) => getCurrency(s) != null, 'Unknown ISO 4217 currency code')
  .describe('ISO 4217 currency code, e.g. USD, EUR, MYR');

function text(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value as Record<string, unknown>,
  };
}

function failure(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

function pairUrl(from: string, to: string): string {
  return `${APP_URL}/${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

function buildServer(): McpServer {
  const server = new McpServer({
    name: 'zento',
    title: 'Zento currency converter',
    version: '1.0.0',
  });
  const readOnly = { readOnlyHint: true, openWorldHint: true };

  server.registerTool(
    'convert',
    {
      title: 'Convert currency',
      description:
        'Convert an amount between two of 153 currencies at the live mid-market rate (ExchangeRate-API, ECB fallback).',
      inputSchema: {
        amount: z.number().positive().describe('Amount in the source currency'),
        from: code,
        to: code,
      },
      annotations: readOnly,
    },
    async ({ amount, from, to }) => {
      try {
        const table = await getLatestTable(from);
        const rate = from === to ? 1 : table.rates[to];
        if (rate == null) return failure(`No rate published for ${from} to ${to}`);
        return text({
          amount,
          from,
          to,
          rate,
          result: Math.round(amount * rate * 1e6) / 1e6,
          date: table.date,
          url: pairUrl(from, to),
        });
      } catch {
        return failure('Rates are unavailable right now. Try again shortly.');
      }
    },
  );

  server.registerTool(
    'get_rates',
    {
      title: 'Latest exchange rates',
      description: 'Latest mid-market rates from one base currency to one or more targets.',
      inputSchema: {
        base: code,
        symbols: z.array(code).min(1).max(40).describe('Target currency codes'),
      },
      annotations: readOnly,
    },
    async ({ base, symbols }) => {
      try {
        const table = await getLatestTable(base);
        const rates: Record<string, number> = {};
        for (const s of symbols) if (table.rates[s] != null) rates[s] = table.rates[s];
        return text({ base, date: table.date, rates });
      } catch {
        return failure('Rates are unavailable right now. Try again shortly.');
      }
    },
  );

  server.registerTool(
    'rate_history',
    {
      title: 'Exchange rate history',
      description:
        'Daily ECB reference rates for a pair over the last N days, with high, low, average and change. Only the ~30 currencies the ECB publishes have history.',
      inputSchema: {
        base: code,
        target: code,
        days: z.number().int().min(2).max(400).describe('How many days back, up to 400'),
      },
      annotations: readOnly,
    },
    async ({ base, target, days }) => {
      if (!hasHistory(base) || !hasHistory(target) || base === target) {
        return failure(`The ECB publishes no history for ${base}/${target}.`);
      }
      try {
        const points = await getHistory(base, target, days);
        if (points.length === 0) return failure('No history in that range.');
        const rates = points.map((p) => p.rate);
        const first = rates[0];
        const last = rates[rates.length - 1];
        return text({
          base,
          target,
          from: points[0].date,
          to: points[points.length - 1].date,
          high: Math.max(...rates),
          low: Math.min(...rates),
          average: rates.reduce((a, b) => a + b, 0) / rates.length,
          changePct: ((last - first) / first) * 100,
          points,
        });
      } catch {
        return failure('History is unavailable right now. Try again shortly.');
      }
    },
  );

  server.registerTool(
    'rate_on_date',
    {
      title: 'Historical exchange rate',
      description: `The ECB reference rate for a pair on a past date (from ${ECB_START}). Weekends resolve to the previous business day.`,
      inputSchema: {
        base: code,
        target: code,
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe('YYYY-MM-DD'),
      },
      annotations: readOnly,
    },
    async ({ base, target, date }) => {
      if (!hasHistory(base) || !hasHistory(target) || base === target) {
        return failure(`The ECB publishes no history for ${base}/${target}.`);
      }
      const today = new Date().toISOString().split('T')[0];
      if (date < ECB_START || date > today) {
        return failure(`date must be between ${ECB_START} and today`);
      }
      try {
        const table = await getEcbTable(base, date);
        const rate = table.rates[target];
        if (rate == null) return failure(`No ECB rate for ${base}/${target} on ${date}.`);
        return text({ base, target, requested: date, date: table.date, rate });
      } catch {
        return failure('Rates are unavailable right now. Try again shortly.');
      }
    },
  );

  server.registerTool(
    'list_currencies',
    {
      title: 'Supported currencies',
      description:
        'Every currency Zento converts, with name, symbol and whether ECB history exists.',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () =>
      text({
        currencies: CURRENCIES.map((c) => ({
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          history: hasHistory(c.code),
        })),
      }),
  );

  return server;
}

async function handle(request: Request): Promise<Response> {
  if (!(await withinLimit('MCP_LIMITER', request))) {
    return Response.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32000, message: 'Rate limited. Try again in a minute.' },
      },
      { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } },
    );
  }
  try {
    const server = buildServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (err) {
    // Tool errors are already returned as results; this is the transport itself failing.
    // Answer in JSON-RPC so MCP clients can show something better than a bare 500.
    console.error('MCP request failed', err);
    return Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32603, message: 'Internal error' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export { handle as GET, handle as POST, handle as DELETE };
