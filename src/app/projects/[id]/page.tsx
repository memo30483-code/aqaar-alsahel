import type { Metadata } from "next";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: "تفاصيل المشروع | عقار FAMILY",
  description:
    "صور المشروع وفيديوه وموقعه وخطة السداد وكافة تفاصيله المعتمدة من إدارة منصة عقار FAMILY.",
  robots: { index: true, follow: true },
};

export default function ProjectPage({ params }: PageProps) {
  return <ProjectDetailClient id={params.id} />;
}
