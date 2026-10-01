import type { Metadata } from 'next';
import Link from 'next/link';
import { CURRENCIES, hasHistory } from '@/lib/currencies';
import { APP_URL, STATIC_PAIRS } from '@/lib/config';
import { localePath, type Lang } from '@/lib/i18n';
import { absoluteUrl, breadcrumbJsonLd, faqJsonLd, JsonLd, pageMetadata } from './shared';

const COUNT = CURRENCIES.length;
const HISTORY_COUNT = CURRENCIES.filter((c) => hasHistory(c.code)).length;

const COPY = {
  en: {
    // Absolute: the "| Zento" template would render "About Zento | Zento"
    title: 'About Zento: a free currency converter you type into',
    description: `What Zento is, what it can do, where its exchange rates come from and what it stores. A free currency converter for ${COUNT} currencies at the live mid-market rate.`,
    ogTitle: 'About Zento',
    home: 'Home',
    label: 'About Zento',
    crumb: 'About',
    heading: 'Type an amount. Get the answer.',
    intro: `Zento is a free currency converter for ${COUNT} currencies. Instead of dropdowns and buttons, there is one box: type 150 euro in yen, ¥30k to sgd or hotel ¥45,000 split 3 ways and the answer appears as you type. It shows the mid-market rate, the honest midpoint between buy and sell prices, not a marked-up rate quoted to sell you something.`,
    does: 'What it does',
    features: [
      [
        'Converts as you type',
        'in plain language: amounts, currency names, codes, symbols and even country names.',
      ],
      [
        'Shows the bigger picture:',
        'what your amount is worth in other currencies, how the rate has moved, what it bought years ago, and where your money goes further than a year ago.',
      ],
      ['Reads prices from a photo', 'of a menu, price tag or receipt and converts every one.'],
      [
        'Tells you when a rate moves',
        'past a number you pick, with a notification and no account.',
      ],
      [
        'Works with AI assistants',
        'through a Model Context Protocol server, so they can look up live rates directly.',
      ],
    ],
    guideLink: 'See everything it understands',
    sources: 'Where the rates come from',
    sourceRows: [
      ['Live rates', 'ExchangeRate-API, published daily and cached for up to an hour'],
      [
        'History',
        `European Central Bank reference rates via Frankfurter: ${HISTORY_COUNT} currencies, each business day, back to 1999`,
      ],
      ['Rate type', 'Mid-market only'],
      ['Cost', 'Free, no account'],
    ],
    disclaimer:
      'Zento is a reference tool, not a financial service, and nothing here is financial advice.',
    questions: 'Questions',
    faq: [
      {
        q: 'What is Zento?',
        a: `Zento is a free currency converter for ${COUNT} currencies at the live mid-market rate. You type what you want to convert, like 150 euro in yen, and the answer appears as you type. There is no sign-up, no account and no fee.`,
      },
      {
        q: 'Who makes Zento?',
        a: 'Zento is built and maintained by iCool, an independent developer. It is a personal project rather than a company product, and its source code is public on GitHub.',
      },
      {
        q: 'Is Zento free?',
        a: 'Yes, entirely. No account, no ads, no paid tier and no limit on conversions. Zento never handles money and never asks for payment details.',
      },
      {
        q: 'Where do the rates come from, and how fresh are they?',
        a: `Live rates come from ExchangeRate-API, which publishes once a day; Zento caches them for up to an hour and the page checks for new ones every minute. Charts, the then-and-now comparison and 30-day ranges use European Central Bank reference rates via Frankfurter, which cover ${HISTORY_COUNT} of the currencies Zento supports and update each business day. All figures are mid-market rates.`,
      },
      {
        q: 'Does Zento exchange money?',
        a: 'No. Zento is a reference tool. It shows what a conversion is worth at the mid-market rate; it does not transfer, hold or exchange money, and a bank or transfer service will add a margin on top of the rate you see here.',
      },
      {
        q: 'What does Zento store about me?',
        a: "No account and no tracking. Zento sets one cookie to remember the last pair you used, and your browser keeps a short list of recent pairs locally. Photos you scan are read and discarded, never stored. If you set a rate alert, Zento keeps the alert and your browser's push address until the alert fires or you delete it.",
      },
    ],
    popular: 'Popular conversions',
    pairLink: (a: string, b: string) => `${a} to ${b}`,
    open: 'Open the converter',
    readGuide: 'Read the guide',
  },
  ms: {
    title: 'Perihal Zento: penukar mata wang percuma yang anda taip',
    description: `Apa itu Zento, apa yang boleh dilakukannya, dari mana kadar pertukarannya datang dan apa yang disimpannya. Penukar mata wang percuma untuk ${COUNT} mata wang pada kadar pasaran tengah semasa.`,
    ogTitle: 'Perihal Zento',
    home: 'Utama',
    label: 'Perihal Zento',
    crumb: 'Perihal',
    heading: 'Taip jumlah. Dapatkan jawapan.',
    intro: `Zento ialah penukar mata wang percuma untuk ${COUNT} mata wang. Tiada menu lungsur dan butang, hanya satu kotak: taip 150 euro ke yen, ¥30k ke sgd atau hotel ¥45,000 bahagi 3 dan jawapannya muncul semasa anda menaip. Ia menunjukkan kadar pasaran tengah, titik tengah yang jujur antara harga beli dan jual, bukan kadar yang dinaikkan untuk menjual sesuatu kepada anda.`,
    does: 'Apa yang dilakukannya',
    features: [
      [
        'Menukar semasa anda menaip',
        'dalam bahasa biasa: jumlah, nama mata wang, kod, simbol dan juga nama negara.',
      ],
      [
        'Menunjukkan gambaran lebih besar:',
        'nilai jumlah anda dalam mata wang lain, pergerakan kadar, apa yang boleh dibelinya bertahun-tahun dahulu, dan di mana wang anda lebih bernilai berbanding setahun lalu.',
      ],
      ['Membaca harga daripada gambar', 'menu, tanda harga atau resit dan menukar setiap satunya.'],
      [
        'Memberitahu apabila kadar bergerak',
        'melepasi nombor yang anda pilih, dengan pemberitahuan dan tanpa akaun.',
      ],
      [
        'Berfungsi dengan pembantu AI',
        'melalui pelayan Model Context Protocol, supaya ia boleh menyemak kadar semasa secara terus.',
      ],
    ],
    guideLink: 'Lihat semua yang difahaminya',
    sources: 'Dari mana kadar datang',
    sourceRows: [
      ['Kadar semasa', 'ExchangeRate-API, diterbitkan setiap hari dan dicache sehingga sejam'],
      [
        'Sejarah',
        `Kadar rujukan Bank Pusat Eropah melalui Frankfurter: ${HISTORY_COUNT} mata wang, setiap hari bekerja, sejak 1999`,
      ],
      ['Jenis kadar', 'Pasaran tengah sahaja'],
      ['Kos', 'Percuma, tanpa akaun'],
    ],
    disclaimer:
      'Zento ialah alat rujukan, bukan perkhidmatan kewangan, dan tiada apa-apa di sini merupakan nasihat kewangan.',
    questions: 'Soalan',
    faq: [
      {
        q: 'Apa itu Zento?',
        a: `Zento ialah penukar mata wang percuma untuk ${COUNT} mata wang pada kadar pasaran tengah semasa. Anda menaip apa yang ingin ditukar, contohnya 150 euro ke yen, dan jawapannya muncul semasa anda menaip. Tiada pendaftaran, tiada akaun dan tiada caj.`,
      },
      {
        q: 'Siapa yang membina Zento?',
        a: 'Zento dibina dan diselenggara oleh iCool, seorang pembangun bebas. Ia projek peribadi dan bukan produk syarikat, dan kod sumbernya terbuka di GitHub.',
      },
      {
        q: 'Adakah Zento percuma?',
        a: 'Ya, sepenuhnya. Tiada akaun, tiada iklan, tiada pelan berbayar dan tiada had penukaran. Zento tidak pernah mengendalikan wang dan tidak pernah meminta butiran pembayaran.',
      },
      {
        q: 'Dari mana kadar datang, dan sejauh mana ia terkini?',
        a: `Kadar semasa datang daripada ExchangeRate-API, yang diterbitkan sekali sehari; Zento menyimpannya dalam cache sehingga sejam dan halaman menyemak kadar baharu setiap minit. Carta, perbandingan dulu dan kini serta julat 30 hari menggunakan kadar rujukan Bank Pusat Eropah melalui Frankfurter, yang meliputi ${HISTORY_COUNT} daripada mata wang yang disokong Zento dan dikemas kini setiap hari bekerja. Semua angka ialah kadar pasaran tengah.`,
      },
      {
        q: 'Adakah Zento menukar wang?',
        a: 'Tidak. Zento ialah alat rujukan. Ia menunjukkan nilai sesuatu penukaran pada kadar pasaran tengah; ia tidak memindahkan, menyimpan atau menukar wang, dan bank atau perkhidmatan pemindahan wang akan menambah margin di atas kadar yang anda lihat di sini.',
      },
      {
        q: 'Apa yang Zento simpan tentang saya?',
        a: 'Tiada akaun dan tiada penjejakan. Zento menetapkan satu kuki untuk mengingati pasangan terakhir yang anda gunakan, dan pelayar anda menyimpan senarai pendek pasangan terkini secara setempat. Gambar yang anda imbas dibaca dan dibuang, tidak pernah disimpan. Jika anda menetapkan amaran kadar, Zento menyimpan amaran itu dan alamat pemberitahuan pelayar anda sehingga amaran dihantar atau anda memadamnya.',
      },
    ],
    popular: 'Penukaran popular',
    pairLink: (a: string, b: string) => `${a} ke ${b}`,
    open: 'Buka penukar',
    readGuide: 'Baca panduan',
  },
} satisfies Record<Lang, unknown>;

