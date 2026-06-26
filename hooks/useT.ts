import { translations } from "@/constants/translations";
import { useLanguage } from "@/contexts/LanguageContext";

export const useT = () => {
  const { lang } = useLanguage();
  return translations[lang];
};