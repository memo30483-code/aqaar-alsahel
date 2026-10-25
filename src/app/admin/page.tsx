"use client";

import Link from "next/link";
import {
  Building2,
  Check,
  Clock3,
  Home,
  LayoutList,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { MashrabiyaLayer, VerifiedSeal } from "@/components/Ornaments";
import { getSession, hasAdminAccess } from "@/lib/session";

/* === أنواع التبويبات === */
type TabKey = "listings" | "users" | "developers";

/* === التبويبات === */
const TABS: { key: TabKey; labelKey: MessageKey; descKey: MessageKey; icon: typeof LayoutList }[] = [
  { key: "listings", labelKey: "admin.tab.listings", descKey: "admin.listings.desc", icon: LayoutList },
  { key: "users", labelKey: "admin.tab.users", descKey: "admin.users.desc", icon: Users },
  { key: "developers", labelKey: "admin.tab.developers", descKey: "admin.developers.desc", icon: Building2 },
];

/* === الإحصاءات السريعة === */
const MOCK_STATS = [
  { key: "listings", label: "admin.stat.listings" as MessageKey, value: 24, icon: LayoutList },
  { key: "pending", label: "admin.stat.pending" as MessageKey, value: 7, icon: Clock3 },
  { key: "developers", label: "admin.stat.developers" as MessageKey, value: 4, icon: Building2 },
  { key: "users", label: "admin.stat.users" as MessageKey, value: 128, icon: Users },
];

/* === البيانات المMock للمستخدمين === */
const MOCK_USERS: Array<{
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  joinedAt: string;
}> = [
  {
    id: "u-1",
    name: "محمود السيد الشريف",
    email: "admin@aqaar-alsahel.com",
    phone: "201012345678",
    role: "super_admin",
    active: true,
    joinedAt: "2026-01-12",
  },
  {
    id: "u-2",
    name: "هبة عبد الرحمن",
    email: "heba.moderator@aqaar-alsahel.com",
    phone: "201098765432",
    role: "moderator",
    active: true,
    joinedAt: "2026-02-03",
  },
  {
    id: "u-3",
    name: "شركة الدلتا للتطوير العقاري",
    email: "sales@delta-dev.com",
    phone: "201155667788",
    role: "agent",
    active: true,
    joinedAt: "2026-02-19",
  },
  {
    id: "u-4",
    name: "كريم فتحي الدسوقي",
    email: "karim.fathy@gmail.com",
    phone: "201221144556",
    role: "agent",
    active: false,
    joinedAt: "2026-03-08",
  },
  {
    id: "u-5",
    name: "منى إبراهيم سلامة",
    email: "mona.ibrahim@outlook.com",
    phone: "201006677889",
    role: "user",
    active: true,
    joinedAt: "2026-03-27",
  },
  {
    id: "u-6",
    name: "أحمد جمال الدين",
    email: "ahmed.gamal@yahoo.com",
    phone: "201288990011",
    role: "user",
    active: true,
    joinedAt: "2026-04-02",
  },
];

/* === البيانات المMock للمطورين === */
const MOCK_DEVELOPERS: Array<{
  id: string;
  company: string;
  owner: string;
  city: string;
  projects: number;
  verified: boolean;
  requestedAt: string;
}> = [
  {
    id: "d-1",
    company: "شركة الدلتا للتطوير العقاري",
    owner: "م. طارق الدلتا",
    city: "دمياط الجديدة",
    projects: 4,
    verified: true,
    requestedAt: "2026-01-20",
  },
  {
    id: "d-2",
    company: "مجموعة الساحل للاستثمار",
    owner: "م. رانيا البحر",
    city: "رأس البر",
    projects: 3,
    verified: true,
    requestedAt: "2026-02-06",
  },
  {
    id: "d-3",
    company: "المنصورة الحديثة للتطوير",
    owner: "م. عمرو الشرقاوي",
    city: "المنصورة الجديدة",
    projects: 2,
    verified: false,
    requestedAt: "2026-03-15",
  },
  {
    id: "d-4",
    company: "نماء فارسكور للعقارات",
    owner: "م. سامح عبد الله",
    city: "فارسكور",
    projects: 1,
    verified: false,
    requestedAt: "2026-04-09",
  },
];

/* === البيانات المMock للعقارات === */
const MOCK_LISTINGS: Array<{
  id: string;
  title: string;
  city: string;
  type: string;
  sellerType: string;
  price: number;
  status: "pending" | "approved" | "rejected";
}> = [
  {
    id: "l-1",
    title: "شقة للبيع في الدقي",
    city: "القاهرة",
    type: "shaghal",
    sellerType: "owner",
    price: 2500000,
    status: "pending",
  },
  {
    id: "l-2",
    title: "منزل فاخر في 6 أكتوبر",
    city: "الجيزة",
    type: "home",
    sellerType: "agent",
    price: 8500000,
    status: "approved",
  },
];

/* === مكون بطاقة الإحصائية === */
function StatCard({
  label,
  value,
  icon,
}: {
  label: MessageKey;
  value: number;
  icon: React.ElementType;
}) {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden rounded-3xl border border-sand-300 bg-white p-4 shadow-soft">
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
        <icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-2xl font-black tracking-tight text-ocean-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold text-sand-700">{t(label)}</p>
    </div>
  );
}

