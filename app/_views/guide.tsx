import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_URL } from '@/lib/config';
import { CURRENCIES } from '@/lib/currencies';
import { currencyName, localePath, type Lang } from '@/lib/i18n';
import { currencyPath } from '@/lib/paths';
import { absoluteUrl, breadcrumbJsonLd, JsonLd, pageMetadata } from './shared';

const COUNT = CURRENCIES.length;

interface Row {
  examples: string[];
  text: React.ReactNode;
}

const COPY = {
  en: {
    title: 'What you can type in Zento: currency converter guide',
    description: `Everything Zento's converter understands: amounts like 30k or 1.5m, currency names, codes and symbols, countries, splitting a bill, the price scanner, rate alerts, and all ${COUNT} supported currencies.`,
    ogTitle: 'What you can type in Zento',
    home: 'Home',
    label: 'Guide',
    heading: 'What you can type',
    intro:
      'The box at the top of Zento understands plain language. Type an amount, a currency, or both, in whatever order feels natural. It converts as you type, with no button to press. Every example below opens the converter with it filled in.',
    blocks: [
      {
        title: 'Amounts',
        rows: [
          {
            examples: ['250', '1,250.50', '30k', '1.5m', '2 bn', '10 grand'],
            text: 'Plain numbers, with or without thousands separators. Shorthand works too: k for thousand, m for million, bn for billion.',
          },
        ],
      },
      {
        title: 'Currencies',
        rows: [
          {
            examples: ['100 usd', '50 euros', '¥30,000', 'rm150', 'S$20', '₹5000'],
            text: 'Codes (USD, MYR), names (euro, ringgit, baht), plurals (pounds, dollars) and symbols ($, €, £, ¥, ₹, RM, S$) are all recognised. A bare $ means US dollars.',
          },
          {
            examples: ['100 euro to argentina', '50 dollars in japan', 'rm300 in the uk'],
            text: 'Country names stand in for their currency, so you can type where you are going instead of what they use.',
          },
        ],
      },
      {
        title: 'Putting it together',
        rows: [
          {
            examples: ['150 euro in ringgit', '2000 baht to malaysia', '€15 → £'],
            text: 'The first currency is what you have, the one after in, to, into, = or → is what you want.',
          },
          {
            examples: ['in yen', '150 euro', '42'],
            text: 'Leave parts out and Zento keeps the rest: in yen changes only the target, 150 euro only the source and amount, a bare number only the amount.',
          },
          { examples: ['usd/jpy', 'eurgbp'], text: 'A pair on its own, with or without a slash.' },
        ],
      },
      {
        title: 'Splitting a bill',
        rows: [
          {
            examples: ['hotel ¥45,000 split 3 ways', 'dinner 120 aud for 4 people'],
            text: 'Add split 3 ways or for 4 people and Zento shows each share alongside the total.',
          },
        ],
      },
    ] as { title: string; rows: Row[] }[],
    more: 'More than typing',
    extras: [
      [
        'Scan prices.',
        'The camera button reads every price on a photo of a menu, price tag or receipt and converts it. Tap a price to open it in the converter. Photos are not kept.',
      ],
      [
        'Rate alerts.',
        'Alert, under the result, notifies you once when a rate goes above or below a number you choose. No account needed; on iPhone, add Zento to your Home Screen first.',
      ],
      [
        'Keyboard.',
        'Press / or ⌘K to jump to the box, Esc to clear it, and Alt+S to swap the currencies.',
      ],
      [
        'AI assistants.',
        `Zento runs a Model Context Protocol server at ${APP_URL}/mcp, so assistants can look up live rates directly.`,
      ],
    ],
    all: `All ${COUNT} currencies`,
    allNote: 'Each links to its profile: where it is used and what it is worth today.',
  },
  ms: {
    title: 'Apa yang boleh ditaip dalam Zento: panduan penukar mata wang',
    description: `Semua yang difahami oleh penukar Zento: jumlah seperti 30k atau 5 ribu, nama mata wang, kod dan simbol, negara, membahagi bil, pengimbas harga, amaran kadar, dan kesemua ${COUNT} mata wang yang disokong.`,
    ogTitle: 'Apa yang boleh ditaip dalam Zento',
    home: 'Utama',
    label: 'Panduan',
    heading: 'Apa yang boleh ditaip',
    intro:
      'Kotak di bahagian atas Zento memahami bahasa biasa. Taip jumlah, mata wang, atau kedua-duanya, dalam apa jua susunan. Ia menukar semasa anda menaip, tanpa butang untuk ditekan. Setiap contoh di bawah membuka penukar dengan contoh itu sudah diisi.',
    blocks: [
      {
        title: 'Jumlah',
        rows: [
          {
            examples: ['250', '1,250.50', '30k', '5 ribu', '1.5 juta', '2 bilion'],
            text: 'Nombor biasa, dengan atau tanpa pemisah ribuan. Singkatan juga boleh: k atau ribu, m atau juta, bn atau bilion.',
          },
        ],
      },
      {
        title: 'Mata wang',
        rows: [
          {
            examples: ['100 usd', '50 dolar', '¥30,000', 'rm150', 'S$20', '₹5000'],
            text: 'Kod (USD, MYR), nama (euro, ringgit, baht, dolar, paun) dan simbol ($, €, £, ¥, ₹, RM, S$) semuanya difahami. $ sahaja bermaksud dolar AS.',
          },
          {
            examples: ['100 euro ke argentina', '50 dolar ke jepun', 'rm300 ke korea selatan'],
            text: 'Nama negara boleh menggantikan mata wangnya, jadi anda boleh menaip destinasi anda dan bukan mata wang yang digunakan di sana.',
          },
        ],
      },
      {
        title: 'Menggabungkan semuanya',
        rows: [
          {
            examples: ['150 euro ke ringgit', '2000 baht ke malaysia', '€15 → £'],
            text: 'Mata wang pertama ialah yang anda ada, dan yang selepas ke, kepada, dalam, = atau → ialah yang anda mahu.',
          },
          {
            examples: ['ke yen', '150 euro', '42'],
            text: 'Tinggalkan sebahagian dan Zento mengekalkan yang lain: ke yen hanya menukar sasaran, 150 euro hanya sumber dan jumlah, nombor sahaja hanya jumlah.',
          },
          {
            examples: ['usd/jpy', 'eurgbp'],
            text: 'Pasangan sahaja, dengan atau tanpa garis miring.',
          },
        ],
      },
      {
        title: 'Membahagi bil',
        rows: [
          {
            examples: ['hotel ¥45,000 bahagi 3', 'makan 120 aud untuk 4 orang'],
            text: 'Tambah bahagi 3 atau untuk 4 orang dan Zento menunjukkan bahagian setiap orang di samping jumlahnya.',
          },
        ],
      },
    ],
    more: 'Lebih daripada menaip',
    extras: [
      [
        'Imbas harga.',
        'Butang kamera membaca setiap harga pada gambar menu, tanda harga atau resit dan menukarnya. Ketik harga untuk membukanya dalam penukar. Gambar tidak disimpan.',
      ],
      [
        'Amaran kadar.',
        'Amaran, di bawah hasil, memberitahu anda sekali apabila kadar melebihi atau jatuh di bawah nombor yang anda pilih. Tiada akaun diperlukan; pada iPhone, tambah Zento ke Skrin Utama dahulu.',
      ],
      [
        'Papan kekunci.',
        'Tekan / atau ⌘K untuk ke kotak, Esc untuk mengosongkannya, dan Alt+S untuk menukar arah mata wang.',
      ],
      [
        'Pembantu AI.',
        `Zento menjalankan pelayan Model Context Protocol di ${APP_URL}/mcp, supaya pembantu AI boleh menyemak kadar semasa secara terus.`,
      ],
    ],
    all: `Kesemua ${COUNT} mata wang`,
    allNote: 'Setiap satu dipautkan ke profilnya: di mana ia digunakan dan nilainya hari ini.',
  },
} satisfies Record<Lang, unknown>;

