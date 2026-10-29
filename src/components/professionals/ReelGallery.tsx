"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toEmbedUrl } from "@/lib/embed";
import { useI18n } from "@/lib/i18n";
import type { ProfessionalReel } from "@/lib/professionals-store";

interface Props {
  reels: ProfessionalReel[];
}

/** معرض فيديوهات المهني — روابط embed فقط (يوتيوب/إنستجرام) */
export default function ReelGallery({ reels }: Props) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState(reels[0]?.id ?? "");
  const active = reels.find((reel) => reel.id === activeId) ?? reels[0];
  const embed = active ? toEmbedUrl(active.url) : null;
  const vertical = active?.platform === "instagram";

  return (
    <div className="mt-2">
      {embed && (
        <div
          className={`overflow-hidden rounded-2xl border border-sand-200 bg-ocean-950 ${
            vertical ? "mx-auto max-w-[320px]" : ""
          }`}
        >
          <iframe
            key={active?.id}
            src={embed}
            title={active?.titleAr ?? "video"}
            className={`w-full ${vertical ? "h-[480px]" : "aspect-video"}`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      {reels.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {reels.map((reel) => (
            <button
              key={reel.id}
              type="button"
              onClick={() => setActiveId(reel.id)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${
                reel.id === active?.id
                  ? "border-gold-300 bg-gold-50 text-gold-700"
                  : "border-sand-200 bg-white text-ocean-800 hover:border-gold-300"
              }`}
            >
              {reel.titleAr}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 flex items-center gap-1 text-[9.5px] font-semibold text-sand-500">
        <ExternalLink className="h-2.5 w-2.5" />
        {t("prof.modal.reels")} —{" "}
        {active?.platform === "instagram" ? "Instagram" : "YouTube"}
      </p>
    </div>
  );
}
