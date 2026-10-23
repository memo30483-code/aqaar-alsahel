import { Property } from "@/types/property";

export const cities = [
  "رأس البر",
  "دمياط الجديدة",
  "دمياط القديمة",
  "المنصورة الجديدة",
  "جمصة",
] as const;

export const propertyTypes = ["شقة", "فيلا", "محل", "أرض"] as const;

export const sellerTypes = ["فرد", "مطور", "مسوق"] as const;

/** مفتاح localStorage للعقارات التي يضيفها المستخدم من صفحة "أضف عقارك" */
export const USER_PROPERTIES_KEY = "aqaar-properties";

export const CITY_CENTERS = {
  "رأس البر": { lat: 31.51, lng: 31.82 },
  "دمياط الجديدة": { lat: 31.44, lng: 31.67 },
  "دمياط القديمة": { lat: 31.42, lng: 31.81 },
  "المنصورة الجديدة": { lat: 31.13, lng: 31.55 },
  جمصة: { lat: 31.44, lng: 31.53 },
} as const;

function gallery(seed: string, count = 5): string[] {
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${seed}-${i + 1}/1200/800`
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
    sellerType: "مطور",
    whatsapp: "201012345678",
    description:
      "شقة تشطيب سوبر لوكس بواجهة بحرية، 3 غرف و2 حمام، مصعد وامن 24 ساعة.",
    image: "https://picsum.photos/seed/aqaar1/800/600",
    images: gallery("aqaar1"),
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
    sellerType: "فرد",
    whatsapp: "201098765432",
    description:
      "فيلا دورين بحديقة 80م، جراج لسيارتين، قريبة من الخدمات والشاطئ.",
    image: "https://picsum.photos/seed/aqaar2/800/600",
    images: gallery("aqaar2"),
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
    sellerType: "مسوق",
    whatsapp: "201055512345",
    description: "محل واجهة زجاجية، مناسب لكافيه أو محل ملابس، رخصة جاهزة.",
    image: "https://picsum.photos/seed/aqaar3/800/600",
    images: gallery("aqaar3", 4),
    lat: 31.445,
    lng: 31.662,
  },
  {
    id: "dm-4",
    title: "شقة استوديوهات استثمارية",
    city: "دمياط الجديدة",
    district: "الحي الساحلي",
    type: "شقة",
    area: 90,
    rooms: 1,
    bathrooms: 1,
    price: 1650000,
    sellerType: "مطور",
    whatsapp: "201077788899",
    description: "وحدة مفروشة جاهزة للإيجار اليومي، عائد استثماري جذاب.",
    image: "https://picsum.photos/seed/aqaar5/800/600",
    images: gallery("aqaar5"),
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
    sellerType: "فرد",
    whatsapp: "201033344455",
    description: "شاليه بإطلالة مباشرة على البحر، حديقة ومسبح صغير.",
    image: "https://picsum.photos/seed/rasbar1/800/600",
    images: gallery("rasbar1"),
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
    sellerType: "مسوق",
    whatsapp: "201066677788",
    description: "شقة قريبة من الكورنيش والخدمات، تشطيب كامل.",
    image: "https://picsum.photos/seed/rasbar2/800/600",
    images: gallery("rasbar2"),
    lat: 31.508,
    lng: 31.825,
  },
  {
    id: "rb-3",
    title: "فيلا صيفية واسعة",
    city: "رأس البر",
    district: "حي الشاليهات",
    type: "فيلا",
    area: 250,
    rooms: 4,
    bathrooms: 3,
    price: 4200000,
    sellerType: "مطور",
    whatsapp: "201011122233",
    description: "فيلا صيفية 4 غرف، مثالية للعائلات والإيجار الموسمي.",
    image: "https://picsum.photos/seed/rasbar3/800/600",
    images: gallery("rasbar3"),
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
    sellerType: "فرد",
    whatsapp: "201044455566",
    description: "أرض سكنية قريبة من الشاطئ، خدمات مكتملة.",
    image: "https://picsum.photos/seed/rasbar4/800/600",
    images: gallery("rasbar4", 3),
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
    sellerType: "فرد",
    whatsapp: "201088899900",
    description: "شقة في موقع مركزي قريب من الأسواق والمساجد التاريخية.",
    image: "https://picsum.photos/seed/olddm1/800/600",
    images: gallery("olddm1"),
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
    price: 1750000,
    sellerType: "مسوق",
    whatsapp: "201022233344",
    description: "شقة بإطلالة نيلية جزئية، 3 غرف وتشطيب حديث.",
    image: "https://picsum.photos/seed/olddm2/800/600",
    images: gallery("olddm2"),
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
    sellerType: "فرد",
    whatsapp: "201099900011",
    description: "محل في قلب السوق، مناسب للملابس أو الأثاث.",
    image: "https://picsum.photos/seed/olddm3/800/600",
    images: gallery("olddm3", 4),
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
    sellerType: "مطور",
    whatsapp: "201055566677",
    description: "فيلا تراثية تم تجديدها بالكامل مع الحفاظ على الطابع الدمياطي.",
    image: "https://picsum.photos/seed/olddm4/800/600",
    images: gallery("olddm4"),
    lat: 31.425,
    lng: 31.816,
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
    sellerType: "مطور",
    whatsapp: "201011122233",
    description:
      "شقة في كمبوند جديد على البحر مباشرة، 3 غرف و2 حمام، بحيرة صناعية وحدائق، تسليم فوري.",
    image: "https://picsum.photos/seed/newmans1/800/600",
    images: gallery("newmans1"),
    lat: 31.132,
    lng: 31.556,
  },
  // —— جمصة ——
  {
    id: "gm-1",
    title: "شاليه مصيف على شاطئ جمصة",
    city: "جمصة",
    district: "الحي السياحي",
    type: "شقة",
    area: 95,
    rooms: 2,
    bathrooms: 1,
    price: 1450000,
    sellerType: "فرد",
    whatsapp: "201044455566",
    description:
      "شاليه مصيف مفروش على بعد خطوات من الشاطئ، 2 غرف وحمام، مناسب للمصايف والاستثمار.",
    image: "https://picsum.photos/seed/gamasa1/800/600",
    images: gallery("gamasa1"),
    lat: 31.441,
    lng: 31.531,
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
    if (p.price < filters.priceMin || p.price > filters.priceMax) return false;

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
