import { type IntlayerConfig, Locales } from 'intlayer';

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.ENGLISH, Locales.CHINESE],
    defaultLocale: Locales.ENGLISH,
  },
  routing: {
    mode: "prefix-no-default",
    storage: "localStorage",
  },
  content: {
    watch: true,
    contentDir: ['src/config/locale'],
  },

};

export default config;
