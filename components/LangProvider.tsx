'use client';

import { createContext, useContext } from 'react';
import { getDict, type Dict } from '@/lib/dict';
import type { Lang } from '@/lib/i18n';

const LangContext = createContext<Lang>('en');

export default function LangProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** The page's language and its UI strings. */
export function useLang(): { lang: Lang; t: Dict } {
  const lang = useContext(LangContext);
  return { lang, t: getDict(lang) };
}
