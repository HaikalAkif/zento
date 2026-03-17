import { CURRENCIES } from '@/lib/currencies';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div>
            <p className="font-bold text-slate-50">Zento</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Real-time currency converter — live mid-market rates for {CURRENCIES.length} currencies.
            </p>
          </div>
          <div className="text-xs text-slate-500 space-y-1 sm:text-right">
            <p>
              Rates sourced from{' '}
              <a
                href="https://www.exchangerate-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                ExchangeRate-API
              </a>
              {' '}·{' '}
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
      </div>
    </footer>
  );
}
