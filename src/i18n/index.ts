import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入所有语言文件
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import vi from './locales/vi.json';
import th from './locales/th.json';
import id from './locales/id.json';
import ms from './locales/ms.json';
import tr from './locales/tr.json';
import nl from './locales/nl.json';
import el from './locales/el.json';
import cs from './locales/cs.json';
import hu from './locales/hu.json';
import uk from './locales/uk.json';
import ar from './locales/ar.json';

export const languages = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇭🇰' },
];

const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  en: { translation: en },
  ja: { translation: ja },
  ko: { translation: ko },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  ru: { translation: ru },
  vi: { translation: vi },
  th: { translation: th },
  id: { translation: id },
  ms: { translation: ms },
  tr: { translation: tr },
  nl: { translation: nl },
  el: { translation: el },
  cs: { translation: cs },
  hu: { translation: hu },
  uk: { translation: uk },
  ar: { translation: ar },
};

// 支持的语言列表
const supportedLngs = [
  'zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru',
  'vi', 'th', 'id', 'ms', 'tr', 'nl', 'el', 'cs', 'hu', 'uk', 'ar'
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'querystring'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'fixpic-language',
      caches: ['localStorage'],
      // 将浏览器语言映射到我们支持的语言
      convertDetectedLanguage: (lng: string) => {
        // 处理中文变体
        if (lng.startsWith('zh')) {
          if (lng.includes('TW') || lng.includes('HK') || lng.includes('Hant')) {
            return 'zh-TW';
          }
          return 'zh-CN';
        }
        // 处理其他语言，取主语言代码
        const mainLang = lng.split('-')[0];
        if (supportedLngs.includes(mainLang)) {
          return mainLang;
        }
        return lng;
      },
    },
  });

export default i18n;
