"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { USER_PROPERTIES_KEY } from "@/data/properties";
import { Property } from "@/types/property";
import { isPropertyPublished } from "@/lib/public-listings";
import { getDefaultApprovedIds } from "@/lib/admin-system";
import { getSession, hasAdminAccess } from "@/lib/session";
import PropertyDetail from "./PropertyDetail";

interface Props {
  id: string;
  initialProperty?: Property;
}

/** الإعلانات المعتمدة بالحالة الافتراضية — نفس ما يرسمه السيرفر */
const DEFAULT_APPROVED = new Set(getDefaultApprovedIds());

export default function PropertyDetailClient({ id, initialProperty }: Props) {
  /* الرسم الأول (سيرفر + ترطيب) يعرض العقار المعتمد افتراضياً حتى يظهر المحتوى
     في HTML لصفحات SSG ولا يحدث اختلاف ترطيب. */
  const serverVisible =
    initialProperty && DEFAULT_APPROVED.has(initialProperty.id)
      ? initialProperty
      : undefined;

  const [property, setProperty] = useState<Property | undefined>(serverVisible);
  const [loaded, setLoaded] = useState(Boolean(serverVisible));

  useEffect(() => {
    /* لا تُعرض صفحة العقار إلا لو كان معتمداً من إدارة المنصة.
       الإدارة تستطيع المعاينة قبل الاعتماد (زر «معاينة» في لوحة التحكم). */
    const adminPreview = hasAdminAccess(getSession());
    if (!isPropertyPublished(id) && !adminPreview) {
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
