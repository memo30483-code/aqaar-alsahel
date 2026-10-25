"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Clock3,
  Home,
  LayoutList,
  Lock,
  Pencil,
  Power,
  Save,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { propertyTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import { getSession, hasAdminAccess, type UserRole } from "@/lib/session";
import { MashrabiyaLayer, VerifiedSeal } from "@/components/Ornaments";
import {
  getDevelopers,
  getListings,
  getUsers,
  saveDevelopers,
  saveListingOverride,
  saveUsers,
  type AdminDeveloper,
  type AdminListing,
  type AdminUser,
  type ListingStatus,
} from "@/lib/admin-data";

type TabKey = "listings" | "users" | "developers";

const TABS: {
  key: TabKey;
  labelKey: MessageKey;
  descKey: MessageKey;
  Icon: typeof LayoutList;
}[] = [
  {
    key: "listings",
    labelKey: "admin.tab.listings",
    descKey: "admin.listings.desc",
    Icon: LayoutList,
  },
  {
    key: "users",
    labelKey: "admin.tab.users",
    descKey: "admin.users.desc",
    Icon: Users,
  },
  {
    key: "developers",
    labelKey: "admin.tab.developers",
    descKey: "admin.developers.desc",
    Icon: Building2,
  },
];

const ROLES: UserRole[] = ["user", "agent", "moderator", "admin", "super_admin"];

const ROLE_LABEL: Record<UserRole, MessageKey> = {
  user: "admin.role.user",
  agent: "admin.role.agent",
  moderator: "admin.role.moderator",
  admin: "admin.role.admin",
  super_admin: "admin.role.super_admin",
};

const STATUS_LABEL: Record<ListingStatus, MessageKey> = {
  pending: "admin.status.pending",
  approved: "admin.status.approved",
  rejected: "admin.status.rejected",
};

const STATUS_STYLE: Record<ListingStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const ROW_ACTION =
  "inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition";

/** لوحة تحكم مدير الموقع: إحصاءات سريعة + تبويبات إدارة الإعلانات والمستخدمين والمطورين */
export default function AdminDashboard() {
  const { t } = useI18n();

  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState<UserRole | null>(null);
  const [tab, setTab] = useState<TabKey>("listings");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [developers, setDevelopers] = useState<AdminDeveloper[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", price: "" });
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const session = getSession();
    const allowed = hasAdminAccess(session);
    setAuthorized(allowed);
    if (allowed && session) {
      setAdminName(session.name);
      setAdminRole(session.role ?? null);
      setListings(getListings());
      setUsers(getUsers());
      setDevelopers(getDevelopers());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(""), 2400);
    return () => clearTimeout(timer);
  }, [flash]);

  const stats = useMemo(
    () => [
      {
        key: "listings",
        labelKey: "admin.stat.listings" as MessageKey,
        value: listings.length,
        Icon: LayoutList,
      },
      {
        key: "pending",
        labelKey: "admin.stat.pending" as MessageKey,
        value: listings.filter((item) => item.status === "pending").length,
        Icon: Clock3,
      },
      {
        key: "developers",
        labelKey: "admin.stat.developers" as MessageKey,
        value: developers.length,
        Icon: Building2,
      },
      {
        key: "users",
        labelKey: "admin.stat.users" as MessageKey,
        value: users.filter((user) => user.active).length,
        Icon: Users,
      },
    ],
    [listings, developers, users]
  );

  /* ------------------------ إجراءات الإعلانات ------------------------ */

  const reviewListing = (listing: AdminListing, status: ListingStatus) => {
    saveListingOverride(listing.id, { status });
    setListings((rows) =>
      rows.map((row) => (row.id === listing.id ? { ...row, status } : row))
    );
    setFlash(t("admin.changesSaved"));
  };

  const startEdit = (listing: AdminListing) => {
    setEditingId(listing.id);
    setDraft({ title: listing.title, price: String(listing.price) });
  };

  const commitEdit = (listing: AdminListing) => {
    const price = Number(draft.price);
    const patch = {
      title: draft.title.trim() || listing.title,
      price: Number.isFinite(price) && price > 0 ? price : listing.price,
    };
    saveListingOverride(listing.id, patch);
    setListings((rows) =>
      rows.map((row) => (row.id === listing.id ? { ...row, ...patch } : row))
    );
    setEditingId(null);
    setFlash(t("admin.changesSaved"));
  };

  /* ------------------------ إجراءات المستخدمين ------------------------ */

  const changeRole = (id: string, role: UserRole) => {
    const next = users.map((user) => (user.id === id ? { ...user, role } : user));
    setUsers(next);
    saveUsers(next);
    setFlash(t("admin.changesSaved"));
  };

  const toggleUserActive = (id: string) => {
    const next = users.map((user) =>
      user.id === id ? { ...user, active: !user.active } : user
    );
    setUsers(next);
    saveUsers(next);
    setFlash(t("admin.changesSaved"));
  };

  /* ------------------------ إجراءات المطورين ------------------------ */

  const toggleVerified = (id: string) => {
    const next = developers.map((developer) =>
      developer.id === id ? { ...developer, verified: !developer.verified } : developer
    );
    setDevelopers(next);
    saveDevelopers(next);
    setFlash(t("admin.changesSaved"));
  };

  /* ------------------------------ الرندر ------------------------------ */

  if (!ready) return <AdminSkeleton />;

  if (!authorized) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6">
        <div className="relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-sand-300 bg-white p-8 text-center shadow-soft">
          <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
          <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-600 to-ocean-800 text-white shadow-lg">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="relative mt-4 text-lg font-black text-ocean-900">
            {t("admin.denied.title")}
          </h1>
          <p className="relative mt-2 text-sm leading-6 text-sand-700">
            {t("admin.denied.body")}
          </p>
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-br from-ocean-600 to-ocean-800 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t("admin.denied.cta")}
            </Link>
            <Link
              href="/"
              className="rounded-full border border-sand-300 px-5 py-2.5 text-sm font-bold text-ocean-800 transition hover:border-gold-300"
            >
              {t("admin.backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0];

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
              {adminRole ? t(ROLE_LABEL[adminRole]) : t("admin.role.admin")}
            </span>
            <h1 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
              {t("admin.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-6 text-sand-300 sm:text-sm">
              {t("admin.subtitle")}
            </p>
            {adminName && (
              <p className="mt-2 text-[11px] font-bold text-gold-200">
                {adminName} · {t("admin.updatedNow")}
              </p>
            )}
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
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="relative overflow-hidden rounded-3xl border border-sand-300 bg-white p-4 shadow-soft"
          >
            <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
              <stat.Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-black tracking-tight text-ocean-900">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-sand-700">
              {t(stat.labelKey)}
            </p>
          </div>
        ))}
      </div>

      {/* تبويبات اللوحة */}
      <nav className="mt-5 flex flex-wrap gap-2">
        {TABS.map(({ key, labelKey, Icon }) => {
          const active = key === tab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setEditingId(null);
              }}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                active
                  ? "border-ocean-700 bg-ocean-700 text-white shadow-soft"
                  : "border-sand-300 bg-white text-ocean-800 hover:border-gold-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </button>
          );
        })}
      </nav>

      <p className="mt-3 text-xs leading-6 text-sand-700">{t(activeTab.descKey)}</p>

      {flash && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          {flash}
        </p>
      )}

      {/* المحتوى */}
      <div className="mt-4">
        {tab === "listings" && (
          <ListingsTable
            listings={listings}
            editingId={editingId}
            draft={draft}
            onDraftChange={setDraft}
            onReview={reviewListing}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={() => setEditingId(null)}
          />
        )}

        {tab === "users" && (
          <UsersTable
            users={users}
            currentRole={adminRole}
            onChangeRole={changeRole}
            onToggleActive={toggleUserActive}
          />
        )}

        {tab === "developers" && (
          <DevelopersGrid developers={developers} onToggleVerified={toggleVerified} />
        )}
      </div>
    </div>
  );
}

