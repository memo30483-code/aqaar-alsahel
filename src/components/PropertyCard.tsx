import Link from "next/link";
import { Property } from "@/types/property";
import { formatArea, formatPrice } from "@/lib/format";

/** رقم واتساب تجريبي يُستخدم عند عدم توفر رقم للعقار */
const DEMO_WHATSAPP = "201012345678";

function whatsappHref(property: Property): string {
  const number = property.whatsapp?.replace(/\D/g, "") || DEMO_WHATSAPP;
  const message = encodeURIComponent(
    `مرحباً، أنا مهتم بعقار «${property.title}» في ${property.district} - ${property.city} بسعر ${formatPrice(
      property.price
    )} ج.م. أرجو تزويدي بالتفاصيل وموعد المعاينة.`
  );
  return `https://wa.me/${number}?text=${message}`;
}

interface Props {
  property: Property;
}

export default function PropertyCard({ property }: Props) {
  const pricePerMeter =
    property.area > 0 ? Math.round(property.price / property.area) : 0;
  const badge =
    property.type === "فيلا" || property.price >= 3_000_000
      ? "مميز"
      : "استلام فوري";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/property/${property.id}`} className="block">
        <div className="relative h-56 overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.image}
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute right-3 top-3 rounded-full bg-black/85 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {badge}
          </span>
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900 backdrop-blur">
            {property.type}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/property/${property.id}`} className="block">
          <h3 className="line-clamp-1 text-base font-bold text-gray-900 transition group-hover:text-gray-600">
            {property.title}
          </h3>
        </Link>

        <p className="mt-1 text-sm text-gray-500">
          {property.district} · {property.city} · {formatArea(property.area)}
          {property.rooms > 0 ? ` · ${property.rooms} غرف` : ""}
        </p>

        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-xl font-black tracking-tight text-gray-900">
            {formatPrice(property.price)}{" "}
            <span className="text-sm font-bold text-gray-600">ج.م</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            سعر المتر التقديري{" "}
            <span className="font-bold text-gray-700">
              {formatPrice(pricePerMeter)} ج.م
            </span>
          </p>
        </div>

        <a
          href={whatsappHref(property)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe57]"
        >
          <WhatsAppIcon />
          تواصل واتساب
        </a>
      </div>
    </article>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