/* === تبويب التنقل === */
function TabNav({
  activeKey,
  onSelect,
}: {
  activeKey: TabKey;
  onSelect: (key: TabKey) => void;
}) {
  const { t } = useI18n();
  return (
    <nav className="mt-5 flex flex-wrap gap-2">
      {TABS.map(({ key, labelKey, icon }) => {
        const active = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              active
                ? "border-ocean-700 bg-ocean-700 text-white shadow-soft"
                : "border-sand-300 bg-white text-ocean-800 hover:border-gold-300"
            }`}
          >
            <icon className="h-4 w-4" />
            {t(labelKey)}
          </button>
        );
      })}
    </nav>
  );
}

/* === كرت مطوّر === */
function DeveloperCard({
  developer,
  onToggleVerified,
}: {
  developer: (typeof MOCK_DEVELOPERS)[number];
  onToggleVerified: (id: string) => void;
}) {
  const { t } = useI18n();
  const roleLabels: Record<string, string> = {};
  return (
    <article className="relative flex flex-col overflow-hidden rounded-3xl border border-sand-300 bg-white p-4 shadow-soft">
      <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />

      <div className="relative flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
            developer.verified
              ? "border-gold-300/80 bg-gradient-to-br from-gold-100 via-gold-200 to-gold-400 text-gold-900"
              : "border-sand-300 bg-sand-100 text-sand-700"
          }`}
        >
          <VerifiedSeal title={t("seal.title")} className="h-3.5 w-3.5" />
          {developer.verified ? t("admin.dev.verified") : t("admin.dev.unverified")}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
          <Building2 className="h-4 w-4" />
        </span>
      </div>

      <h3 className="relative mt-3 line-clamp-2 text-sm font-bold text-ocean-900">
        {developer.company}
      </h3>
      <p className="relative mt-1 text-xs font-semibold text-sand-700">
        {developer.owner}
      </p>
      <p className="relative mt-2 text-[11px] text-sand-600">
        {developer.city} · {developer.projects} مشاريع
      </p>
      <p className="relative mt-0.5 text-[11px] text-sand-500">
        تم طلب التوثيق: <span dir="ltr">{developer.requestedAt}</span>
      </p>

      <button
        type="button"
        onClick={() => onToggleVerified(developer.id)}
        className={`relative mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
          developer.verified
            ? "border-sand-300 bg-white text-sand-700 hover:bg-sand-100"
            : "border-gold-300 bg-gradient-to-br from-gold-300 to-gold-500 text-gold-900 hover:from-gold-200 hover:to-gold-400"
        }`}
      >
        <VerifiedSeal title={t("seal.title")} className="h-4 w-4" />
        {developer.verified ? t("admin.action.unverify") : t("admin.action.verify")}
      </button>

      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-l from-gold-700 via-gold-400 to-gold-700" />
    </article>
  );
}

/* === جدول المستخدمين === */
function UsersTable({
  users,
  onToggleActive,
  onChangeRole,
}: {
  users: typeof MOCK_USERS;
  onToggleActive: (id: string) => void;
  onChangeRole: (id: string, role: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="overflow-hidden rounded-3xl border border-sand-300 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-start text-sm">
          <thead className="bg-sand-100 text-[11px] text-sand-700">
            <tr>
              <th className="px-4 py-3 text-start font-bold">{t("admin.col.user")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.col.contact")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.col.role")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.col.joined")}</th>
              <th className="px-4 py-3 text-start font-bold">{t("admin.col.account")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-sand-200 align-middle transition hover:bg-sand-50"
              >
                <td className="px-4 py-3">
                  <p className="font-bold text-ocean-900">{user.name}</p>
                </td>
                <td className="px-4 py-3 text-[11px] leading-5 text-sand-700">
                  <span className="block" dir="ltr">{user.email}</span>
                  <span className="block" dir="ltr">+{user.phone}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(event) =>
                      onChangeRole(user.id, event.target.value)
                    }
                    className="rounded-xl border border-sand-300 bg-white px-2.5 py-1.5 text-xs font-bold text-ocean-900 outline-none transition focus:border-ocean-500"
                  >
                    <option value="user">{t("admin.role.user")}</option>
                    <option value="agent">{t("admin.role.agent")}</option>
                    <option value="moderator">{t("admin.role.moderator")}</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    user.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}>
                    {user.active ? t("admin.state.active") : t("admin.state.inactive")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* === الصفحة الرئيسية === */
export default function AdminPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [tab, setTab] = useState<TabKey>("listings");
  const [listings, setListings] = useState<typeof MOCK_LISTINGS>(MOCK_LISTINGS);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const session = getSession();
    if (!hasAdminAccess(session)) {
      // Redirect to login, will return back to admin after sign-in.
      router.replace("/login?redirect=/admin");
    }
  }, [isMounted, router]);

  if (!isMounted) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6">
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-3xl border border-sand-300 bg-white" />
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl border border-sand-300 bg-white" />
            ))}
          </div>
          <div className="mt-4 h-10 animate-pulse rounded-2xl border border-sand-300 bg-white" />
        </div>
      </div>
    );
  }

  // While mounted but before auth check resolves, keep the loading skeleton.
  const session = getSession();
  if (!hasAdminAccess(session)) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6">
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-3xl border border-sand-300 bg-white" />
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl border border-sand-300 bg-white" />
            ))}
          </div>
          <div className="mt-4 h-10 animate-pulse rounded-2xl border border-sand-300 bg-white" />
        </div>
      </div>
    );
  }

  const handleTabChange = (key: TabKey) => {
    setTab(key);
    setFlash("");
  };

  const handleToggleActive = (id: string) => {
    const user = MOCK_USERS.find((u) => u.id === id);
    if (user) {
      setFlash(`تم ${user.active ? "تفعيل" : "تعطيل"} المستخدم ${user.name}`);
      setTimeout(() => setFlash(""), 2400);
    }
  };

  const handleChangeRole = (id: string, role: string) => {
    setFlash(`تم تغيير دور المستخدم ${id}`);
    setTimeout(() => setFlash(""), 2400);
  };

  const handleToggleVerified = (id: string) => {
    const dev = MOCK_DEVELOPERS.find((d) => d.id === id);
    if (dev) {
      setFlash(`${dev.company}: ${dev.verified ? "تم إلغاء التوثيق" : "تم منح التوثيق"}`);
      setTimeout(() => setFlash(""), 2400);
    }
  };

  if (!isMounted) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6">
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-3xl border border-sand-300 bg-white" />
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl border border-sand-300 bg-white" />
            ))}
          </div>
          <div className="mt-4 h-10 animate-pulse rounded-2xl border border-sand-300 bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6">
      {/* ترويسة اللوحة */}
      <section className="relative overflow-hidden rounded-3xl border border-gold-200 bg-gradient-to-l from-ocean-950 via-ocean-900 to-ocean-800 p-5 text-white shadow-soft sm:p-6">
        <MashrabiyaLayer tone="dark" className="opacity-[0.08]" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-l from-gold-700 via-gold-400 to-gold-700" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/50 bg-gold-400/15 px-3 py-1 text-[11px] font-bold text-gold-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("admin.role.admin")}
            </span>
            <h1 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
              {t("admin.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-6 text-sand-300 sm:text-sm">
              {t("admin.subtitle")}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <Home className="h-3.5 w-3.5" />
            {t("admin.backHome")}
          </Link>
        </div>
      </section>

      {/* الإحصاءات السريعة */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {MOCK_STATS.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* تبويبات اللوحة */}
      <TabNav activeKey={tab} onSelect={handleTabChange} />

      <p className="mt-3 text-xs leading-6 text-sand-700">{t(tab.descKey)}</p>

      {flash && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          {flash}
        </p>
      )}

      {/* المحتوى */}
      <div className="mt-4">
        {tab === "listings" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <h2 className="mt-3 text-sm font-bold text-ocean-900">
              {t("admin.listings.heading")}
            </h2>
            {listings.length === 0 && (
              <p className="text-sand-700">{t("admin.listings.empty")}</p>
            )}
            {listings.map((listing) => (
              <div key={listing.id} className="relative overflow-hidden rounded-3xl border border-sand-300 bg-white p-4 shadow-soft">
                <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
                <div className="relative flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                    listing.status === "approved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : listing.status === "rejected"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-sand-300 bg-sand-100 text-sand-700"
                  }`}>
                    {listing.status === "pending" ? t("admin.status.pending") : t(listing.status === "approved" ? "admin.status.approved" : "admin.status.rejected")}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
                    <LayoutList className="h-4 w-4" />
                  </span>
                </div>

                <h3 className="relative mt-3 line-clamp-2 text-sm font-bold text-ocean-900">
                  {listing.title}
                </h3>
                <p className="relative mt-1 text-xs font-semibold text-sand-700">{listing.city}</p>
                <p className="relative mt-2 text-[11px] text-sand-600">
                  {listing.type} · {listing.sellerType}
                </p>
                <p className="relative mt-0.5 text-[11px] text-sand-500">
                  السعر: {listing.price.toLocaleString()}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      listing.status === "pending"
                        ? "border-ocean-200 bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
                        : listing.status === "approved"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    {listing.status === "pending" ? t("admin.status.pending") : t(listing.status === "approved" ? "admin.status.approved" : "admin.status.rejected")}
                  </button>
                  <button
                    className="rounded-xl border px-3 py-2 text-xs font-bold transition border-sand-300 bg-white text-sand-700 hover:bg-sand-100"
                  >
                    تعديل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "users" && (
          <UsersTable
            users={MOCK_USERS}
            onToggleActive={handleToggleActive}
            onChangeRole={handleChangeRole}
          />
        )}

        {tab === "developers" && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MOCK_DEVELOPERS.map((developer) => (
              <DeveloperCard
                key={developer.id}
                developer={developer}
                onToggleVerified={handleToggleVerified}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}