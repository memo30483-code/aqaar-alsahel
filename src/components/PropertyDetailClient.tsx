"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { USER_PROPERTIES_KEY } from "@/data/properties";
import { Property } from "@/types/property";
import PropertyDetail from "./PropertyDetail";

interface Props {
  id: string;
  initialProperty?: Property;
}

export default function PropertyDetailClient({ id, initialProperty }: Props) {
  const [property, setProperty] = useState<Property | undefined>(
    initialProperty
  );
  const [loaded, setLoaded] = useState(Boolean(initialProperty));

  useEffect(() => {
    if (loaded) return;
    let userProperties: Property[] = [];
    try {
      const stored = localStorage.getItem(USER_PROPERTIES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) userProperties = parsed;
    } catch {
      userProperties = [];
    }
    setProperty(userProperties.find((p) => p.id === id));
    setLoaded(true);
  }, [id, loaded]);

  if (!loaded) return null;
  if (!property) notFound();

  return <PropertyDetail property={property} />;
}
