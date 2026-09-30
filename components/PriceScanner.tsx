'use client';

import { useEffect, useRef, useState } from 'react';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { scanPrices, type ScanResponse } from '@/lib/api';
import { CURRENCIES, getCurrency } from '@/lib/currencies';
import { formatAmount } from '@/lib/format';
import { useCurrencyRate } from '@/hooks/useCurrencyRate';

interface Props {
  /** Converter's current pair, used as defaults */
  from: string;
  to: string;
  localCurrency: string;
  onApply: (from: string, to: string, amount: string) => void;
}

const MAX_SIDE = 1280;

/** Downscale a photo to at most MAX_SIDE px and re-encode as JPEG. Phones shoot 12 MP+. */
async function toJpegDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

function SourceSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-b border-line bg-transparent text-sm text-ink"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code}
          </option>
        ))}
      </select>
    </label>
  );
}

function Results({
  scan,
  source,
  target,
  onSource,
  onTarget,
  onPick,
}: {
  scan: ScanResponse;
  source: string;
  target: string;
  onSource: (v: string) => void;
  onTarget: (v: string) => void;
  onPick: (price: number) => void;
}) {
  const { data, isLoading } = useCurrencyRate(source, target);
  const rate = source === target ? 1 : data?.rates[target];
  const src = getCurrency(source);
  const dst = getCurrency(target);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-2 text-sm text-ink-2">
        <span>Prices in</span>
        <SourceSelect label="Currency on the photo" value={source} onChange={onSource} />
        <span>shown in</span>
        <SourceSelect label="Convert into" value={target} onChange={onTarget} />
      </div>
      {scan.printed && (
        <p className="mb-3 text-xs text-ink-3">
          Read &ldquo;{scan.printed}&rdquo; on the photo
          {scan.currency
            ? ` as ${scan.currency}`
            : ', which we could not match. Pick the currency above.'}
        </p>
      )}
      {scan.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-2">
          No prices found. Try a closer, straighter shot with good light.
        </p>
      ) : (
        <ul className="-mx-3 max-h-[45dvh] overflow-y-auto">
          {scan.items.map((item, i) => (
            <li key={`${item.label}-${i}`}>
              <button
                type="button"
                onClick={() => onPick(item.price)}
                className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-paper-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{item.label}</span>
                  <span className="text-xs text-ink-3 tabular-nums">
                    {src?.symbol}
                    {formatAmount(item.price)} {source}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-accent tabular-nums">
                  {rate != null ? (
                    <>
                      {dst?.symbol}
                      {formatAmount(item.price * rate)}
                    </>
                  ) : isLoading ? (
                    <span className="inline-block h-4 w-16 animate-pulse rounded bg-paper-3" />
                  ) : (
                    '–'
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PriceScanner({ from, to, localCurrency, onApply }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState(from);
  const [target, setTarget] = useState(to);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (photo && !dialog.open) dialog.showModal();
  }, [photo]);

  const reset = () => {
    setPhoto(null);
    setScan(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    dialogRef.current?.close();
    reset();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setScan(null);
    setError(null);
    try {
      const dataUrl = await toJpegDataUrl(file);
      setPhoto(dataUrl);
      const result = await scanPrices(dataUrl);
      // Prefer the currency printed on the photo, else what the converter is on
      const src = result.currency ?? from;
      const dst =
        to !== src ? to : from !== src ? from : localCurrency !== src ? localCurrency : 'USD';
      setSource(src);
      setTarget(dst);
      setScan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that photo.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Scan prices with your camera"
        title="Scan a menu or price tag"
        className="shrink-0 p-1 text-ink-3 transition-colors hover:text-ink"
      >
        <CameraIcon className="h-5 w-5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear so choosing the same photo again (a retry) still fires change
          e.target.value = '';
          onFile(file);
        }}
      />

      <dialog
        ref={dialogRef}
        onClose={reset}
        aria-label="Price scanner"
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-2xl bg-paper-2 p-0 text-ink backdrop:bg-black/60 sm:m-auto sm:w-[30rem] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="t-label text-ink-3">Price scanner</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close scanner"
            className="p-1 text-ink-3 hover:text-ink"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {photo && (
            <div className="relative mb-5 overflow-hidden rounded-xl bg-paper">
              {/* oxlint-disable-next-line nextjs/no-img-element -- a local data URL, nothing for next/image to optimise */}
              <img src={photo} alt="What you scanned" className="max-h-56 w-full object-contain" />
              {!scan && !error && (
                // Sweeping scan line while the model reads the photo
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-x-0 h-16 animate-[scan_1.6s_ease-in-out_infinite] bg-linear-to-b from-transparent via-accent/25 to-transparent motion-reduce:hidden" />
                  <p className="absolute right-0 bottom-2 left-0 text-center text-xs text-ink">
                    Reading prices…
                  </p>
                </div>
              )}
            </div>
          )}

          {error ? (
            <p role="alert" className="py-4 text-sm text-down">
              {error}
            </p>
          ) : scan ? (
            <Results
              scan={scan}
              source={source}
              target={target}
              onSource={setSource}
              onTarget={setTarget}
              onPick={(price) => {
                onApply(source, target, String(price));
                close();
              }}
            />
          ) : null}

          <div className="mt-5 flex items-baseline justify-between gap-4">
            <p className="t-label text-ink-3">
              Tap a price to open it in the converter. Zento doesn&apos;t keep your photos.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="shrink-0 t-label text-ink-2 hover:text-ink"
            >
              New photo
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
