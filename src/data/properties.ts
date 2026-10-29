import { Property } from "@/types/property";

export const sellerTypes = ["فرد", "مطور", "مسوق"] as const;

/** مفتاح localStorage للعقارات التي يضيفها المستخدم من صفحة "أضف عقارك" */
export const USER_PROPERTIES_KEY = "aqaar-properties";

export const CITY_CENTERS = {
  "رأس البر": { lat: 31.51, lng: 31.82 },
  "دمياط": { lat: 31.4165, lng: 31.8133 },
  "دمياط الجديدة": { lat: 31.44, lng: 31.67 },
  "دمياط القديمة": { lat: 31.42, lng: 31.81 },
  "فارسكور": { lat: 31.3486, lng: 31.7003 },
  "المنصورة الجديدة": { lat: 31.13, lng: 31.55 },
  جمصة: { lat: 31.44, lng: 31.53 },
} as const;

/**
 * صور معمارية من Unsplash (ترخيص مجاني) للعرض التجريبي.
 * تُستبدَل بصور حقيقية مرخّصة للعقارات قبل الإطلاق.
 */
export const PROPERTY_IMAGES = {
  apartment1:
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
  apartment2:
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
  apartment3:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80",
  apartment4:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  villa1:
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
  villa2:
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80",
  villa3:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
  chalet:
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80",
  shop: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&q=80",
  land: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
} as const;

const GALLERY_POOL = Object.values(PROPERTY_IMAGES);

/** معرض صور متوافق مع الصورة الأساسية — بدون طلبات عشوائية */
function gallery(seed: string, count = 5): string[] {
  const start = seed.length % GALLERY_POOL.length;
  return Array.from(
    { length: count },
    (_, i) => GALLERY_POOL[(start + i) % GALLERY_POOL.length]
  );
}

