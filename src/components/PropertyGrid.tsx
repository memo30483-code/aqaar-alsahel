import { Property } from "@/types/property";
import PropertyCard from "./PropertyCard";

interface Props {
  properties: Property[];
}

export default function PropertyGrid({ properties }: Props) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ocean-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold text-ocean-800">لا توجد نتائج</p>
        <p className="mt-1 text-sm text-ocean-500">
          جرّب تعديل الفلاتر للعثور على عقارات أخرى
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
