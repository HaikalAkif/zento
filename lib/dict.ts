// Every string the shared UI shows, in each language. `ms` is typed as `Dict`, so a
// missing or misspelt key in either language fails type-checking.

import type { Lang } from './i18n';

const en = {
  nav: { guide: 'Guide', about: 'About', home: 'Zento home', switchTo: 'Baca dalam Bahasa Melayu' },
  footer: {
    rates: 'Mid-market rates from',
    and: 'and the',
    notAdvice: 'Not financial advice.',
    guide: 'Guide',
    about: 'About',
    more: 'iCool',
  },
  converter: {
    label: 'Type an amount, a currency or a question',
    staticPlaceholder: '150 euro in yen',
    examples: (local: string) => [
      local === 'USD' ? '100 usd in euros' : `100 usd in ${local.toLowerCase()}`,
      '150 euro in ringgit',
      '¥30k to sgd',
      'hotel ¥45,000 split 3 ways',
      '100 euro to argentina',
      '1.5m idr in usd',
    ],
    tryWord: 'Try',
    tryExamples: ['150 euro in yen', '¥30k to sgd', 'dinner 120 aud split 3 ways'],
    unparsed: 'Try an amount and a currency, like "50 pounds in yen"',
    split: (n: number, each: string, to: string) => `Split ${n} ways: ${each} ${to} each`,
    guideButton: 'What can I type? Open the guide',
    guideTitle: 'What can I type?',
    pickFrom: (name: string) => `Convert from ${name}. Change`,
    pickTo: (name: string) => `Convert to ${name}. Change`,
    noRate: (from: string, to: string) => `There's no live rate for ${from} to ${to} right now.`,
    unavailable: 'Rates are unavailable right now. Try again shortly.',
    today: 'today',
    swap: 'Swap',
    swapTitle: 'Swap (Alt+S)',
    copy: 'Copy',
    copied: 'Copied',
    share: 'Share',
    linkCopied: 'Link copied',
    alert: 'Alert',
    shareTitle: (from: string, to: string) => `${from} to ${to} on Zento`,
  },
  section: {
    elsewhere: (amount: string, from: string) => `${amount} ${from} elsewhere`,
    overTime: (from: string, to: string) => `${from} to ${to} over time`,
    thenAndNow: 'Then and now',
    goesFurther: (name: string) => `Where ${name} goes further`,
    detail: (from: string, to: string) => `${from} to ${to} in detail`,
    otherDetails: (from: string, to: string) => `Rates, tables and history for ${from} to ${to}`,
    pairHeading: (from: string, to: string) => `${from} to ${to} exchange rate`,
    docTitle: (from: string, to: string) => `${from} to ${to}: Live Exchange Rate | Zento`,
  },
  picker: {
    from: 'Convert from',
    to: 'Convert to',
    search: 'Search currency or code',
    searchLabel: 'Search currencies',
    list: 'Currencies',
    none: 'No currency matches',
    recent: 'recent',
  },
  compare: {
    unavailable: 'Rates are unavailable right now.',
    noRate: 'no rate',
    convert: (from: string, to: string) => `Convert ${from} to ${to}`,
  },
  chart: {
    over: 'over',
    periods: { '3D': '3D', '7D': '7D', '30D': '30D', '1Y': '1Y' },
    period: 'Chart period',
    unavailable: 'Chart unavailable for this pair right now',
    noHistory:
      'No rate history for this pair. The European Central Bank publishes about 30 major currencies; live conversion still works.',
  },
  timeMachine: {
    years: (n: number) => `${n} ${n === 1 ? 'year' : 'years'}`,
    scrubber: 'Years back in time',
    scrubberValue: (n: number, date: string) => `${n} years ago, ${date}`,
    unavailable: 'Past rates are unavailable right now.',
    sentence: {
      on: 'On',
      bought: 'bought',
      todayBuys: 'Today it buys',
      more: 'more',
      less: 'less',
    },
    source: 'European Central Bank reference rates, back to 1999.',
  },
  globe: {
    unavailable: 'The globe is unavailable right now.',
    furthest: 'Goes furthest',
    less: 'Buys less',
    footnote: (base: string, since: string) =>
      `Change in what 1 ${base} buys since ${since}. ECB reference rates.`,
    convert: (base: string, name: string, pct: string, more: boolean) =>
      `Convert ${base} to ${name}. Your ${base} buys ${pct}% ${more ? 'more' : 'less'} than a year ago`,
  },
  alert: {
    sentence: (base: string) => `Tell me when 1 ${base} goes`,
    direction: 'Direction',
    above: 'above',
    below: 'below',
    threshold: (target: string) => `Threshold rate in ${target}`,
    set: 'Set alert',
    setting: 'Setting…',
    positive: 'Enter a rate above zero.',
    done: (base: string, direction: string, value: string, target: string) =>
      `We'll notify you once when 1 ${base} goes ${direction} ${value} ${target}.`,
    failed: 'Could not set the alert.',
    remove: 'Remove',
    removeLabel: (desc: string) => `Delete alert for ${desc}`,
    deleteFailed: (msg: string) => `Couldn't delete: ${msg}`,
    deleteGeneric: "Couldn't delete the alert.",
    footnote: 'Checked hourly. Each alert fires once. No account needed.',
    unsupported: "This browser can't receive push notifications.",
    iosInstall:
      'On iPhone and iPad, add Zento to your Home Screen (Share, then Add to Home Screen), then open it from there to set alerts.',
    denied:
      'Notifications are blocked for this site. Allow them in your browser settings to set alerts.',
  },
  scanner: {
    button: 'Scan prices with your camera',
    buttonTitle: 'Scan a menu or price tag',
    title: 'Price scanner',
    close: 'Close scanner',
    reading: 'Reading prices…',
    photoAlt: 'What you scanned',
    pricesIn: 'Prices in',
    shownIn: 'shown in',
    sourceLabel: 'Currency on the photo',
    targetLabel: 'Convert into',
    read: (printed: string, code: string | null) =>
      code
        ? `Read "${printed}" on the photo as ${code}`
        : `Read "${printed}" on the photo, which we could not match. Pick the currency above.`,
    none: 'No prices found. Try a closer, straighter shot with good light.',
    footnote: "Tap a price to open it in the converter. Zento doesn't keep your photos.",
    again: 'New photo',
    failed: 'Could not read that photo.',
  },
};