/* ============================ جدول الإعلانات ============================ */

function ListingsTable({
  listings,
  editingId,
  draft,
  onDraftChange,
  onReview,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: {
  listings: AdminListing[];
  editingId: string | null;
  draft: { title: string; price: string };
  onDraftChange: (draft: { title: string; price: string }) => void;
  onReview: (listing: AdminListing, status: ListingStatus) => void;
  onStartEdit: (listing: AdminListing) => void;
  onCommitEdit: (listing: AdminListing) => void;
  onCancelEdit: () => void;
}) {
  const { t } = useI18n();
  const { formatWithSymbol } = useCurrency();

  if (listings.length === 0) {
    return <EmptyState text={t("admin.listings.empty")} />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-sand-300 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-start text-sm">
          <thead className="bg-sand-100 text-[11px] text-sand-700">
            <tr>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.property")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.city")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.price")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.seller")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.status")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              const editing = editingId === listing.id;
              return (
                <tr
                  key={listing.id}
                  className="border-t border-sand-200 align-middle transition hover:bg-sand-50"
                >
                  <td className="px-4 py-3">
                    {editing ? (
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(event) =>
                          onDraftChange({ ...draft, title: event.target.value })
                        }
                        className="w-full rounded-xl border border-sand-300 px-2 py-1.5 text-xs font-bold text-ocean-900 outline-none focus:border-ocean-500"
                        aria-label={t("admin.col.property")}
                      />
                    ) : (
                      <p className="font-bold text-ocean-900">{listing.title}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-sand-600">
                      {propertyTypeLabel(listing.type, t)} ·{" "}
                      {listing.source === "user"
                        ? t("admin.source.user")
                        : t("admin.source.demo")}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-sand-700">
                    {cityLabel(listing.city, t)}
                  </td>
                  <td className="px-4 py-3">
                    {editing ? (
                      <input
                        type="number"
                        value={draft.price}
                        min={0}
                        onChange={(event) =>
                          onDraftChange({ ...draft, price: event.target.value })
                        }
                        className="w-32 rounded-xl border border-sand-300 px-2 py-1.5 text-xs font-bold text-ocean-900 outline-none focus:border-ocean-500"
                        aria-label={t("admin.col.price")}
                      />
                    ) : (
                      <span className="text-xs font-bold text-ocean-900">
                        {formatWithSymbol(listing.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-sand-700">
                    {listing.sellerType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        STATUS_STYLE[listing.status]
                      }`}
                    >
                      {t(STATUS_LABEL[listing.status])}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {editing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onCommitEdit(listing)}
                            className={`${ROW_ACTION} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                          >
                            <Save className="h-3.5 w-3.5" />
                            {t("admin.action.save")}
                          </button>
                          <button
                            type="button"
                            onClick={onCancelEdit}
                            className={`${ROW_ACTION} border-sand-300 bg-white text-sand-700 hover:bg-sand-100`}
                          >
                            <X className="h-3.5 w-3.5" />
                            {t("admin.action.cancel")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onReview(listing, "approved")}
                            disabled={listing.status === "approved"}
                            className={`${ROW_ACTION} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {t("admin.action.approve")}
                          </button>
                          <button
                            type="button"
                            onClick={() => onReview(listing, "rejected")}
                            disabled={listing.status === "rejected"}
                            className={`${ROW_ACTION} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40`}
                          >
                            <X className="h-3.5 w-3.5" />
                            {t("admin.action.reject")}
                          </button>
                          <button
                            type="button"
                            onClick={() => onStartEdit(listing)}
                            className={`${ROW_ACTION} border-ocean-200 bg-ocean-50 text-ocean-700 hover:bg-ocean-100`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t("admin.action.edit")}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ جدول المستخدمين ============================ */

function UsersTable({
  users,
  currentRole,
  onChangeRole,
  onToggleActive,
}: {
  users: AdminUser[];
  currentRole: UserRole | null;
  onChangeRole: (id: string, role: UserRole) => void;
  onToggleActive: (id: string) => void;
}) {
  const { t } = useI18n();

  if (users.length === 0) {
    return <EmptyState text={t("admin.users.empty")} />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-sand-300 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-start text-sm">
          <thead className="bg-sand-100 text-[11px] text-sand-700">
            <tr>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.user")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.contact")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.role")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.joined")}
              </th>
              <th className="px-4 py-3 text-start font-bold">
                {t("admin.col.account")}
              </th>
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
                  <span className="block" dir="ltr">
                    {user.email}
                  </span>
                  <span className="block" dir="ltr">
                    +{user.phone}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(event) =>
                      onChangeRole(user.id, event.target.value as UserRole)
                    }
                    className="rounded-xl border border-sand-300 bg-white px-2.5 py-1.5 text-xs font-bold text-ocean-900 outline-none transition focus:border-ocean-500"
                    aria-label={t("admin.col.role")}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(ROLE_LABEL[role])}
                      </option>
                    ))}
                  </select>
                  {roleIsAdmin(user.role) && (
                    <VerifiedSeal
                      title={t(ROLE_LABEL[user.role])}
                      className="ms-1.5 inline-block h-4 w-4 align-middle"
                    />
                  )}
                  {user.role === currentRole && (
                    <span className="mt-1 block text-[10px] font-bold text-gold-700">
                      {t("admin.role.current")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-sand-700" dir="ltr">
                  {user.joinedAt}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        user.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {user.active
                        ? t("admin.state.active")
                        : t("admin.state.inactive")}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleActive(user.id)}
                      className={`${ROW_ACTION} ${
                        user.active
                          ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                          : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {user.active
                        ? t("admin.action.deactivate")
                        : t("admin.action.activate")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ كروت المطورين ============================ */

function DevelopersGrid({
  developers,
  onToggleVerified,
}: {
  developers: AdminDeveloper[];
  onToggleVerified: (id: string) => void;
}) {
  const { t } = useI18n();

  if (developers.length === 0) {
    return <EmptyState text={t("admin.developers.empty")} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {developers.map((developer) => (
        <article
          key={developer.id}
          className="relative flex flex-col overflow-hidden rounded-3xl border border-sand-300 bg-white p-4 shadow-soft"
        >
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
              <VerifiedSeal
                title={t("seal.title")}
                className="h-3.5 w-3.5"
              />
              {developer.verified
                ? t("admin.dev.verified")
                : t("admin.dev.unverified")}
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
            {cityLabel(developer.city, t)} ·{" "}
            {t("admin.dev.projects", { count: developer.projects })}
          </p>
          <p className="relative mt-0.5 text-[11px] text-sand-500">
            {t("admin.dev.requested")}: <span dir="ltr">{developer.requestedAt}</span>
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
            {developer.verified
              ? t("admin.action.unverify")
              : t("admin.action.verify")}
          </button>

          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-l from-gold-700 via-gold-400 to-gold-700"
          />
        </article>
      ))}
    </div>
  );
}

/* ============================ عناصر مساعدة ============================ */

function roleIsAdmin(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-sand-300 bg-white p-10 text-center shadow-soft">
      <p className="text-sm font-bold text-ocean-900">{text}</p>
    </div>
  );
}

/** هيكل تحميل فخم أثناء التحقق من صلاحية الجلسة */
function AdminSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6"
      aria-busy="true"
    >
      <div className="h-32 animate-pulse rounded-3xl bg-white/70" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-3xl bg-white/70"
          />
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-11 w-44 animate-pulse rounded-2xl bg-white/70"
          />
        ))}
      </div>
      <div className="mt-4 h-72 animate-pulse rounded-3xl bg-white/70" />
    </div>
  );
}
