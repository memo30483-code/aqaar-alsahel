"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Gift,
  Home,
  Landmark,
  LayoutList,
  LayoutTemplate,
  ListChecks,
  MapPin,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getSession, type Session } from "@/lib/session";
import {
  DEFAULT_OFFERS_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  getAdminLogs,
  getAdminPermissions,
  getDevelopers,
  getListings,
  getMarqueeItems,
  getOffers,
  getOffersSettings,
  getSiteSettings,
  getUsers,
  hasPermission,
  type AdminDeveloper,
  type AdminListing,
  type AdminLog,
  type AdminUser,
  type MarqueeItem,
  type Offer,
  type OffersSettings,
  type SiteSettings,
} from "@/lib/admin-system";
import AdminListingsTab from "@/components/admin/AdminListingsTab";
import AdminOffersTab from "@/components/admin/AdminOffersTab";
import AdminSiteTab from "@/components/admin/AdminSiteTab";
import AdminAddPropertyFieldsTab from "@/components/admin/AdminAddPropertyFieldsTab";
import AdminMarqueeTab from "@/components/admin/AdminMarqueeTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminPermissionsTab from "@/components/admin/AdminPermissionsTab";
import AdminLogsTab from "@/components/admin/AdminLogsTab";
import AdminDevelopersTab from "@/components/admin/AdminDevelopersTab";
import AdminCitiesTab from "@/components/admin/AdminCitiesTab";
import AdminCompanyTab from "@/components/admin/AdminCompanyTab";
import AdminHomeBuilderTab from "@/components/admin/AdminHomeBuilderTab";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";

type TabKey =
  | "overview"
  | "builder"
  | "listings"
  | "propertyFields"
  | "offers"
  | "cities"
  | "company"
  | "site"
  | "marquee"
  | "users"
  | "permissions"
  | "developers"
  | "logs";

const TABS: {
  key: TabKey;
  label: string;
  Icon: typeof LayoutList;
  permission?: string;
}[] = [
  { key: "overview", label: "نظرة عامة", Icon: BarChart3 },
  { key: "builder", label: "Builder الرئيسية", Icon: LayoutTemplate, permission: "site.settings" },
  { key: "listings", label: "الإعلانات", Icon: LayoutList, permission: "listings.view" },
  {
    key: "propertyFields",
    label: "حقول إضافة العقار",
    Icon: ClipboardList,
    permission: "site.settings",
  },
  { key: "offers", label: "العروض والتخفيضات", Icon: Gift, permission: "offers.view" },
  { key: "cities", label: "المدن", Icon: MapPin, permission: "site.settings" },
  { key: "company", label: "بيانات الشركة", Icon: Landmark, permission: "site.settings" },
  { key: "site", label: "إعدادات الموقع", Icon: Settings, permission: "site.settings" },
  { key: "marquee", label: "البنرات والشريط", Icon: Megaphone, permission: "banners.manage" },
  { key: "users", label: "المستخدمون", Icon: Users, permission: "users.view" },
  { key: "permissions", label: "الصلاحيات", Icon: ShieldCheck, permission: "users.roles" },
  { key: "developers", label: "المطورون", Icon: Building2, permission: "site.settings" },
  { key: "logs", label: "سجل النشاطات", Icon: ListChecks, permission: "logs.view" },
];

const ROLE_LABEL: Record<string, string> = {
  user: "مستخدم",
  agent: "وسيط",
  moderator: "مشرف",
  admin: "أدمن",
  super_admin: "مدير عام",
};

