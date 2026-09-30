import { CURRENCIES } from '@/lib/currencies';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div>
            <p className="font-bold text-slate-50">Zento</p>
            <p className="mt-0.5 text-sm text-slate-400">
              Real-time currency converter. Live mid-market rates for {CURRENCIES.length}{' '}
              currencies.
            </p>
          </div>
          <div className="space-y-1 text-xs text-slate-400 sm:text-right">
            <p>
              Rates from{' '}
              <a
                href="https://www.exchangerate-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                ExchangeRate-API
              </a>{' '}
              ·{' '}
              <a
                href="https://www.frankfurter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                Frankfurter
              </a>
            </p>
            <p>For informational purposes only. Not financial advice.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 border-t border-slate-800 pt-4 text-center sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400">© Zento 2026</p>
          <p className="text-xs text-slate-400">
            More websites by{' '}
            <a
              href="https://haikalakif.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition-colors hover:text-slate-300"
            >
              iCool
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
