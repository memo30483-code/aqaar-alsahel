"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Clock,
  FileCheck2,
  FileText,
  ImagePlus,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { sellerTypes, USER_PROPERTIES_KEY } from "@/data/properties";
import {
  City,
  Property,
  PropertyDocument,
  PropertyType,
  Purpose,
  SellerType,
} from "@/types/property";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cityCenter, cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import {
  PROPERTY_TYPES,
  propertyTypeLabel,
  sellerTypeLabel,
} from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import { getSession } from "@/lib/session";
import {
  ADD_PROPERTY_FIELDS_EVENT,
  ADD_PROPERTY_OPTIONS_EVENT,
  DEFAULT_ADD_PROPERTY_FIELD_SETTINGS,
  DEFAULT_ADD_PROPERTY_OPTIONS,
  documentFieldKey,
  getAddPropertyFieldSettings,
  getAddPropertyOptions,
  type AddPropertyFieldKey,
  type AddPropertyFieldSettings,
  type AddPropertyOptions,
} from "@/lib/add-property-fields";
import LocationPickerDynamic from "@/components/LocationPickerDynamic";

type DocKey =
  | "owner_id"
  | "ownership"
  | "license"
  | "utility"
  | "power_of_attorney"
  | "tax";

/** المستندات المتاحة — إجبارية أم اختيارية يحدده الأدمن من لوحة التحكم */
const DOCUMENTS: {
  key: DocKey;
  labelKey: MessageKey;
  labelAr: string;
}[] = [
  {
    key: "owner_id",
    labelKey: "addProperty.doc.owner_id",
    labelAr: "بطاقة المالك (الرقم القومي)",
  },
  {
    key: "ownership",
    labelKey: "addProperty.doc.ownership",
    labelAr: "عقد الملكية / سند الملكية",
  },
  {
    key: "license",
    labelKey: "addProperty.doc.license",
    labelAr: "الترخيص أو محضر الحيازة",
  },
  {
    key: "utility",
    labelKey: "addProperty.doc.utility",
    labelAr: "إيصال مرافق (كهرباء أو مياه)",
  },
  {
    key: "power_of_attorney",
    labelKey: "addProperty.doc.power_of_attorney",
    labelAr: "توكيل رسمي",
  },
  {
    key: "tax",
    labelKey: "addProperty.doc.tax",
    labelAr: "شهادة ضريبة عقارية",
  },
];

/** الحد الأقصى لحجم المستند الواحد: 5 ميجابايت */
const MAX_DOC_SIZE = 5 * 1024 * 1024;

interface FormState {
  title: string;
  purpose: Purpose;
  city: City | "";
  district: string;
  area: string;
  price: string;
  /** قابل للتفاوض؟ "" لم يُحدَّد بعد */
  negotiable: "" | "yes" | "no";
  /** البائع اختار أن تحدد إدارة المنصة السعر */
  priceByAdmin: boolean;
  rooms: string;
  bathrooms: string;
  sellerType: SellerType | "";
  whatsapp: string;
  description: string;
  type: PropertyType | "";
  lat: number;
  lng: number;
  imageName: string;
  imagePreview: string;
  documents: Partial<Record<DocKey, PropertyDocument>>;
  ack: boolean;
}

interface SubmittedRequest {
  reference: string;
  title: string;
  city: City;
}

const START_CENTER = cityCenter("دمياط الجديدة");

/** أرقام مصرية محلية (01xxxxxxxxx) أو دولية (201xxxxxxxxx) أو بدون الصفر */
const WHATSAPP_PATTERN = /^(20)?0?1[0125]\d{8}$/;

/** تحويل رقم الواتساب إلى الصيغة الدولية 20xxxxxxxxxx أو null عند عدم الصلاحية */
function normalizeWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!WHATSAPP_PATTERN.test(digits)) return null;
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return `20${digits}`;
}

