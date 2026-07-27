import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AppLanguage = 'zh' | 'en';

type LanguageContextValue = {
  language: AppLanguage;
  locale: 'zh-CN' | 'en-NZ';
  setLanguage: (language: AppLanguage) => Promise<void>;
  text: (zh: string, en: string) => string;
};

const STORAGE_KEY = 'receiptly.app-language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY).then((storedLanguage) => {
      if (storedLanguage === 'zh' || storedLanguage === 'en') {
        setLanguageState(storedLanguage);
      }
    });
  }, []);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    await SecureStore.setItemAsync(STORAGE_KEY, nextLanguage);
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    locale: language === 'zh' ? 'zh-CN' : 'en-NZ',
    setLanguage,
    text: (zh, en) => language === 'zh' ? zh : en,
  }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider.');
  return value;
}
