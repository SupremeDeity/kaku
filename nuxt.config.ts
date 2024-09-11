// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  icon: {
    clientBundle: {
      scan: true,
    }
  },

  modules: ["@nuxt/eslint", "@nuxt/fonts", "@nuxt/ui"],
  fonts: {
    families: [
      { name: "Virgil", provider: "local", global: true },
      { name: "Kalam", provider: "google", global: true },
      { name: "Itim", provider: "google", global: true },
    ],
  },
});