export function guideMetadata(lang: Lang): Metadata {
  const c = COPY[lang];
  return pageMetadata(lang, '/guide', {
    title: c.title,
    absolute: true,
    description: c.description,
    ogTitle: c.ogTitle,
  });
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-2 t-h2 text-ink">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

export function GuideView({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const home = localePath(lang, '/');
  const collator = new Intl.Collator(lang);

  return (
    <main className="mx-auto max-w-2xl px-5 pt-28 pb-16 sm:px-6 sm:pt-36">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: c.home, url: absoluteUrl(lang, '/') },
          { name: c.label, url: absoluteUrl(lang, '/guide') },
        ])}
      />
      <h1 className="t-label text-ink-3">{c.label}</h1>
      <p className="mt-2 text-3xl font-medium tracking-tight text-ink">{c.heading}</p>
      <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{c.intro}</p>

      {c.blocks.map((block) => (
        <Block key={block.title} title={block.title}>
          {block.rows.map((row) => (
            <div
              key={row.examples[0]}
              className="grid gap-x-10 gap-y-2 py-5 sm:grid-cols-[1fr_1.1fr]"
            >
              <p className="text-[15px] leading-relaxed text-ink-2">{row.text}</p>
              <ul className="flex flex-wrap gap-x-5 text-[15px] sm:block">
                {row.examples.map((q) => (
                  <li key={q}>
                    {/* An example that opens the converter with it already typed. Padding
                        rather than `hit`: these sit in tight rows, and overlapping hit
                        areas would make neighbours ambiguous */}
                    <Link
                      href={`${home}?q=${encodeURIComponent(q)}`}
                      className="inline-block py-1.5 text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent"
                    >
                      {q}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Block>
      ))}

      <Block title={c.more}>
        <div className="space-y-4 py-5 text-[15px] leading-relaxed text-ink-2">
          {c.extras.map(([lead, body]) => (
            <p key={lead}>
              <span className="text-ink">{lead}</span> {body}
            </p>
          ))}
        </div>
      </Block>

      <section className="mt-16">
        <h2 className="mb-2 t-h2 text-ink">{c.all}</h2>
        <p className="mb-6 text-[15px] text-ink-2">{c.allNote}</p>
        <ul className="grid grid-cols-1 gap-x-8 text-sm sm:grid-cols-2">
          {[...CURRENCIES]
            .sort((a, b) => collator.compare(a.code, b.code))
            .map((cur) => (
              <li key={cur.code}>
                <Link
                  href={localePath(lang, currencyPath(cur.code))}
                  className="group flex gap-3 py-2.5"
                >
                  <span className="w-10 shrink-0 font-medium text-ink group-hover:text-accent">
                    {cur.code}
                  </span>
                  <span className="truncate text-ink-3 group-hover:text-ink-2">
                    {currencyName(cur.code, lang)}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
