// Natural-language conversion queries, parsed locally with no AI call:
//   "150 euro in ringgit" · "¥30k to myr" · "$2,500 to yen" · "1.5m idr in sgd"
//   "hotel ¥45,000 split 3 ways" · "usd/jpy" · "in yen"

import { CURRENCIES } from './currencies';

export interface ParsedCommand {
  /** Undefined when the query names no source currency ("in yen") */
  from?: string;
  /** Undefined when the query names no target currency ("150 euro") */
  to?: string;
  /** Undefined when the query has no number */
  amount?: number;
  /** "split 3 ways" / "for 4 people" */
  splitBy?: number;
}

// ── Currency aliases ─────────────────────────────────────────────────────────

// Hand-picked words and symbols. These win over anything derived from names below,
// which is how ambiguous ones get their most likely meaning ("dollar" → USD).
const MANUAL_ALIASES: Record<string, string> = {
  dollar: 'USD',
  dollars: 'USD',
  buck: 'USD',
  bucks: 'USD',
  usd: 'USD',
  us$: 'USD',
  $: 'USD',
  euro: 'EUR',
  euros: 'EUR',
  '€': 'EUR',
  pound: 'GBP',
  pounds: 'GBP',
  quid: 'GBP',
  sterling: 'GBP',
  '£': 'GBP',
  yen: 'JPY',
  '¥': 'JPY',
  円: 'JPY',
  yuan: 'CNY',
  rmb: 'CNY',
  renminbi: 'CNY',
  元: 'CNY',
  ringgit: 'MYR',
  rm: 'MYR',
  'singapore dollar': 'SGD',
  'singapore dollars': 'SGD',
  sing: 'SGD',
  s$: 'SGD',
  'aussie dollar': 'AUD',
  'aussie dollars': 'AUD',
  aussie: 'AUD',
  a$: 'AUD',
  'canadian dollar': 'CAD',
  'canadian dollars': 'CAD',
  loonie: 'CAD',
  c$: 'CAD',
  'hong kong dollar': 'HKD',
  'hk dollar': 'HKD',
  hk$: 'HKD',
  'kiwi dollar': 'NZD',
  'nz dollar': 'NZD',
  nz$: 'NZD',
  'taiwan dollar': 'TWD',
  nt$: 'TWD',
  rupee: 'INR',
  rupees: 'INR',
  '₹': 'INR',
  rupiah: 'IDR',
  rp: 'IDR',
  baht: 'THB',
  '฿': 'THB',
  peso: 'MXN',
  pesos: 'MXN',
  'philippine peso': 'PHP',
  '₱': 'PHP',
  won: 'KRW',
  '₩': 'KRW',
  dong: 'VND',
  '₫': 'VND',
  franc: 'CHF',
  francs: 'CHF',
  'swiss franc': 'CHF',
  dirham: 'AED',
  dirhams: 'AED',
  riyal: 'SAR',
  riyals: 'SAR',
  rand: 'ZAR',
  real: 'BRL',
  reais: 'BRL',
  r$: 'BRL',
  lira: 'TRY',
  '₺': 'TRY',
  naira: 'NGN',
  '₦': 'NGN',
  ruble: 'RUB',
  rubles: 'RUB',
  rouble: 'RUB',
  '₽': 'RUB',
  shekel: 'ILS',
  shekels: 'ILS',
  '₪': 'ILS',
  zloty: 'PLN',
  zł: 'PLN',
  krona: 'SEK',
  kronor: 'SEK',
  krone: 'NOK',
  kroner: 'NOK',
  forint: 'HUF',
  koruna: 'CZK',
};

// Codes that are everyday English words. As bare lowercase words they'd hijack
// queries like "convert all to usd", so these currencies only match by name.
const WORD_CODES = new Set([
  'all',
  'top',
  'cup',
  'try',
  'mad',
  'bob',
  'gel',
  'sos',
  'mop',
  'bam',
  'lak',
]);

function buildAliases(): Map<string, string> {
  const aliases = new Map<string, string>();
  const lastWordOwners = new Map<string, Set<string>>();

  for (const c of CURRENCIES) {
    const code = c.code.toLowerCase();
    if (!WORD_CODES.has(code)) aliases.set(code, c.code);
    const name = c.name.toLowerCase();
    aliases.set(name, c.code);
    aliases.set(`${name}s`, c.code);
    const last = name.split(' ').pop()!;
    (lastWordOwners.get(last) ?? lastWordOwners.set(last, new Set()).get(last)!).add(c.code);
  }
  // A bare last word ("tenge", "kwacha") only counts when exactly one currency owns it
  for (const [word, owners] of lastWordOwners) {
    if (owners.size === 1 && !aliases.has(word)) aliases.set(word, [...owners][0]);
  }
  for (const [alias, code] of Object.entries(MANUAL_ALIASES)) aliases.set(alias, code);
  return aliases;
}

