"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { USER_PROPERTIES_KEY } from "@/data/properties";
import { Property } from "@/types/property";
import { isPropertyPublished } from "@/lib/public-listings";
import PropertyDetail from "./PropertyDetail";

interface Props {
  id: string;
  initialProperty?: Property;
}

export default function PropertyDetailClient({ id, initialProperty }: Props) {
  const [property, setProperty] = useState<Property | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    /* لا تُعرض صفحة العقار إلا لو كان معتمداً من إدارة المنصة */
    if (!isPropertyPublished(id)) {
      setProperty(undefined);
      setLoaded(true);
      return;
    }

    let userProperties: Property[] = [];
    try {
      const stored = localStorage.getItem(USER_PROPERTIES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) userProperties = parsed;
    } catch {
      userProperties = [];
    }

    setProperty(userProperties.find((p) => p.id === id) ?? initialProperty);
    setLoaded(true);
  }, [id, initialProperty]);

  if (!loaded) return null;
  if (!property) notFound();

  return <PropertyDetail property={property} />;
}