export default function AdminDashboard() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [developers, setDevelopers] = useState<AdminDeveloper[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersSettings, setOffersSettings] = useState<OffersSettings>(DEFAULT_OFFERS_SETTINGS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [marquee, setMarquee] = useState<MarqueeItem[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [permissionsCount, setPermissionsCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const current = getSession();
    setSession(current);
    if (current) {
      const userList = getUsers();
      setUsers(userList);
      setListings(getListings());
      setDevelopers(getDevelopers());
      setOffers(getOffers());
      setOffersSettings(getOffersSettings());
      setSiteSettings(getSiteSettings());
      setMarquee(getMarqueeItems());
      setLogs(getAdminLogs(200));
      setPermissionsCount(
        userList.reduce((total, user) => total + getAdminPermissions(user.id).length, 0)
      );
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(""), 2600);
    return () => clearTimeout(timer);
  }, [flash]);

  const reloadLogs = useCallback(() => {
    setLogs(getAdminLogs(200));
  }, []);

  const notify = useCallback((message: string) => setFlash(message), []);

  const currentUser = useMemo(
    () => users.find((user) => user.email === session?.email),
    [users, session]
  );

  const can = useCallback(
    (key: string) => hasPermission(session?.role, currentUser?.id, key),
    [session, currentUser]
  );

  const visibleTabs = useMemo(
    () => TABS.filter((item) => !item.permission || can(item.permission)),
    [can]
  );

  const hasAccess = useMemo(() => {
    if (!session?.role) return false;
    if (session.role === "admin" || session.role === "super_admin") return true;
    return TABS.some((item) => item.permission && can(item.permission));
  }, [session, can]);

  if (!ready) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-sand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand-300 border-t-gold-500" />
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="min-h-[70vh] bg-sand-50">
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
          <div className="w-full overflow-hidden rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_30px_80px_-70px_rgba(20,26,51,0.6)] sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-2xl font-black text-ocean-900">
              غير مصرح بالدخول
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-7 text-sand-700">
              هذه الصفحة مخصصة للإدارة فقط. سجّل الدخول بحساب أدمن أو اطلب من المدير
              منحك الصلاحية.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-6 py-2.5 text-[12.5px] font-black text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sand-50">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#141a33,#2d3875)] text-gold-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gold-600">
                  <span aria-hidden className="h-px w-5 bg-gold-400/70" />
                  لوحة التحكم
                </p>
                <h1 className="mt-1 text-[22px] font-black leading-8 text-ocean-900 sm:text-[26px]">
                  لوحة تحكم عقار FAMILY
                </h1>
                <p className="mt-0.5 text-[11.5px] font-semibold text-sand-600">
                  {session?.name} •{" "}
                  <span className="font-extrabold text-gold-700">
                    {ROLE_LABEL[session?.role ?? "user"] ?? session?.role}
                  </span>
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-sand-200 bg-sand-50 px-4 py-2.5 text-[12px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
            >
              <Home className="h-4 w-4 text-gold-600" /> الرئيسية
            </Link>
          </div>
        </header>

        {flash && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-700">
            {flash}
          </div>
        )}

        <nav className="sticky top-[74px] z-30 mb-5 mt-5 flex flex-wrap gap-1.5 rounded-3xl border border-sand-200 bg-white/90 p-2 shadow-[0_20px_50px_-45px_rgba(20,26,51,0.6)] backdrop-blur-xl">
          {visibleTabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition sm:text-[13px] ${
                tab === item.key
                  ? "bg-ocean-950 text-white shadow-sm"
                  : "text-sand-700 hover:bg-sand-50"
              }`}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <AdminOverviewTab
            listings={listings}
            offers={offers}
            logs={logs}
            permissionsCount={permissionsCount}
            goTo={(next) => setTab(next)}
          />
        )}

        {tab === "builder" && (
          <AdminHomeBuilderTab
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "listings" && (
          <AdminListingsTab
            listings={listings}
            users={users}
            can={can}
            onChange={setListings}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "propertyFields" && (
          <AdminAddPropertyFieldsTab
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "offers" && (
          <AdminOffersTab
            offers={offers}
            settings={offersSettings}
            can={can}
            onOffersChange={setOffers}
            onSettingsChange={setOffersSettings}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "cities" && (
          <AdminCitiesTab
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "company" && (
          <AdminCompanyTab
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "site" && (
          <AdminSiteTab
            settings={siteSettings}
            can={can}
            onChange={setSiteSettings}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "marquee" && (
          <AdminMarqueeTab
            items={marquee}
            can={can}
            onChange={setMarquee}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "users" && (
          <AdminUsersTab
            users={users}
            can={can}
            onChange={setUsers}
            notify={notify}
            reloadLogs={reloadLogs}
            openPermissions={(userId) => {
              setSelectedUserId(userId);
              setTab("permissions");
            }}
          />
        )}

        {tab === "permissions" && (
          <AdminPermissionsTab
            users={users}
            can={can}
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "developers" && (
          <AdminDevelopersTab
            developers={developers}
            onChange={setDevelopers}
            notify={notify}
            reloadLogs={reloadLogs}
            canManage={can("site.settings")}
          />
        )}

        {tab === "logs" && <AdminLogsTab logs={logs} />}
      </div>
    </main>
  );
}
