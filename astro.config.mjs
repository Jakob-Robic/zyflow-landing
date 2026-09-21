import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.zyflow.eu",
  trailingSlash: "never",
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en",
          sl: "sl",
        },
      },
      filter: (page) => !page.includes("/blog") && !page.includes("/waitlist"),
    }),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "sl"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
