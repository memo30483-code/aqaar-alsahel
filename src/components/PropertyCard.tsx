import Link from "next/link";
import { Property } from "@/types/property";
import { formatArea, formatPrice } from "@/lib/format";

const sellerBadge: Record<Property["sellerType"], string> = {
  فرد: "bg-emerald-50 text-emerald-800",
  مطور: "bg-ocean-100 text-ocean-800",
  مسوق: "bg-amber-50 text-amber-800",
};

interface Props {
  property: Property;
}

export default function PropertyCard({ property }: Props) {
  return (
    <Link
      href={`/property/${property.id}`}
      className="group block overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lg"
    >
      <article>
        <div className="relative aspect-[4/3] overflow-hidden bg-ocean-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.image}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute right-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-ocean-800 backdrop-blur">
            {property.type}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-bold text-ocean-900">
              {property.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sellerBadge[property.sellerType]}`}
            >
              {property.sellerType}
            </span>
          </div>
          <p className="mt-1 text-sm text-ocean-500">
            {property.district} · {property.city}
          </p>
          <div className="mt-3 flex items-end justify-between gap-2 border-t border-ocean-50 pt-3">
            <div>
              <p className="text-lg font-extrabold text-ocean-700">
                {formatPrice(property.price)}{" "}
                <span className="text-sm font-semibold">ج.م</span>
              </p>
              <p className="text-xs text-ocean-500">
                {formatArea(property.area)}
                {property.rooms > 0
                  ? ` · ${property.rooms} غرف`
                  : ""}
              </p>
            </div>
            <span className="rounded-lg bg-ocean-700 px-3 py-2 text-xs font-bold text-white transition group-hover:bg-ocean-800">
              التفاصيل
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
