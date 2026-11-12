"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  FileSearch,
  GitPullRequest,
  Gift,
  Handshake,
  Home,
  Landmark,
  KeyRound,
  LayoutList,
  LayoutTemplate,
  ListChecks,
  MapPin,
  Megaphone,
  Palette,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  Type,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { getSession, saveSession, type Session } from "@/lib/session";
import { applyRemoteValue } from "@/lib/cloud/push";
import {
  DEFAULT_OFFERS_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  getAdminLogs,
  getListings,
  getMarqueeItems,
  getOffers,
  getOffersSettings,
  getSiteSettings,
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
import AdminProfessionalsTab from "@/components/admin/AdminProfessionalsTab";
import AdminCitiesTab from "@/components/admin/AdminCitiesTab";
import AdminCompanyTab from "@/components/admin/AdminCompanyTab";
import AdminProjectsTab from "@/components/admin/AdminProjectsTab";
import AdminHomeBuilderTab from "@/components/admin/AdminHomeBuilderTab";
import AdminTextStudioTab from "@/components/admin/AdminTextStudioTab";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminBrandTab from "@/components/admin/AdminBrandTab";
import AdminAppTab from "@/components/admin/AdminAppTab";
import AdminCrmTab from "@/components/admin/AdminCrmTab";
import AdminReviewsTab from "@/components/admin/AdminReviewsTab";
import AdminPropertyRequestsTab from "@/components/admin/AdminPropertyRequestsTab";
import AdminMembersTab from "@/components/admin/AdminMembersTab";
import AdminWorkflowTab from "@/components/admin/AdminWorkflowTab";
import AdminOtpSettingsTab from "@/components/admin/AdminOtpSettingsTab";
import type { AuditEntry } from "@/lib/workflow-server";

type TabKey =
  | "overview"
  | "crm"
  | "reviews"
  | "propertyRequests"
  | "builder"
  | "texts"
  | "listings"
  | "propertyFields"
  | "offers"
  | "cities"
  | "company"
  | "site"
  | "brand"
  | "app"
  | "marquee"
  | "users"
  | "members"
  | "workflow"
  | "otp"
  | "permissions"
  | "professionals"
  | "projects"
  | "logs";

const TABS: {
  key: TabKey;
  label: string;
  Icon: typeof LayoutList;
  permission?: string;
}[] = [
  { key: "overview", label: "نظرة عامة", Icon: BarChart3 },
  { key: "crm", label: "العملاء والفرص", Icon: Handshake, permission: "crm.view" },
  { key: "reviews", label: "التقييمات", Icon: Star, permission: "reviews.view" },
  {
    key: "propertyRequests",
    label: "طلبات العقار",
    Icon: FileSearch,
    permission: "propertyRequests.view",
  },
  { key: "builder", label: "Builder الصفحات", Icon: LayoutTemplate, permission: "site.settings" },
  { key: "texts", label: "النصوص والتنسيق", Icon: Type, permission: "site.settings" },
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
  { key: "brand", label: "الهوية والشعارات", Icon: Palette, permission: "settings.full" },
  { key: "app", label: "تطبيق الموبايل", Icon: Smartphone, permission: "settings.full" },
  { key: "marquee", label: "البنرات والشريط", Icon: Megaphone, permission: "banners.manage" },
  { key: "users", label: "فريق الإدارة", Icon: Users, permission: "users.view" },
  { key: "members", label: "أعضاء الموقع", Icon: UserRoundCheck, permission: "members.view" },
  { key: "workflow", label: "المراجعة والموافقات", Icon: GitPullRequest, permission: "workflow.manage" },
  { key: "otp", label: "التحقق OTP", Icon: KeyRound, permission: "otp.manage" },
  { key: "permissions", label: "الصلاحيات", Icon: ShieldCheck, permission: "users.roles" },
  { key: "professionals", label: "المهنيون", Icon: Building2, permission: "professionals.view" },
  { key: "projects", label: "المشاريع", Icon: Briefcase, permission: "professionals.view" },
  { key: "logs", label: "سجل النشاطات", Icon: ListChecks, permission: "logs.view" },
];

const ROLE_LABEL: Record<string, string> = {
  user: "مستخدم",
  agent: "وسيط",
  moderator: "مشرف",
  reviewer: "مراجع مستندات",
  admin: "أدمن",
  super_admin: "مدير عام",
};

export default function AdminDashboard() {
  const [ready, setReady] = useState(false);
  /** تأكيد جلسة الأدمن من السيرفر — مصدر الحقيقة الوحيد للوصول */
  const [adminVerified, setAdminVerified] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersSettings, setOffersSettings] = useState<OffersSettings>(DEFAULT_OFFERS_SETTINGS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [marquee, setMarquee] = useState<MarqueeItem[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [permissionsCount, setPermissionsCount] = useState(0);
  /** يزيد بعد أي تعديل على الصلاحيات لإعادة حساب التبويبات والعدّادات */
  const [permissionsVersion, setPermissionsVersion] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [propertyRequestCount, setPropertyRequestCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [workflowCounts, setWorkflowCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    /** مهلة قصوى لأي طلب — لا نترك اللوحة معلّقة على شبكة بطيئة */
    const timeoutSignal = (ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), ms);
      return controller.signal;
    };

    const readStores = () => {
      setListings(getListings());
      setOffers(getOffers());
      setOffersSettings(getOffersSettings());
      setSiteSettings(getSiteSettings());
      setMarquee(getMarqueeItems());
      setLogs(getAdminLogs(200));
    };

    const load = async () => {
      /* تنظيف أي نسخة قديمة سبق أن حُقنت في localStorage قبل فصل الأسرار. */
      for (const secretKey of [
        "aqaar-accounts",
        "aqaar-staff-auth",
        "aqaar-review-state",
        "aqaar-audit-log",
        "aqaar-otp-settings",
      ]) {
        window.localStorage.removeItem(secretKey);
      }
      /* 1) تأكيد كوكي الأدمن الموقّع على السيرفر — سريع ومحدود بمهلة */
      let verified = false;
      let serverAdmin: {
        email: string;
        name: string;
        uid?: string;
        role: Session["role"];
        permissions: string[];
      } | null = null;

      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          signal: timeoutSignal(6_000),
        });
        if (response.ok) {
          const data = (await response.json()) as {
            authenticated?: boolean;
            email?: string;
            name?: string;
            uid?: string;
            role?: Session["role"];
            permissions?: string[];
          };
          if (data.authenticated && data.email) {
            verified = true;
            serverAdmin = {
              email: data.email,
              name: data.name || "",
              uid: data.uid,
              role: data.role,
              permissions: data.permissions ?? [],
            };
          }
        }
      } catch {
        verified = false;
      }

      if (cancelled) return;
      setAdminVerified(verified);

      const stored = getSession();
      const current: Session | null =
        verified && serverAdmin
          ? {
              name: serverAdmin.name || stored?.name || "",
              email: serverAdmin.email,
              phone: stored?.phone ?? "",
              accountType: "admin",
              verifiedAt: new Date().toISOString(),
              role: serverAdmin.role,
              staffId: serverAdmin.uid,
              permissions: serverAdmin.permissions,
            }
          : stored;

      if (verified && current) saveSession(current);
      setSession(current);

      /* 2) نعرض اللوحة فورًا بالنسخة المحلية بدل الانتظار لشبكة السحابة */
      const mayReadSensitiveLocalCopy =
        serverAdmin?.role === "super_admin" ||
        (serverAdmin?.permissions.includes("owner.contact.view") === true &&
          serverAdmin?.permissions.includes("documents.view") === true);
      if (current && mayReadSensitiveLocalCopy) readStores();
      setReady(true);

      /* 3) ثم نحدّث النسخة الكاملة (ومنها الطلبات والمستندات) في الخلفية */
      if (!verified) return;
      try {
        const cloudResponse = await fetch("/api/state?all=1", {
          cache: "no-store",
          signal: timeoutSignal(9_000),
        });
        if (cloudResponse.ok) {
          const cloudData = (await cloudResponse.json()) as {
            rows?: Record<string, { value: unknown; updated_at: string }>;
          };
          for (const [key, row] of Object.entries(cloudData.rows ?? {})) {
            applyRemoteValue(key, row.value, row.updated_at);
          }
          if (!cancelled) readStores();
        }
      } catch {
        /* انقطاع مؤقت: اللوحة تستمر بالنسخة المحلية ولا تتعطّل */
      }

      const serverCan = (permission: string) =>
        serverAdmin?.role === "super_admin" ||
        serverAdmin?.permissions.includes(permission);

      if (serverCan("users.view") || serverCan("workflow.manage") || serverCan("review.assign")) {
        void fetch("/api/admin/staff", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) return;
            const data = (await response.json()) as {
              users?: AdminUser[];
              permissionSets?: Array<{ permissions?: string[] }>;
            };
            if (cancelled) return;
            setUsers(data.users ?? []);
            setPermissionsCount(
              (data.permissionSets ?? []).reduce(
                (total, entry) => total + (entry.permissions?.length ?? 0),
                0
              )
            );
          })
          .catch(() => undefined);
      }

      if (serverCan("logs.view")) {
        void fetch("/api/admin/audit?limit=300", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) return;
            const data = (await response.json()) as { logs?: AuditEntry[] };
            if (!cancelled) {
              setLogs(
                (data.logs ?? []).map((entry) => ({
                  id: entry.id,
                  action: entry.action,
                  category: entry.category,
                  performedBy: entry.actorEmail,
                  performedByName: entry.actorName,
                  performedByRole: entry.actorRole,
                  details: entry.details,
                  timestamp: entry.at,
                  meta: entry.meta,
                }))
              );
            }
          })
          .catch(() => undefined);
      }

      void fetch("/api/admin/counts", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { counts?: Record<string, number> };
          if (!cancelled) {
            setWorkflowCounts(data.counts ?? {});
            setMemberCount(data.counts?.members ?? 0);
          }
        })
        .catch(() => undefined);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(""), 2600);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (!adminVerified) return;
    const refreshCounts = () => {
      void fetch("/api/admin/counts", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { counts?: Record<string, number> };
          setWorkflowCounts(data.counts ?? {});
          setMemberCount(data.counts?.members ?? 0);
        })
        .catch(() => undefined);
    };
    window.addEventListener("aqaar:workflow-updated", refreshCounts);
    return () => window.removeEventListener("aqaar:workflow-updated", refreshCounts);
  }, [adminVerified]);

  /** عدّاد الطلبات الجديدة على تبويب «طلبات العقار» قبل فتحه. */
  useEffect(() => {
    if (!adminVerified) return;
    let cancelled = false;
    void fetch("/api/admin/property-requests", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as {
          requests?: Array<{ status?: string }>;
        };
        if (!cancelled) {
          setPropertyRequestCount(
            (data.requests ?? []).filter((item) => item.status === "new").length
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [adminVerified]);

  const reloadLogs = useCallback(() => {
    void fetch("/api/admin/audit?limit=300", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { logs?: AuditEntry[] };
        setLogs(
          (data.logs ?? []).map((entry) => ({
            id: entry.id,
            action: entry.action,
            category: entry.category,
            performedBy: entry.actorEmail,
            performedByName: entry.actorName,
            performedByRole: entry.actorRole,
            details: entry.details,
            timestamp: entry.at,
            meta: entry.meta,
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  const notify = useCallback((message: string) => setFlash(message), []);

  const can = useCallback(
    (key: string) =>
      session?.role === "super_admin" ||
      session?.permissions?.includes(key) === true,
    [session]
  );

  /* إعادة قراءة العدّاد بعد أي تعديل على الصلاحيات */
  useEffect(() => {
    if (!permissionsVersion || !can("users.view")) return;
    void fetch("/api/admin/staff", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as {
          users?: AdminUser[];
          permissionSets?: Array<{ permissions?: string[] }>;
        };
        setUsers(data.users ?? []);
        setPermissionsCount(
          (data.permissionSets ?? []).reduce(
            (total, item) => total + (item.permissions?.length ?? 0),
            0
          )
        );
      })
      .catch(() => undefined);
  }, [permissionsVersion, can]);

  const visibleTabs = useMemo(
    () => TABS.filter((item) => !item.permission || can(item.permission)),
    [can]
  );

  /** الانتقال لتبويب من أي مكان مع احترام الصلاحيات */
  const goTo = useCallback(
    (next: TabKey) => {
      const target = TABS.find((item) => item.key === next);
      if (target?.permission && !can(target.permission)) {
        setFlash("لا تملك صلاحية الوصول إلى هذا القسم");
        return;
      }
      setTab(next);
    },
    [can]
  );

  const hasAccess = useMemo(() => {
    /* الوصول يتطلب جلسة أدمن مؤكدة من السيرفر أولًا */
    if (!adminVerified) return false;
    if (!session?.role) return false;
    if (session.role === "admin" || session.role === "super_admin") return true;
    return TABS.some((item) => item.permission && can(item.permission));
  }, [adminVerified, session, can]);

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-sand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand-300 border-t-gold-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] bg-sand-50">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
        <header className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-gold-300">
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
              {item.key === "propertyRequests" && propertyRequestCount > 0 && (
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[9px] font-black ${
                  tab === item.key ? "bg-white text-ocean-950" : "bg-rose-500 text-white"
                }`}>
                  {propertyRequestCount > 99 ? "99+" : propertyRequestCount}
                </span>
              )}
              {item.key === "members" && memberCount > 0 && (
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[9px] font-black ${tab === item.key ? "bg-white text-ocean-950" : "bg-rose-500 text-white"}`}>
                  {memberCount > 99 ? "99+" : memberCount}
                </span>
              )}
              {item.key === "listings" && (workflowCounts["listings.review"] ?? 0) + (workflowCounts["listings.approval"] ?? 0) > 0 && (
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[9px] font-black ${tab === item.key ? "bg-white text-ocean-950" : "bg-amber-500 text-white"}`}>
                  {(workflowCounts["listings.review"] ?? 0) + (workflowCounts["listings.approval"] ?? 0)}
                </span>
              )}
              {item.key === "professionals" && (workflowCounts["professionals.review"] ?? 0) + (workflowCounts["professionals.approval"] ?? 0) > 0 && (
                <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[9px] font-black ${tab === item.key ? "bg-white text-ocean-950" : "bg-amber-500 text-white"}`}>
                  {(workflowCounts["professionals.review"] ?? 0) + (workflowCounts["professionals.approval"] ?? 0)}
                </span>
              )}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <AdminOverviewTab
            listings={listings}
            offers={offers}
            logs={logs}
            permissionsCount={permissionsCount}
            goTo={goTo}
          />
        )}

        {tab === "crm" && (
          <AdminCrmTab
            users={users}
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "reviews" && (
          <AdminReviewsTab
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "propertyRequests" && (
          <AdminPropertyRequestsTab
            users={users}
            settings={siteSettings}
            can={can}
            onSettingsChange={setSiteSettings}
            onCountChange={setPropertyRequestCount}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "builder" && (
          <AdminHomeBuilderTab
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "texts" && (
          <AdminTextStudioTab
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

        {tab === "brand" && (
          <AdminBrandTab
            settings={siteSettings}
            can={can}
            onChange={setSiteSettings}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "app" && (
          <AdminAppTab
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

        {tab === "members" && (
          <AdminMembersTab
            can={can}
            notify={notify}
            onCountChange={setMemberCount}
          />
        )}

        {tab === "workflow" && (
          <AdminWorkflowTab users={users} can={can} notify={notify} />
        )}

        {tab === "otp" && (
          <AdminOtpSettingsTab can={can} notify={notify} />
        )}

        {tab === "permissions" && (
          <AdminPermissionsTab
            users={users}
            can={can}
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
            notify={notify}
            reloadLogs={reloadLogs}
            onPermissionsChange={() => setPermissionsVersion((value) => value + 1)}
          />
        )}

        {tab === "professionals" && (
          <AdminProfessionalsTab
            can={can}
            notify={notify}
            reloadLogs={reloadLogs}
          />
        )}

        {tab === "projects" && (
          <AdminProjectsTab can={can} notify={notify} reloadLogs={reloadLogs} />
        )}

        {tab === "logs" && <AdminLogsTab logs={logs} />}
      </div>
    </div>
  );
}
