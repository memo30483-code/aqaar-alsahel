import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "عقار FAMILY — عقار أحلامك",
    short_name: "عقار FAMILY",
    description:
      "منصة عقارية موثّقة لمدن الساحل مع مراجعة قانونية وهندسية للإعلانات.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfbf7",
    theme_color: "#141a33",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "256x256",
        type: "image/x-icon",
      },
    ],
  };
}