export function aboutMetadata(lang: Lang): Metadata {
  const c = COPY[lang];
  return pageMetadata(lang, '/about', {
    title: c.title,
    absolute: true,
    description: c.description,
    ogTitle: c.ogTitle,
  });
}

export function AboutView({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const pageUrl = absoluteUrl(lang, '/about');
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${pageUrl}#page`,
      name: c.ogTitle,
      url: pageUrl,
      inLanguage: lang,
      mainEntity: { '@id': `${APP_URL}/#organization` },
      isPartOf: { '@id': `${APP_URL}/#website` },
    },
    faqJsonLd(c.faq),
    breadcrumbJsonLd([
      { name: c.home, url: absoluteUrl(lang, '/') },
      { name: c.crumb, url: pageUrl },
    ]),
  ];

  return (
    <main className="mx-auto max-w-2xl px-5 pt-28 pb-16 sm:px-6 sm:pt-36">
      <JsonLd data={structuredData} />

      <h1 className="t-label text-ink-3">{c.label}</h1>
      <p className="mt-2 text-3xl font-medium tracking-tight text-ink">{c.heading}</p>
      <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{c.intro}</p>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">{c.does}</h2>
        <ul className="space-y-3 text-[15px] leading-relaxed text-ink-2">
          {c.features.map(([lead, body], i) => (
            <li key={lead}>
              <span className="text-ink">{lead}</span> {body}
              {i === 0 && (
                <>
                  {' '}
                  <Link
                    href={localePath(lang, '/guide')}
                    className="text-ink underline decoration-line-strong underline-offset-4 hover:text-accent"
                  >
                    {c.guideLink}
                  </Link>
                  .
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">{c.sources}</h2>
        <dl className="space-y-4 text-[15px]">
          {c.sourceRows.map(([term, detail]) => (
            <div key={term} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
              <dt className="t-label text-ink-3">{term}</dt>
              <dd className="text-ink-2">{detail}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 t-label text-ink-3">{c.disclaimer}</p>
      </section>

      <section className="mt-14">
        <h2 className="mb-2 t-h2 text-ink">{c.questions}</h2>
        <div className="divide-y divide-line">
          {c.faq.map(({ q, a }) => (
            <div key={q} className="py-5">
              <h3 className="text-[15px] text-ink">{q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-4 t-h2 text-ink">{c.popular}</h2>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          {STATIC_PAIRS.slice(0, 18).map((pair) => {
            const [from, , to] = pair.split('-');
            return (
              <li key={pair}>
                <Link
                  href={localePath(lang, `/${pair}`)}
                  className="text-ink-2 transition-colors hover:text-ink"
                >
                  {c.pairLink(from.toUpperCase(), to.toUpperCase())}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-14 flex gap-6 text-[15px]">
        <Link href={localePath(lang, '/')} className="text-accent hover:opacity-80">
          {c.open}
        </Link>
        <Link href={localePath(lang, '/guide')} className="text-ink-2 hover:text-ink">
          {c.readGuide}
        </Link>
      </p>
    </main>
  );
}
