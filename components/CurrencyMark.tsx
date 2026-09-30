import { getCurrency } from '@/lib/currencies';

// A small engraved "coin" showing the currency's own symbol. Used where flags used
// to be: it identifies the currency at a glance and matches the banknote styling.

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-xs',
  lg: 'h-9 w-9 text-sm',
};

/** The currency's own symbol ("$", "RM", "¥"); long ones ("Bs.S") fall back to the code. */
function glyph(code: string): string {
  const symbol = getCurrency(code)?.symbol ?? '';
  return symbol && symbol.length <= 3 ? symbol : code.slice(0, 2);
}

export default function CurrencyMark({
  code,
  size = 'md',
}: {
  code: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full border border-seal/50 bg-paper leading-none font-semibold tracking-tight text-seal shadow-[inset_0_0_0_2px_var(--paper),inset_0_0_0_2.5px_color-mix(in_oklab,var(--seal)_35%,transparent)] select-none ${SIZES[size]}`}
    >
      {glyph(code)}
    </span>
  );
}