const ALIASES = buildAliases();

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Longest first, so "singapore dollars" beats "dollars" and "s$" beats "$".
// Word aliases must stand alone ("rm" must not match inside "farm"); symbols needn't.
// Letter lookarounds rather than \b, which treats "ł" in "zł" as a non-word character.
const CURRENCY_RE = new RegExp(
  [...ALIASES.keys()]
    .sort((a, b) => b.length - a.length)
    .map((a) => (/^\p{L}/u.test(a) ? `(?<!\\p{L})${escape(a)}(?!\\p{L})` : escape(a)))
    .join('|'),
  'gu',
);

// ── Parsing ──────────────────────────────────────────────────────────────────

const MULTIPLIERS: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  grand: 1e3,
  m: 1e6,
  mil: 1e6,
  mn: 1e6,
  million: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
};

const AMOUNT_RE =
  /(\d[\d,]*(?:\.\d+)?|\.\d+)\s*(thousand|million|billion|grand|mil|mn|bn|k|m|b)?\b/;
const SPLIT_RE =
  /\b(?:split|divided?)\s*(?:by|between|among|in(?:to)?)?\s*(\d+)(?:\s*ways?)?|\bfor\s+(\d+)\s*(?:people|persons|pax|of us)\b|\/\s*(\d+)\s*(?:ways?|people)\b/;
const CONNECTOR_RE = /\s(?:in|to|into|as|=|->|→)\s|\s(?:in|to|into)$/;

interface Mention {
  code: string;
  index: number;
}

export function parseCommand(input: string): ParsedCommand | null {
  let text = ` ${input.toLowerCase().normalize('NFKC').trim()} `;
  if (!text.trim()) return null;

  const result: ParsedCommand = {};

  // "split 3 ways" first, so its number isn't mistaken for the amount
  const split = text.match(SPLIT_RE);
  if (split) {
    const n = parseInt(split[1] ?? split[2] ?? split[3], 10);
    if (n >= 2 && n <= 100) result.splitBy = n;
    text = text.replace(split[0], ' ');
  }

  // "usd/jpy" or "usdjpy"
  const pairOnly = text.trim().match(/^([a-z]{3})\s*\/?\s*([a-z]{3})$/);
  if (pairOnly && ALIASES.get(pairOnly[1]) && ALIASES.get(pairOnly[2])) {
    return { from: ALIASES.get(pairOnly[1]), to: ALIASES.get(pairOnly[2]) };
  }

  const amountMatch = text.match(AMOUNT_RE);
  if (amountMatch) {
    const n = parseFloat(amountMatch[1].replace(/,/g, ''));
    const mult = amountMatch[2] ? MULTIPLIERS[amountMatch[2]] : 1;
    if (isFinite(n) && n > 0) result.amount = n * mult;
    // Blank the amount out so "k"/"m" suffixes can't be read as currencies
    text = text.replace(amountMatch[0], ' '.repeat(amountMatch[0].length));
  }

  const mentions: Mention[] = [];
  for (const m of text.matchAll(CURRENCY_RE)) {
    const code = ALIASES.get(m[0]);
    if (code && !mentions.some((x) => x.code === code)) mentions.push({ code, index: m.index! });
  }

  const connector = text.match(CONNECTOR_RE);
  const connectorAt = connector?.index;

  if (mentions.length >= 2) {
    result.from = mentions[0].code;
    result.to = mentions[1].code;
  } else if (mentions.length === 1) {
    // One currency: after "in"/"to" it's the target ("in yen"), otherwise the source ("150 euro")
    if (connectorAt != null && mentions[0].index > connectorAt) result.to = mentions[0].code;
    else result.from = mentions[0].code;
  }

  if (result.from == null && result.to == null && result.amount == null) return null;
  return result;
}

/** Fill the gaps in a parsed query from the converter's current state. */
export function resolveCommand(
  parsed: ParsedCommand,
  current: { from: string; to: string; amount: number },
  localCurrency: string,
): { from: string; to: string; amount: number; splitBy?: number } {
  const from = parsed.from ?? current.from;
  let to = parsed.to ?? current.to;
  // "150 euro" while the converter already shows EUR → convert into their own money
  if (to === from) to = from === localCurrency ? (from === 'USD' ? 'EUR' : 'USD') : localCurrency;
  return { from, to, amount: parsed.amount ?? current.amount, splitBy: parsed.splitBy };
}
