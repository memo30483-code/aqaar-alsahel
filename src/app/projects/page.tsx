import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "المشاريع والعروض | عقار FAMILY",
  description:
    "مشاريع وعروض مطورين ومسوقين معتمدين في دمياط ورأس البر والمنصورة الجديدة — صور وفيديو وتفاصيل وخطة سداد لكل مشروع.",
};

export default function ProjectsPage() {
  return <PageRenderer pageId="projects" />;
}
