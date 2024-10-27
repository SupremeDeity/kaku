// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  vite: {
    build: {
      sourcemap: true
    }
  },
   runtimeConfig: {
    public: {
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "DEV"
    }
  },

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
      { name: "Just Another Hand", provider: "google", global: true },
    ],
  },
});