export const mockProperties: Property[] = [
  // —— دمياط الجديدة ——
  {
    id: "dm-1",
    title: "شقة فاخرة مطلّة على البحر",
    city: "دمياط الجديدة",
    district: "الحي الأول",
    type: "شقة",
    area: 145,
    rooms: 3,
    bathrooms: 2,
    price: 2850000,
    purpose: "بيع",
    sellerType: "مطور",
    whatsapp: "201012345678",
    description:
      "شقة تشطيب سوبر لوكس بواجهة بحرية، 3 غرف و2 حمام، مصعد وأمن 24 ساعة.",
    image: PROPERTY_IMAGES.apartment1,
    images: gallery("apartment1"),
    lat: 31.442,
    lng: 31.668,
  },
  {
    id: "dm-2",
    title: "فيلا مستقلة بحديقة خاصة",
    city: "دمياط الجديدة",
    district: "الحي الثاني",
    type: "فيلا",
    area: 320,
    rooms: 5,
    bathrooms: 4,
    price: 4800000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201098765432",
    description:
      "فيلا دورين بحديقة 80م، جراج لسيارتين، قريبة من الخدمات والشاطئ.",
    image: PROPERTY_IMAGES.villa1,
    images: gallery("villa1"),
    lat: 31.438,
    lng: 31.675,
  },
  {
    id: "dm-3",
    title: "محل تجاري على شارع رئيسي",
    city: "دمياط الجديدة",
    district: "المنطقة التجارية",
    type: "محل",
    area: 55,
    rooms: 0,
    bathrooms: 1,
    price: 1200000,
    purpose: "بيع",
    sellerType: "مسوق",
    whatsapp: "201055512345",
    description: "محل واجهة زجاجية، مناسب لكافيه أو محل ملابس، رخصة جاهزة.",
    image: PROPERTY_IMAGES.shop,
    images: gallery("shop", 4),
    lat: 31.445,
    lng: 31.662,
  },
  {
    id: "dm-4",
    title: "استوديو مفروش جاهز للإيجار",
    city: "دمياط الجديدة",
    district: "الحي الساحلي",
    type: "شقة",
    area: 90,
    rooms: 1,
    bathrooms: 1,
    price: 12000,
    purpose: "إيجار",
    sellerType: "مطور",
    whatsapp: "201077788899",
    description: "وحدة مفروشة جاهزة للإيجار الشهري، عائد استثماري جذاب.",
    image: PROPERTY_IMAGES.apartment2,
    images: gallery("apartment2"),
    lat: 31.448,
    lng: 31.678,
  },

  // —— رأس البر ——
  {
    id: "rb-1",
    title: "شاليه صف أول على البحر",
    city: "رأس البر",
    district: "الصف الأول",
    type: "فيلا",
    area: 180,
    rooms: 3,
    bathrooms: 2,
    price: 3500000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201033344455",
    description: "شاليه بإطلالة مباشرة على البحر، حديقة ومسبح صغير.",
    image: PROPERTY_IMAGES.chalet,
    images: gallery("chalet"),
    lat: 31.512,
    lng: 31.818,
  },
  {
    id: "rb-2",
    title: "شقة عائلة في قلب رأس البر",
    city: "رأس البر",
    district: "شارع البحر",
    type: "شقة",
    area: 120,
    rooms: 2,
    bathrooms: 2,
    price: 1950000,
    purpose: "بيع",
    sellerType: "مسوق",
    whatsapp: "201066677788",
    description: "شقة قريبة من الكورنيش والخدمات، تشطيب كامل.",
    image: PROPERTY_IMAGES.apartment3,
    images: gallery("apartment3"),
    lat: 31.508,
    lng: 31.825,
  },
  {
    id: "rb-3",
    title: "فيلا واسعة بحوض سباحة",
    city: "رأس البر",
    district: "حي الشاليهات",
    type: "فيلا",
    area: 250,
    rooms: 4,
    bathrooms: 3,
    price: 4200000,
    purpose: "بيع",
    sellerType: "مطور",
    whatsapp: "201011122233",
    description: "فيلا 4 غرف بحوض سباحة خاص، مناسبة للعائلات الكبيرة.",
    image: PROPERTY_IMAGES.villa2,
    images: gallery("villa2"),
    lat: 31.515,
    lng: 31.822,
  },
  {
    id: "rb-4",
    title: "أرض قريبة من الشاطئ",
    city: "رأس البر",
    district: "الحي الغربي",
    type: "أرض",
    area: 300,
    rooms: 0,
    bathrooms: 0,
    price: 2200000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201044455566",
    description: "أرض سكنية قريبة من الشاطئ، خدمات مكتملة.",
    image: PROPERTY_IMAGES.land,
    images: gallery("land", 3),
    lat: 31.505,
    lng: 31.815,
  },

  // —— دمياط القديمة ——
  {
    id: "do-1",
    title: "شقة في وسط البلد",
    city: "دمياط القديمة",
    district: "وسط البلد",
    type: "شقة",
    area: 110,
    rooms: 2,
    bathrooms: 1,
    price: 980000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201088899900",
    description: "شقة في موقع مركزي قريب من الأسواق والمساجد التاريخية.",
    image: PROPERTY_IMAGES.apartment4,
    images: gallery("apartment4"),
    lat: 31.418,
    lng: 31.814,
  },
  {
    id: "do-2",
    title: "شقة واسعة بجانب النيل",
    city: "دمياط القديمة",
    district: "كورنيش النيل",
    type: "شقة",
    area: 160,
    rooms: 3,
    bathrooms: 2,
    price: 15000,
    purpose: "إيجار",
    sellerType: "مسوق",
    whatsapp: "201022233344",
    description: "شقة بإطلالة نيلية جزئية، 3 غرف وتشطيب حديث.",
    image: PROPERTY_IMAGES.apartment2,
    images: gallery("apartment2b"),
    lat: 31.422,
    lng: 31.808,
  },
  {
    id: "do-3",
    title: "محل تجاري في السوق الكبير",
    city: "دمياط القديمة",
    district: "السوق الكبير",
    type: "محل",
    area: 45,
    rooms: 0,
    bathrooms: 1,
    price: 750000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201099900011",
    description: "محل في قلب السوق، مناسب للملابس أو الأثاث.",
    image: PROPERTY_IMAGES.shop,
    images: gallery("shop2", 4),
    lat: 31.416,
    lng: 31.812,
  },
  {
    id: "do-4",
    title: "فيلا تراثية مجددة",
    city: "دمياط القديمة",
    district: "حي الأثري",
    type: "فيلا",
    area: 280,
    rooms: 4,
    bathrooms: 3,
    price: 3100000,
    purpose: "بيع",
    sellerType: "مطور",
    whatsapp: "201055566677",
    description: "فيلا تراثية تم تجديدها بالكامل مع الحفاظ على الطابع الدمياطي.",
    image: PROPERTY_IMAGES.villa3,
    images: gallery("villa3"),
    lat: 31.425,
    lng: 31.816,
  },

  // —— فارسكور ——
  {
    id: "fr-1",
    title: "شقة عائلية قريبة من المركز",
    city: "فارسكور",
    district: "وسط المدينة",
    type: "شقة",
    area: 140,
    rooms: 3,
    bathrooms: 2,
    price: 1350000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201012340001",
    description:
      "شقة 3 غرف بتشطيب كامل، قريبة من المدارس والخدمات وطريق دمياط.",
    image: PROPERTY_IMAGES.apartment4,
    images: gallery("apartment4b"),
    lat: 31.349,
    lng: 31.701,
  },
  {
    id: "fr-2",
    title: "فيلا مستقلة بحديقة",
    city: "فارسكور",
    district: "حي الزهور",
    type: "فيلا",
    area: 260,
    rooms: 5,
    bathrooms: 3,
    price: 2400000,
    purpose: "بيع",
    sellerType: "مطور",
    whatsapp: "201012340002",
    description: "فيلا دورين بحديقة أمامية وجراج، في حي هادئ قريب من النيل.",
    image: PROPERTY_IMAGES.villa2,
    images: gallery("villa2b"),
    lat: 31.345,
    lng: 31.697,
  },
  {
    id: "fr-3",
    title: "أرض سكنية بموقع متميز",
    city: "فارسكور",
    district: "طريق فارسكور الزراعي",
    type: "أرض",
    area: 200,
    rooms: 0,
    bathrooms: 0,
    price: 950000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201012340003",
    description: "أرض سكنية مستوية بترخيص بناء، على طريق رئيسي ومرافق متاحة.",
    image: PROPERTY_IMAGES.land,
    images: gallery("land2", 3),
    lat: 31.353,
    lng: 31.706,
  },

  // —— المنصورة الجديدة ——
  {
    id: "mn-1",
    title: "شقة بإطلالة على البحر في المنصورة الجديدة",
    city: "المنصورة الجديدة",
    district: "الحي الأول",
    type: "شقة",
    area: 130,
    rooms: 3,
    bathrooms: 2,
    price: 2100000,
    purpose: "بيع",
    sellerType: "مطور",
    whatsapp: "201011122233",
    description:
      "شقة في كمبوند جديد على البحر مباشرة، 3 غرف و2 حمام، بحيرة صناعية وحدائق، تسليم فوري.",
    image: PROPERTY_IMAGES.apartment1,
    images: gallery("apartment1b"),
    lat: 31.132,
    lng: 31.556,
  },
  {
    id: "mn-2",
    title: "شقة 4 غرف بحدائق المنصورة",
    city: "المنصورة الجديدة",
    district: "داون تاون",
    type: "شقة",
    area: 165,
    rooms: 4,
    bathrooms: 3,
    price: 2900000,
    purpose: "بيع",
    sellerType: "مطور",
    whatsapp: "201011122234",
    description: "شقة واسعة بتشطيب سوبر لوكس وحديقة مشتركة، تقسيط حتى 7 سنوات.",
    image: PROPERTY_IMAGES.apartment3,
    images: gallery("apartment3b"),
    lat: 31.128,
    lng: 31.552,
  },

  // —— جمصة ——
  {
    id: "gm-1",
    title: "شاليه قريب من شاطئ جمصة",
    city: "جمصة",
    district: "الحي السياحي",
    type: "شقة",
    area: 95,
    rooms: 2,
    bathrooms: 1,
    price: 1450000,
    purpose: "بيع",
    sellerType: "فرد",
    whatsapp: "201044455566",
    description:
      "شاليه مفروش على بعد خطوات من الشاطئ، 2 غرف وحمام، مناسب للاستثمار.",
    image: PROPERTY_IMAGES.chalet,
    images: gallery("chalet2"),
    lat: 31.441,
    lng: 31.531,
  },
  {
    id: "gm-2",
    title: "شاليه للإيجار الموسمي",
    city: "جمصة",
    district: "بلو باي",
    type: "شقة",
    area: 85,
    rooms: 2,
    bathrooms: 1,
    price: 9000,
    purpose: "إيجار",
    sellerType: "مسوق",
    whatsapp: "201044455567",
    description: "شاليه مفروش بالكامل بإطلالة جانبية على البحر، إيجار أسبوعي.",
    image: PROPERTY_IMAGES.chalet,
    images: gallery("chalet3"),
    lat: 31.438,
    lng: 31.526,
  },
];

export function getPropertyById(id: string): Property | undefined {
  return mockProperties.find((p) => p.id === id);
}

export function filterProperties(
  properties: Property[],
  filters: {
    city: Property["city"] | "";
    priceMin: number;
    priceMax: number;
    rooms: "" | "1" | "2" | "3" | "4+";
    query: string;
  }
): Property[] {
  const q = filters.query.trim().toLowerCase();

  return properties.filter((p) => {
    if (filters.city && p.city !== filters.city) return false;
    /* الإعلانات التي يحدد سعرها فريق المنصة (سعرها 0) لا تخضع لفلتر السعر */
    if (
      !p.priceByAdmin &&
      (p.price < filters.priceMin || p.price > filters.priceMax)
    ) {
      return false;
    }

    if (filters.rooms === "4+") {
      if (p.rooms < 4) return false;
    } else if (filters.rooms) {
      if (p.rooms !== Number(filters.rooms)) return false;
    }

    if (q) {
      const hay = `${p.district} ${p.city} ${p.title} ${p.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}
