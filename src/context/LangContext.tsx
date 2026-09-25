import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '../i18n/translations';

type Lang = 'bn' | 'en';
type Translations = typeof translations.en;

interface LangContextValue {
  lang: Lang;
  t: Translations;
  toggle: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('mc_lang') as Lang) || 'bn');
  const t = translations[lang] as Translations;
  const toggle = () => {
    const next: Lang = lang === 'bn' ? 'en' : 'bn';
    setLang(next);
    localStorage.setItem('mc_lang', next);
    document.documentElement.lang = next;
  };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <LangContext.Provider value={{ lang, t, toggle }}>{children}</LangContext.Provider>;
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
};