export type Dict = typeof en;

const ms: Dict = {
  nav: {
    guide: 'Panduan',
    about: 'Perihal',
    home: 'Laman utama Zento',
    switchTo: 'Read in English',
  },
  footer: {
    rates: 'Kadar pasaran tengah daripada',
    and: 'dan',
    notAdvice: 'Bukan nasihat kewangan.',
    guide: 'Panduan',
    about: 'Perihal',
    more: 'iCool',
  },
  converter: {
    label: 'Taip jumlah, mata wang atau soalan',
    staticPlaceholder: '150 euro ke yen',
    examples: (local: string) => [
      local === 'USD' ? '100 usd ke euro' : `100 usd ke ${local.toLowerCase()}`,
      '150 euro ke ringgit',
      '¥30k ke sgd',
      'hotel ¥45,000 bahagi 3',
      '100 euro ke argentina',
      '5 ribu baht ke ringgit',
    ],
    tryWord: 'Cuba',
    tryExamples: ['150 euro ke yen', '¥30k ke sgd', 'makan 120 aud bahagi 3'],
    unparsed: 'Cuba jumlah dan mata wang, contohnya "50 paun ke yen"',
    split: (n: number, each: string, to: string) => `Bahagi ${n}: ${each} ${to} seorang`,
    guideButton: 'Apa yang boleh saya taip? Buka panduan',
    guideTitle: 'Apa yang boleh saya taip?',
    pickFrom: (name: string) => `Tukar daripada ${name}. Ubah`,
    pickTo: (name: string) => `Tukar kepada ${name}. Ubah`,
    noRate: (from: string, to: string) =>
      `Tiada kadar semasa untuk ${from} ke ${to} buat masa ini.`,
    unavailable: 'Kadar tidak tersedia buat masa ini. Cuba lagi sebentar.',
    today: 'hari ini',
    swap: 'Tukar arah',
    swapTitle: 'Tukar arah (Alt+S)',
    copy: 'Salin',
    copied: 'Disalin',
    share: 'Kongsi',
    linkCopied: 'Pautan disalin',
    alert: 'Amaran',
    shareTitle: (from: string, to: string) => `${from} ke ${to} di Zento`,
  },
  section: {
    elsewhere: (amount: string, from: string) => `${amount} ${from} dalam mata wang lain`,
    overTime: (from: string, to: string) => `${from} ke ${to} dari semasa ke semasa`,
    thenAndNow: 'Dulu dan kini',
    goesFurther: (name: string) => `Di mana ${name} lebih bernilai`,
    detail: (from: string, to: string) => `Butiran ${from} ke ${to}`,
    otherDetails: (from: string, to: string) => `Kadar, jadual dan sejarah untuk ${from} ke ${to}`,
    pairHeading: (from: string, to: string) => `Kadar pertukaran ${from} ke ${to}`,
    docTitle: (from: string, to: string) => `${from} ke ${to}: Kadar Pertukaran Semasa | Zento`,
  },
  picker: {
    from: 'Tukar daripada',
    to: 'Tukar kepada',
    search: 'Cari mata wang atau kod',
    searchLabel: 'Cari mata wang',
    list: 'Mata wang',
    none: 'Tiada mata wang yang sepadan',
    recent: 'terkini',
  },
  compare: {
    unavailable: 'Kadar tidak tersedia buat masa ini.',
    noRate: 'tiada kadar',
    convert: (from: string, to: string) => `Tukar ${from} kepada ${to}`,
  },
  chart: {
    over: 'dalam',
    periods: { '3D': '3H', '7D': '7H', '30D': '30H', '1Y': '1T' },
    period: 'Tempoh carta',
    unavailable: 'Carta tidak tersedia untuk pasangan ini buat masa ini',
    noHistory:
      'Tiada sejarah kadar untuk pasangan ini. Bank Pusat Eropah menerbitkan kira-kira 30 mata wang utama; penukaran semasa masih berfungsi.',
  },
  timeMachine: {
    years: (n: number) => `${n} tahun`,
    scrubber: 'Tahun ke belakang',
    scrubberValue: (n: number, date: string) => `${n} tahun lalu, ${date}`,
    unavailable: 'Kadar lampau tidak tersedia buat masa ini.',
    sentence: {
      on: 'Pada',
      bought: 'boleh membeli',
      todayBuys: 'Hari ini ia boleh membeli',
      more: 'lebih',
      less: 'kurang',
    },
    source: 'Kadar rujukan Bank Pusat Eropah, sejak 1999.',
  },
  globe: {
    unavailable: 'Glob tidak tersedia buat masa ini.',
    furthest: 'Paling bernilai',
    less: 'Kurang bernilai',
    footnote: (base: string, since: string) =>
      `Perubahan nilai 1 ${base} sejak ${since}. Kadar rujukan ECB.`,
    convert: (base: string, name: string, pct: string, more: boolean) =>
      `Tukar ${base} kepada ${name}. ${base} anda boleh membeli ${pct}% ${more ? 'lebih' : 'kurang'} berbanding setahun lalu`,
  },
  alert: {
    sentence: (base: string) => `Beritahu saya apabila 1 ${base}`,
    direction: 'Arah',
    above: 'melebihi',
    below: 'di bawah',
    threshold: (target: string) => `Kadar sasaran dalam ${target}`,
    set: 'Tetapkan amaran',
    setting: 'Sedang menetapkan…',
    positive: 'Masukkan kadar yang melebihi sifar.',
    done: (base: string, direction: string, value: string, target: string) =>
      `Kami akan memberitahu anda sekali apabila 1 ${base} ${direction} ${value} ${target}.`,
    failed: 'Amaran tidak dapat ditetapkan.',
    remove: 'Buang',
    removeLabel: (desc: string) => `Padam amaran untuk ${desc}`,
    deleteFailed: (msg: string) => `Tidak dapat dipadam: ${msg}`,
    deleteGeneric: 'Amaran tidak dapat dipadam.',
    footnote: 'Disemak setiap jam. Setiap amaran dihantar sekali sahaja. Tiada akaun diperlukan.',
    unsupported: 'Pelayar ini tidak dapat menerima pemberitahuan tolak.',
    iosInstall:
      'Pada iPhone dan iPad, tambah Zento ke Skrin Utama (Kongsi, kemudian Tambah ke Skrin Utama), kemudian buka dari situ untuk menetapkan amaran.',
    denied:
      'Pemberitahuan disekat untuk laman ini. Benarkan dalam tetapan pelayar anda untuk menetapkan amaran.',
  },
  scanner: {
    button: 'Imbas harga dengan kamera',
    buttonTitle: 'Imbas menu atau tanda harga',
    title: 'Pengimbas harga',
    close: 'Tutup pengimbas',
    reading: 'Sedang membaca harga…',
    photoAlt: 'Apa yang anda imbas',
    pricesIn: 'Harga dalam',
    shownIn: 'dipaparkan dalam',
    sourceLabel: 'Mata wang pada gambar',
    targetLabel: 'Tukar kepada',
    read: (printed: string, code: string | null) =>
      code
        ? `"${printed}" pada gambar dibaca sebagai ${code}`
        : `"${printed}" pada gambar tidak dapat dipadankan. Pilih mata wang di atas.`,
    none: 'Tiada harga ditemui. Cuba ambil gambar lebih dekat, lurus dan terang.',
    footnote: 'Ketik harga untuk membukanya dalam penukar. Zento tidak menyimpan gambar anda.',
    again: 'Gambar baharu',
    failed: 'Gambar itu tidak dapat dibaca.',
  },
};

const DICTS: Record<Lang, Dict> = { en, ms };

export function getDict(lang: Lang): Dict {
  return DICTS[lang];
}