/** قراءة الإعلانات المحفوظة بأمان — أي تلف في التخزين لا يعطّل الحفظ */
function readUserProperties(): Property[] {
  try {
    const stored = localStorage.getItem(USER_PROPERTIES_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as Property[]) : [];
  } catch {
    return [];
  }
}

/** حجم المستند بصيغة مقروءة */
function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** ضغط الصورة قبل تخزينها كـ base64 لتقليل حجم localStorage */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const source = String(reader.result ?? "");
      if (!source) {
        resolve("");
        return;
      }
      const image = new Image();
      image.onerror = () => resolve(source);
      image.onload = () => {
        try {
          const scale = Math.min(
            1,
            1400 / Math.max(image.width, image.height)
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            resolve(source);
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch {
          resolve(source);
        }
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

const initial: FormState = {
  title: "",
  purpose: "بيع",
  city: "",
  district: "",
  area: "",
  price: "",
  negotiable: "",
  priceByAdmin: false,
  rooms: "",
  bathrooms: "1",
  sellerType: "",
  whatsapp: "",
  description: "",
  type: "",
  lat: START_CENTER.lat,
  lng: START_CENTER.lng,
  imageName: "",
  imagePreview: "",
  documents: {},
  ack: false,
};

const FIELD =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";
const LABEL = "mb-1.5 block text-[11px] font-extrabold text-sand-700";

/** عنوان قسم مرقّم داخل النموذج */
function SectionHead({
  step,
  title,
  desc,
  Icon,
}: {
  step: string;
  title: string;
  desc?: string;
  Icon: typeof FileText;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
          {step}
        </p>
        <h2 className="text-[15px] font-black text-ocean-900">{title}</h2>
        {desc && <p className="mt-0.5 text-[11.5px] leading-6 text-sand-700">{desc}</p>}
      </div>
    </div>
  );
}

export default function AddPropertyPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const cities = useActiveCities();
  const { formatWithSymbol } = useCurrency();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<SubmittedRequest | null>(null);
  const [checking, setChecking] = useState(true);
  /** إعدادات الأدمن: أي حقل إجباري وأي حقل اختياري */
  const [fieldSettings, setFieldSettings] = useState<AddPropertyFieldSettings>(
    DEFAULT_ADD_PROPERTY_FIELD_SETTINGS
  );
  /** إعدادات الأدمن: إظهار التفاوض وإتاحة «السعر تحدده المنصة» */
  const [options, setOptions] = useState<AddPropertyOptions>(
    DEFAULT_ADD_PROPERTY_OPTIONS
  );
  /** إعادة تصفير حقول الملفات بعد حذف مستند حتى يمكن رفع نفس الملف مرة أخرى */
  const [docNonce, setDocNonce] = useState(0);

  /** Auth Guard + تحميل إعدادات الحقول التي حددها الأدمن */
  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login?redirect=/add-property");
      return;
    }
    setFieldSettings(getAddPropertyFieldSettings());
    setOptions(getAddPropertyOptions());
    setChecking(false);
  }, [router]);

  /* تحديث الإعدادات لو عدّلها الأدمن في تبويب آخر */
  useEffect(() => {
    const sync = () => {
      setFieldSettings(getAddPropertyFieldSettings());
      const nextOptions = getAddPropertyOptions();
      setOptions(nextOptions);
      /* لو أوقف الأدمن خيار سعر المنصة أثناء تعبئة الفورم */
      if (!nextOptions.platformPriceEnabled) {
        setForm((prev) =>
          prev.priceByAdmin ? { ...prev, priceByAdmin: false } : prev
        );
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener(ADD_PROPERTY_FIELDS_EVENT, sync);
    window.addEventListener(ADD_PROPERTY_OPTIONS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ADD_PROPERTY_FIELDS_EVENT, sync);
      window.removeEventListener(ADD_PROPERTY_OPTIONS_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!form.city) return;
    const center = cityCenter(form.city);
    setForm((prev) => ({ ...prev, lat: center.lat, lng: center.lng }));
  }, [form.city]);

  /** Auth Guard — لا تعرض الفورم إلا بعد تأكيد وجود جلسة */
  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-sand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand-300 border-t-gold-500" />
      </div>
    );
  }

  const needs = (key: AddPropertyFieldKey) => fieldSettings[key];

  /** تسمية الحقل مع علامة * أو وسم «اختياري» حسب إعداد الأدمن */
  const labelFor = (key: AddPropertyFieldKey, messageKey: MessageKey) => {
    const base = t(messageKey).replace(/\s*\*$/, "");
    return needs(key)
      ? `${base} *`
      : `${base} ${t("addProperty.optionalTag")}`;
  };

  /** المستندات الإجبارية حسب إعداد الأدمن */
  const requiredDocuments = DOCUMENTS.filter((doc) =>
    needs(documentFieldKey(doc.key))
  );

  /** خيار «السعر تحدده المنصة» لا يُطبَّق إلا إذا سمح به الأدمن */
  const priceByAdmin = form.priceByAdmin && options.platformPriceEnabled;
  const negotiableEnabled = options.negotiableEnabled;

  /** اختيار «السعر تحدده المنصة» يُغلق السعر وقائمة التفاوض ويفرّغهما */
  const togglePriceByAdmin = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      priceByAdmin: checked,
      price: checked ? "" : prev.price,
      negotiable: checked ? "" : prev.negotiable,
    }));
  };

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("addProperty.errorImageType"));
      return;
    }
    setError("");
    const preview = await compressImage(file);
    setForm((prev) => ({
      ...prev,
      imageName: file.name,
      imagePreview: preview,
    }));
  };

  const onDocument =
    (spec: (typeof DOCUMENTS)[number]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");
      if (!isPdf && !isImage) {
        setError(t("addProperty.errorDocType"));
        return;
      }
      if (file.size > MAX_DOC_SIZE) {
        setError(t("addProperty.errorDocSize"));
        return;
      }

      setError("");
      setForm((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [spec.key]: {
            key: spec.key,
            label: spec.labelAr,
            name: file.name,
            size: file.size,
            type: file.type,
          },
        },
      }));
    };

  const removeDocument = (key: DocKey) => {
    setForm((prev) => {
      const next = { ...prev.documents };
      delete next[key];
      return { ...prev, documents: next };
    });
    setDocNonce((value) => value + 1);
  };

  const pricePerMeter =
    !priceByAdmin && Number(form.price) > 0 && Number(form.area) > 0
      ? Math.round(Number(form.price) / Number(form.area))
      : null;

  const uploadedRequired = requiredDocuments.filter(
    (doc) => form.documents[doc.key]
  ).length;

  const resetForm = () => {
    setForm(initial);
    setError("");
    setSubmitted(null);
    setDocNonce((value) => value + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    const empty = (value: string) => value.trim() === "";

    if (needs("title") && empty(form.title)) {
      missing.push(labelFor("title", "addProperty.fieldTitle"));
    }
    if (needs("city") && !form.city) {
      missing.push(labelFor("city", "addProperty.fieldCity"));
    }
    if (needs("district") && empty(form.district)) {
      missing.push(labelFor("district", "addProperty.fieldDistrict"));
    }
    if (needs("type") && !form.type) {
      missing.push(labelFor("type", "addProperty.fieldType"));
    }
    if (needs("sellerType") && !form.sellerType) {
      missing.push(labelFor("sellerType", "addProperty.fieldSellerType"));
    }
    if (needs("description") && empty(form.description)) {
      missing.push(labelFor("description", "addProperty.fieldDescription"));
    }
    if (needs("whatsapp") && empty(form.whatsapp)) {
      missing.push(labelFor("whatsapp", "addProperty.fieldWhatsapp"));
    }
    if (needs("area") && (empty(form.area) || Number(form.area) <= 0)) {
      missing.push(labelFor("area", "addProperty.fieldArea"));
    }
    if (needs("price") && !priceByAdmin && (empty(form.price) || Number(form.price) <= 0)) {
      missing.push(labelFor("price", "addProperty.fieldPrice"));
    }
    if (needs("negotiable") && negotiableEnabled && !priceByAdmin && !form.negotiable) {
      missing.push(labelFor("negotiable", "addProperty.fieldNegotiable"));
    }
    if (needs("rooms") && empty(form.rooms)) {
      missing.push(labelFor("rooms", "addProperty.fieldRooms"));
    }
    if (needs("bathrooms") && empty(form.bathrooms)) {
      missing.push(labelFor("bathrooms", "addProperty.fieldBathrooms"));
    }

    if (missing.length > 0) {
      setError(
        t("addProperty.errorMissingFields", {
          fields: missing.map((label) => label.replace(/\s*\*$/, "")).join("، "),
        })
      );
      return;
    }

    /* الصورة إجبارية فقط لو الأدمن حددها كذلك */
    if (needs("image") && !form.imagePreview) {
      setError(t("addProperty.errorImageRequired"));
      return;
    }

    /* المستندات التي حددها الأدمن إجبارية قبل إرسال الطلب */
    const missingDocuments = requiredDocuments.filter(
      (doc) => !form.documents[doc.key]
    );
    if (missingDocuments.length > 0) {
      setError(
        t("addProperty.errorMissingDocs", {
          fields: missingDocuments
            .map((doc) => t(doc.labelKey).replace(/\s*\*$/, ""))
            .join("، "),
        })
      );
      return;
    }

    /* رقم التواصل إن أُدخل يجب أن يكون صحيحاً */
    const whatsappRaw = form.whatsapp.trim();
    const normalizedWhatsapp = whatsappRaw ? normalizeWhatsApp(whatsappRaw) : "";
    if (whatsappRaw && !normalizedWhatsapp) {
      setError(t("addProperty.errorWhatsapp"));
      return;
    }
    const whatsapp = normalizedWhatsapp ?? "";

    if (!form.ack) {
      setError(t("addProperty.errorAck"));
      return;
    }

    setError("");

    const id = `user-${Date.now()}`;
    const reference = `AQF-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-4)}`;
    const documents = DOCUMENTS.map((doc) => form.documents[doc.key]).filter(
      (doc): doc is PropertyDocument => Boolean(doc)
    );
    const image =
      form.imagePreview || `https://picsum.photos/seed/${id}/800/600`;

    const property: Property = {
      id,
      title: form.title.trim() || "عقار جديد",
      purpose: form.purpose,
      city: form.city as City,
      district: form.district.trim(),
      type: form.type as PropertyType,
      area: Number(form.area) || 0,
      rooms: Number(form.rooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      price: priceByAdmin ? 0 : Number(form.price) || 0,
      priceByAdmin: priceByAdmin || undefined,
      negotiable: priceByAdmin
        ? undefined
        : negotiableEnabled && form.negotiable
          ? form.negotiable === "yes"
          : undefined,
      sellerType: form.sellerType || "فرد",
      whatsapp,
      description: form.description.trim(),
      image,
      images: [image],
      lat: form.lat,
      lng: form.lng,
      /* لا نشر تلقائي: الطلب يبقى «قيد المراجعة» حتى موافقة الإدارة */
      status: "pending",
      documents,
      submittedAt: new Date().toISOString(),
      reference,
    };

    const list = readUserProperties();
    try {
      localStorage.setItem(
        USER_PROPERTIES_KEY,
        JSON.stringify([...list, property])
      );
    } catch {
      setError(t("addProperty.errorStorage"));
      return;
    }

    setSubmitted({ reference, title: property.title, city: property.city });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const steps = [
    { title: t("addProperty.steps.1.title"), desc: t("addProperty.steps.1.desc") },
    { title: t("addProperty.steps.2.title"), desc: t("addProperty.steps.2.desc") },
    { title: t("addProperty.steps.3.title"), desc: t("addProperty.steps.3.desc") },
    { title: t("addProperty.steps.4.title"), desc: t("addProperty.steps.4.desc") },
  ];

  /* ====================== شاشة نجاح الإرسال ====================== */
  if (submitted) {
    const reviewSteps = [
      {
        title: t("addProperty.success.step1.title"),
        desc: t("addProperty.success.step1.desc"),
      },
      {
        title: t("addProperty.success.step2.title"),
        desc: t("addProperty.success.step2.desc"),
      },
      {
        title: t("addProperty.success.step3.title"),
        desc: t("addProperty.success.step3.desc"),
      },
      {
        title: t("addProperty.success.step4.title"),
        desc: t("addProperty.success.step4.desc"),
      },
    ];

    return (
      <div className="bg-sand-50">
        <div className="mx-auto w-full max-w-[780px] px-4 py-10 sm:px-6">
          <section className="overflow-hidden rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_30px_80px_-70px_rgba(20,26,51,0.6)] sm:p-8">
            <div className="text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                <Check className="h-8 w-8" strokeWidth={3} />
              </span>
              <p className="mt-4 flex items-center justify-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-600">
                <span aria-hidden className="h-px w-6 bg-gold-400/70" />
                {t("addProperty.eyebrow")}
              </p>
              <h1 className="mt-1.5 text-[24px] font-black leading-9 text-ocean-900 sm:text-[28px]">
                {t("addProperty.success.title")}
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-[12.5px] leading-7 text-sand-800">
                {t("addProperty.success.desc")}
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-gold-200 bg-gold-50 px-4 py-4 text-center">
              <p className="text-[10.5px] font-black uppercase tracking-[0.18em] text-gold-700">
                {t("addProperty.success.reference")}
              </p>
              <p
                className="mt-1 text-[26px] font-black tracking-[0.16em] text-ocean-900"
                dir="ltr"
              >
                {submitted.reference}
              </p>
              <p className="mt-1 text-[11.5px] font-semibold text-sand-700">
                {submitted.title} — {cityLabel(submitted.city, t, locale)}
              </p>
            </div>

            <div className="mt-6">
              <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.18em] text-gold-600">
                <span aria-hidden className="h-px w-5 bg-gold-400/70" />
                {t("addProperty.success.stepsTitle")}
              </p>
              <ol className="mt-4 space-y-3.5">
                {reviewSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-300/70 bg-gold-50 text-[11px] font-black text-gold-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ocean-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-5 text-sand-700">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11.5px] font-semibold leading-6 text-amber-900">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              {t("addProperty.success.warning")}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-6 py-3 text-[12.5px] font-black text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5"
              >
                {t("addProperty.success.addAnother")}
              </button>
              <Link
                href="/"
                className="rounded-full border border-sand-200 px-6 py-3 text-[12.5px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50"
              >
                {t("addProperty.success.home")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sand-50">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        {/* ====================== HERO ====================== */}
        <header className="relative overflow-hidden rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_30px_80px_-70px_rgba(20,26,51,0.6)] sm:p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.16),transparent_65%)]"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/70 bg-gold-50 px-3 py-1 text-[10.5px] font-black text-gold-800">
              <Sparkles className="h-3.5 w-3.5" />
              {t("addProperty.badge")}
            </span>
            <p className="mt-3 flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-600">
              <span aria-hidden className="h-px w-6 bg-gold-400/70" />
              {t("addProperty.eyebrow")}
            </p>
            <h1 className="mt-1.5 text-[26px] font-black leading-9 text-ocean-900 sm:text-[32px] sm:leading-[44px]">
              {t("addProperty.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-[12.5px] leading-7 text-sand-800">
              {t("addProperty.subtitle")}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                { Icon: ShieldCheck, label: t("home.listings.verified") },
                { Icon: Lock, label: t("addProperty.privacy.title") },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-[10.5px] font-bold text-ocean-800"
                >
                  <Icon className="h-3.5 w-3.5 text-gold-600" />
                  {label}
                </span>
              ))}
            </div>

            <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11.5px] font-semibold leading-6 text-amber-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              {t("addProperty.reviewNotice")}
            </p>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_336px]">
          {/* ====================== FORM ====================== */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* ---------- بيانات الإعلان ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="01"
                title={t("addProperty.sectionListing")}
                Icon={FileText}
              />

              <div className="mt-4 space-y-3.5">
                <label className="block">
                  <span className={LABEL}>
                    {labelFor("title", "addProperty.fieldTitle")}
                  </span>
                  <input
                    value={form.title}
                    onChange={set("title")}
                    placeholder={t("addProperty.titlePlaceholder")}
                    className={FIELD}
                  />
                </label>

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldPurpose")}
                    </span>
                    <select
                      value={form.purpose}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          purpose: e.target.value as Purpose,
                        }))
                      }
                      className={FIELD}
                    >
                      <option value="بيع">{t("purpose.buy")}</option>
                      <option value="إيجار">{t("purpose.rent")}</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {labelFor("city", "addProperty.fieldCity")}
                    </span>
                    <select
                      value={form.city}
                      onChange={set("city")}
                      className={FIELD}
                    >
                      <option value="">{t("addProperty.cityPlaceholder")}</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.nameAr}>
                          {cityLabel(c.nameAr, t, locale)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {labelFor("district", "addProperty.fieldDistrict")}
                    </span>
                    <input
                      value={form.district}
                      onChange={set("district")}
                      placeholder={t("addProperty.districtPlaceholder")}
                      className={FIELD}
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* ---------- تفاصيل العقار ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="02"
                title={t("addProperty.sectionDetails")}
                Icon={ShieldCheck}
              />

              <div className="mt-4 space-y-3.5">
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className={LABEL}>
                      {labelFor("type", "addProperty.fieldType")}
                    </span>
                    <select
                      value={form.type}
                      onChange={set("type")}
                      className={FIELD}
                    >
                      <option value="">{t("addProperty.select")}</option>
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {propertyTypeLabel(pt, t)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {labelFor("area", "addProperty.fieldArea")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={form.area}
                      onChange={set("area")}
                      className={FIELD}
                    />
                  </label>

                  <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-3.5 sm:col-span-2 lg:col-span-3">
                    <div
                      className={`grid gap-3.5 ${
                        negotiableEnabled ? "sm:grid-cols-2" : ""
                      }`}
                    >
                      <label className="block">
                        <span className={LABEL}>
                          {labelFor(
                            "price",
                            form.purpose === "إيجار"
                              ? "addProperty.fieldRentPrice"
                              : "addProperty.fieldPrice"
                          )}
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={form.price}
                          onChange={set("price")}
                          disabled={priceByAdmin}
                          className={`${FIELD} ${
                            priceByAdmin
                              ? "cursor-not-allowed bg-sand-100 text-sand-500"
                              : ""
                          }`}
                        />
                      </label>

                      {negotiableEnabled && (
                        <label className="block">
                          <span className={LABEL}>
                            {labelFor("negotiable", "addProperty.fieldNegotiable")}
                          </span>
                          <select
                            value={form.negotiable}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                negotiable: e.target
                                  .value as FormState["negotiable"],
                              }))
                            }
                            disabled={priceByAdmin}
                            className={`${FIELD} ${
                              priceByAdmin
                                ? "cursor-not-allowed bg-sand-100 text-sand-500"
                                : ""
                            }`}
                          >
                            <option value="">{t("addProperty.select")}</option>
                            <option value="yes">
                              {t("addProperty.negotiable.yes")}
                            </option>
                            <option value="no">
                              {t("addProperty.negotiable.no")}
                            </option>
                          </select>
                        </label>
                      )}
                    </div>

                    {options.platformPriceEnabled && (
                      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-sand-200 bg-white px-3 py-2.5 transition hover:border-gold-300">
                        <input
                          type="checkbox"
                          checked={form.priceByAdmin}
                          onChange={(e) => togglePriceByAdmin(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-gold-600"
                        />
                        <span>
                          <span className="block text-[11.5px] font-extrabold leading-5 text-ocean-900">
                            {t("addProperty.platformPrice")}
                          </span>
                          <span className="mt-0.5 block text-[10.5px] font-semibold leading-5 text-sand-600">
                            {t("addProperty.platformPriceHint")}
                          </span>
                        </span>
                      </label>
                    )}

                    {priceByAdmin && (
                      <p className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 text-[10.5px] font-bold leading-5 text-gold-800">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {t("addProperty.platformPriceActive")}
                      </p>
                    )}
                  </div>

                  <label className="block">
                    <span className={LABEL}>
                      {labelFor("rooms", "addProperty.fieldRooms")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={form.rooms}
                      onChange={set("rooms")}
                      className={FIELD}
                    />
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {labelFor("bathrooms", "addProperty.fieldBathrooms")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={form.bathrooms}
                      onChange={set("bathrooms")}
                      className={FIELD}
                    />
                  </label>
                </div>

                {pricePerMeter !== null && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold-200/70 bg-gold-50/60 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-gold-800">
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("addProperty.priceHint")}
                    </span>
                    <span className="text-[14px] font-black text-ocean-900">
                      {formatWithSymbol(pricePerMeter)}
                    </span>
                  </div>
                )}

                <label className="block">
                  <span className={LABEL}>
                    {labelFor("description", "addProperty.fieldDescription")}
                  </span>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={set("description")}
                    placeholder={t("addProperty.descriptionPlaceholder")}
                    className={FIELD}
                  />
                </label>
              </div>
            </section>

            {/* ---------- بيانات التواصل ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="03"
                title={t("addProperty.sectionContact")}
                desc={t("addProperty.privacy.desc")}
                Icon={Lock}
              />

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className={LABEL}>
                    {labelFor("sellerType", "addProperty.fieldSellerType")}
                  </span>
                  <select
                    value={form.sellerType}
                    onChange={set("sellerType")}
                    className={FIELD}
                  >
                    <option value="">{t("addProperty.select")}</option>
                    {sellerTypes.map((s) => (
                      <option key={s} value={s}>
                        {sellerTypeLabel(s, t)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={LABEL}>
                    {labelFor("whatsapp", "addProperty.fieldWhatsapp")}
                  </span>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={set("whatsapp")}
                    placeholder="2010xxxxxxxx"
                    className={FIELD}
                    dir="ltr"
                  />
                </label>
              </div>
            </section>

            {/* ---------- الصورة والموقع ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="04"
                title={t("addProperty.sectionImage")}
                Icon={Camera}
              />

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className={LABEL}>
                    {labelFor("image", "addProperty.fieldImage")}
                  </span>
                  <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 p-4 transition hover:border-gold-400/70 hover:bg-gold-50/30">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sand-200 bg-white text-gold-600">
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onImage}
                        className="w-full text-[12px] font-semibold text-sand-800 file:me-3 file:rounded-lg file:border-0 file:bg-ocean-950 file:px-3.5 file:py-2 file:text-[11.5px] file:font-bold file:text-white"
                      />
                    </div>
                    {form.imagePreview && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-sand-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.imagePreview}
                          alt={t("addProperty.imageAlt")}
                          className="h-44 w-full object-cover"
                        />
                        <p className="bg-white px-3 py-2 text-[11px] font-semibold text-sand-700">
                          {form.imageName}
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                <div>
                  <span className={LABEL}>{t("addProperty.fieldLocation")}</span>
                  <p className="mb-2 text-[11px] font-medium text-sand-600">
                    {t("addProperty.locationHint")}
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-sand-200">
                    <LocationPickerDynamic
                      city={form.city}
                      lat={form.lat}
                      lng={form.lng}
                      onChange={(lat, lng) =>
                        setForm((prev) => ({ ...prev, lat, lng }))
                      }
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] font-bold text-sand-600" dir="ltr">
                    {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            </section>

            {/* ---------- المستندات القانونية ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionHead
                  step="05"
                  title={t("addProperty.sectionDocs")}
                  desc={t("addProperty.sectionDocs.desc")}
                  Icon={FileCheck2}
                />
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-black ${
                    uploadedRequired === requiredDocuments.length
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-sand-100 text-sand-700"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {uploadedRequired} / {requiredDocuments.length}
                </span>
              </div>

              <p className="mt-3 text-[11px] font-medium text-sand-600">
                {t("addProperty.doc.hint")}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {DOCUMENTS.map((spec) => {
                  const doc = form.documents[spec.key];
                  const uploaded = Boolean(doc);
                  const docRequired = needs(documentFieldKey(spec.key));

                  return (
                    <div
                      key={spec.key}
                      className={`rounded-2xl border p-3.5 transition ${
                        uploaded
                          ? "border-emerald-200 bg-emerald-50/40"
                          : "border-sand-200 bg-sand-50/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-extrabold leading-5 text-ocean-900">
                            {labelFor(
                              documentFieldKey(spec.key),
                              spec.labelKey
                            )}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9.5px] font-black ${
                              uploaded
                                ? "bg-emerald-100 text-emerald-700"
                                : docRequired
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-sand-200/70 text-sand-700"
                            }`}
                          >
                            {uploaded
                              ? t("addProperty.doc.uploaded")
                              : docRequired
                                ? t("addProperty.doc.required")
                                : t("addProperty.doc.optional")}
                          </span>
                        </div>
                        {uploaded ? (
                          <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Upload className="h-4 w-4 shrink-0 text-sand-500" />
                        )}
                      </div>

                      {doc ? (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-white px-2.5 py-2">
                          <span className="min-w-0">
                            <span className="block truncate text-[10.5px] font-bold text-ocean-900">
                              {doc.name}
                            </span>
                            <span className="block text-[9.5px] font-semibold text-sand-500">
                              {formatSize(doc.size)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDocument(spec.key)}
                            aria-label={t("addProperty.doc.remove")}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ocean-200 bg-white px-3 py-1.5 text-[11px] font-bold text-ocean-800 transition hover:border-gold-400 hover:bg-gold-50">
                          <Upload className="h-3.5 w-3.5" />
                          {t("addProperty.doc.upload")}
                          <input
                            key={`${spec.key}-${docNonce}`}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={onDocument(spec)}
                            className="sr-only"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ---------- الإقرار ---------- */}
            <label className="flex cursor-pointer items-start gap-3 rounded-3xl border border-sand-200 bg-white p-4 transition hover:border-gold-300 sm:p-5">
              <input
                type="checkbox"
                checked={form.ack}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ack: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#c9922a]"
              />
              <span className="text-[11.5px] font-semibold leading-6 text-sand-800">
                {t("addProperty.ack")}
              </span>
            </label>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] font-bold text-rose-700">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5 rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-7 py-3 text-[13px] font-black text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5"
              >
                <ShieldCheck className="h-4 w-4" />
                {t("addProperty.submit")}
              </button>
              <Link
                href="/"
                className="rounded-full border border-sand-200 px-6 py-3 text-[12.5px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50"
              >
                {t("addProperty.cancel")}
              </Link>
            </div>
          </form>

          {/* ====================== SIDEBAR ====================== */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-sand-200 bg-white p-5">
              <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.18em] text-gold-600">
                <span aria-hidden className="h-px w-5 bg-gold-400/70" />
                {t("addProperty.steps.title")}
              </p>
              <ol className="mt-4 space-y-3.5">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-300/70 bg-gold-50 text-[11px] font-black text-gold-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ocean-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-5 text-sand-700">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-3xl border border-ocean-900/10 bg-ocean-950 p-5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-300">
                <Lock className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[12.5px] font-black">
                {t("addProperty.privacy.title")}
              </p>
              <p className="mt-1.5 text-[11px] leading-6 text-white/70">
                {t("addProperty.privacy.desc")}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
