<template>
  <div>
    <NuxtRouteAnnouncer />
    <div class="w-screen h-screen">
      <KakuCanvas />
    </div>
  </div>
</template>
<script setup>
useSeoMeta({
  title: "Kaku",
  description: "A diagraming tool with hand-drawn visuals.",
  ogDescription: "A diagraming tool with hand-drawn visuals.",
  ogImage: "/og.png",
  ogUrl: "https://kaku.supdeity.com",
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterDescription: "A diagraming tool with hand-drawn visuals.",
  twitterImage: "/og.png",
  twitterTitle: "Kaku",
  ogTitle: "Kaku",
  ogSiteName: "Kaku",
});

useHead({
  htmlAttrs: {
    lang: "en",
  },
  link: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
  ],
});
</script>
