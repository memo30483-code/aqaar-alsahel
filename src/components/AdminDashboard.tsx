"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Gift,
  Home,
  LayoutList,
  ListChecks,
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
import AdminMarqueeTab from "@/components/admin/AdminMarqueeTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminPermissionsTab from "@/components/admin/AdminPermissionsTab";
import AdminLogsTab from "@/components/admin/AdminLogsTab";
import AdminDevelopersTab from "@/components/admin/AdminDevelopersTab";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";

type TabKey =
  | "overview"
  | "listings"
  | "offers"
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
  { key: "listings", label: "الإعلانات", Icon: LayoutList, permission: "listings.view" },
  { key: "offers", label: "العروض والتخفيضات", Icon: Gift, permission: "offers.view" },
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
      <main className="grid min-h-[60vh] place-items-center">
        <p className="text-sm text-slate-500">جاري تحميل لوحة التحكم…</p>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="min-h-[70vh] bg-[radial-gradient(circle_at_top,_rgba(201,162,77,0.08),_transparent_55%)]">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">غير مصرح بالدخول</h1>
          <p className="text-slate-600">
            هذه الصفحة مخصصة للإدارة فقط. سجّل الدخول بحساب أدمن أو اطلب من المدير منحك
            الصلاحية.
          </p>
          <Link
            href="/login"
            className="mt-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,162,77,0.07),_transparent_60%)]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b8963b] to-[#d9b95c] text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                لوحة تحكم عقار FAMILY
              </h1>
              <p className="text-sm text-slate-500">
                {session?.name} •{" "}
                <span className="font-bold text-[#a9843a]">
                  {ROLE_LABEL[session?.role ?? "user"] ?? session?.role}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-[#b8963b] hover:text-[#b8963b]"
          >
            <Home className="h-4 w-4" /> الرئيسية
          </Link>
        </header>

        {flash && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-700">
            {flash}
          </div>
        )}

        <nav className="mb-6 flex flex-wrap gap-1.5 rounded-3xl border border-slate-100 bg-white/90 p-2">
          {visibleTabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                tab === item.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
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
      </section>
    </main>
  );
}
