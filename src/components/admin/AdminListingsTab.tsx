"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Check,
  Eye,
  RefreshCw,
  Replace,
  Search,
  Star,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { getSession } from "@/lib/session";
import {
  addAdminLog,
  addListingAction,
  getListingActions,
  saveListingOverride,
  type AdminListing,
  type AdminUser,
  type ListingStatus,
} from "@/lib/admin-system";
import { Panel, ROW_ACTION, STATUS_LABEL, STATUS_STYLE, INPUT } from "@/components/admin/shared";

interface Props {
  listings: AdminListing[];
  users: AdminUser[];
  can: (key: string) => boolean;
  onChange: (rows: AdminListing[]) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

const FILTERS: { key: "all" | ListingStatus; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "قيد المراجعة" },
  { key: "approved", label: "منشور" },
  { key: "rejected", label: "مرفوض" },
  { key: "archived", label: "مؤرشف" },
  { key: "deleted", label: "سلة المحذوفات" },
];

export default function AdminListingsTab({
  listings,
  users,
  can,
  onChange,
  notify,
  reloadLogs,
}: Props) {
  const { format } = useCurrency();
  const [filter, setFilter] = useState<"all" | ListingStatus>("all");
  const [query, setQuery] = useState("");
  const [assignFor, setAssignFor] = useState<AdminListing | null>(null);
  const [replaceFor, setReplaceFor] = useState<AdminListing | null>(null);
  const [replaceTarget, setReplaceTarget] = useState("");
  const [replaceNote, setReplaceNote] = useState("");
  const [historyFor, setHistoryFor] = useState<AdminListing | null>(null);

  const session = typeof window !== "undefined" ? getSession() : null;
  const performerId =
    users.find((u) => u.email === session?.email)?.id ?? session?.email ?? "unknown";

  const filtered = useMemo(() => {
    return listings.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        row.title.toLowerCase().includes(q) ||
        row.city.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      );
    });
  }, [listings, filter, query]);

  const runAction = (
    listing: AdminListing,
    action:
      | "approved"
      | "rejected"
      | "archived"
      | "unarchived"
      | "deleted"
      | "restored"
      | "replaced"
      | "assigned"
      | "featured"
      | "unfeatured",
    status: ListingStatus | undefined,
    patch: Parameters<typeof saveListingOverride>[1] = {},
    note?: string
  ) => {
    if (!session) return;
    saveListingOverride(listing.id, { ...(status ? { status } : {}), ...patch });
    if (status) {
      onChange(listings.map((row) => (row.id === listing.id ? { ...row, status } : row)));
    }
    addListingAction({
      listingId: listing.id,
      action,
      performedBy: performerId,
      performedByName: session.name,
      performedByRole: session.role ?? "moderator",
      note,
    });
    addAdminLog({
      action: `listing.${action}`,
      category: "listings",
      performedBy: performerId,
      performedByName: session.name,
      performedByRole: session.role ?? "moderator",
      details: `إجراء «${action}» على الإعلان: ${listing.title}`,
      meta: { listingId: listing.id, note },
    });
    reloadLogs();
    notify("تم تنفيذ الإجراء وتوثيقه في سجل النشاطات");
  };

  const doToggleFeature = (listing: AdminListing) => {
    const featured = !listing.featuredByAdmin;
    saveListingOverride(listing.id, { featuredByAdmin: featured });
    onChange(
      listings.map((row) =>
        row.id === listing.id ? { ...row, featuredByAdmin: featured } : row
      )
    );
    if (session) {
      addListingAction({
        listingId: listing.id,
        action: featured ? "featured" : "unfeatured",
        performedBy: performerId,
        performedByName: session.name,
        performedByRole: session.role ?? "moderator",
      });
      addAdminLog({
        action: featured ? "listing.featured" : "listing.unfeatured",
        category: "listings",
        performedBy: performerId,
        performedByName: session.name,
        performedByRole: session.role ?? "moderator",
        details: `${featured ? "تم تمييز" : "تم إلغاء تمييز"} الإعلان: ${listing.title}`,
      });
      reloadLogs();
    }
    notify(featured ? "تم تمييز الإعلان" : "تم إلغاء التمييز");
  };

  return (
    <div className="space-y-5">
      <Panel
        title="إدارة الإعلانات بالكامل"
        desc="موافقة، رفض، أرشفة، حذف نهائي، إعادة نشر، استبدال، تعيين مسئول، وتمييز — مع تسجيل كل إجراء."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="بحث بالعنوان أو المدينة أو المعرف"
                className={`${INPUT} pe-9 sm:w-72`}
              />
            </div>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === item.key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#b8963b]"
              }`}
            >
              {item.label}
              <span className="ms-1 opacity-70">
                (
                {item.key === "all"
                  ? listings.length
                  : listings.filter((row) => row.status === item.key).length}
                )
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="p-3 text-start font-bold">الإعلان</th>
                <th className="p-3 text-start font-bold">المدينة</th>
                <th className="p-3 text-start font-bold">السعر</th>
                <th className="p-3 text-start font-bold">التتبع</th>
                <th className="p-3 text-start font-bold">الحالة</th>
                <th className="p-3 text-start font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => (
                <tr key={listing.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{listing.title}</p>
                      {listing.featuredByAdmin && (
                        <Star className="h-3.5 w-3.5 fill-[#b8963b] text-[#b8963b]" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {listing.id} • {listing.source === "user" ? "مستخدم" : "بيانات تجريبية"}
                    </p>
                  </td>
                  <td className="p-3 text-slate-600">{listing.city}</td>
                  <td className="p-3 font-semibold text-slate-800">{format(listing.price)}</td>
                  <td className="p-3 text-[11px] text-slate-500">
                    <p>أضافه: {listing.addedByName ?? "—"}</p>
                    <p>المسئول: {listing.assignedToName ?? "غير معيّن"}</p>
                    {listing.approvedBy && <p>اعتمده: {listing.approvedBy}</p>}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[listing.status]}`}>
                      {STATUS_LABEL[listing.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Link href={`/property/${listing.id}`} className={ROW_ACTION}>
                        <Eye className="h-3 w-3" /> معاينة
                      </Link>

                      {listing.status !== "approved" && can("listings.approve") && (
                        <button
                          onClick={() => runAction(listing, "approved", "approved")}
                          className={`${ROW_ACTION} border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-700`}
                        >
                          <Check className="h-3 w-3" /> موافقة
                        </button>
                      )}

                      {listing.status !== "rejected" && can("listings.reject") && (
                        <button
                          onClick={() => runAction(listing, "rejected", "rejected")}
                          className={`${ROW_ACTION} border-rose-200 text-rose-700 hover:border-rose-400 hover:text-rose-700`}
                        >
                          <X className="h-3 w-3" /> رفض
                        </button>
                      )}

                      {listing.status !== "archived" && can("listings.archive") && (
                        <button
                          onClick={() => runAction(listing, "archived", "archived")}
                          className={ROW_ACTION}
                        >
                          <Archive className="h-3 w-3" /> أرشفة
                        </button>
                      )}

                      {(listing.status === "archived" || listing.status === "deleted") &&
                        can("listings.restore") && (
                          <button
                            onClick={() => runAction(listing, "restored", "approved")}
                            className={`${ROW_ACTION} border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:text-emerald-700`}
                          >
                            <RefreshCw className="h-3 w-3" /> إعادة نشر
                          </button>
                        )}

                      {listing.status !== "deleted" && can("listings.delete") && (
                        <button
                          onClick={() => {
                            if (confirm(`نقل «${listing.title}» إلى سلة المحذوفات؟`)) {
                              runAction(listing, "deleted", "deleted");
                            }
                          }}
                          className={`${ROW_ACTION} border-red-200 text-red-700 hover:border-red-400 hover:text-red-700`}
                        >
                          <Trash2 className="h-3 w-3" /> حذف
                        </button>
                      )}

                      {can("listings.assign") && (
                        <button
                          onClick={() => {
                            setAssignFor(listing);
                          }}
                          className={ROW_ACTION}
                        >
                          <UserCheck className="h-3 w-3" /> تعيين
                        </button>
                      )}

                      {can("listings.replace") && (
                        <button
                          onClick={() => {
                            setReplaceFor(listing);
                            setReplaceTarget("");
                            setReplaceNote("");
                          }}
                          className={ROW_ACTION}
                        >
                          <Replace className="h-3 w-3" /> استبدال
                        </button>
                      )}

                      {can("listings.feature") && (
                        <button
                          onClick={() => doToggleFeature(listing)}
                          className={`${ROW_ACTION} border-[#e6d29a] text-[#a9843a] hover:border-[#b8963b] hover:text-[#b8963b]`}
                        >
                          <Star className="h-3 w-3" />
                          {listing.featuredByAdmin ? "إلغاء التمييز" : "تمييز"}
                        </button>
                      )}

                      <button
                        onClick={() => setHistoryFor(listing)}
                        className={ROW_ACTION}
                      >
                        السجل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                    لا توجد إعلانات مطابقة للفلتر الحالي.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {assignFor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">تعيين مسئول للإعلان</h3>
            <p className="mt-1 text-sm text-slate-500">{assignFor.title}</p>
            <div className="mt-4 space-y-2">
              {users
                .filter((user) => user.active)
                .map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      saveListingOverride(assignFor.id, {
                        assignedTo: user.id,
                        assignedToName: user.name,
                      });
                      onChange(
                        listings.map((row) =>
                          row.id === assignFor.id
                            ? { ...row, assignedTo: user.id, assignedToName: user.name }
                            : row
                        )
                      );
                      if (session) {
                        addListingAction({
                          listingId: assignFor.id,
                          action: "assigned",
                          performedBy: performerId,
                          performedByName: session.name,
                          performedByRole: session.role ?? "moderator",
                          meta: { assignedTo: user.id },
                        });
                        addAdminLog({
                          action: "listing.assigned",
                          category: "listings",
                          performedBy: performerId,
                          performedByName: session.name,
                          performedByRole: session.role ?? "moderator",
                          details: `تم تعيين ${user.name} مسئولاً عن الإعلان: ${assignFor.title}`,
                        });
                        reloadLogs();
                      }
                      setAssignFor(null);
                      notify("تم تعيين المسئول");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-start transition hover:border-[#b8963b]"
                  >
                    <span>
                      <span className="block text-sm font-bold text-slate-800">{user.name}</span>
                      <span className="block text-[11px] text-slate-500">{user.role}</span>
                    </span>
                    <UserCheck className="h-4 w-4 text-[#b8963b]" />
                  </button>
                ))}
            </div>
            <button
              onClick={() => setAssignFor(null)}
              className="mt-4 w-full rounded-full border border-slate-200 py-2 text-sm font-bold text-slate-600"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {replaceFor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">استبدال الإعلان بإعلان جديد</h3>
            <p className="mt-1 text-sm text-slate-500">
              سيتم أرشفة «{replaceFor.title}» وربطه بالإعلان البديل مع تسجيل السبب.
            </p>
            <div className="mt-4 space-y-3">
              <select
                value={replaceTarget}
                onChange={(event) => setReplaceTarget(event.target.value)}
                className={INPUT}
              >
                <option value="">اختر الإعلان البديل</option>
                {listings
                  .filter((row) => row.id !== replaceFor.id && row.status !== "deleted")
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.title} — {row.city}
                    </option>
                  ))}
              </select>
              <textarea
                value={replaceNote}
                onChange={(event) => setReplaceNote(event.target.value)}
                rows={3}
                placeholder="سبب الاستبدال (اختياري)"
                className={INPUT}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setReplaceFor(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                disabled={!replaceTarget}
                onClick={() => {
                  saveListingOverride(replaceFor.id, { status: "archived" });
                  onChange(
                    listings.map((row) =>
                      row.id === replaceFor.id
                        ? {
                            ...row,
                            status: "archived" as ListingStatus,
                            replacedBy: replaceTarget,
                            replacementNote: replaceNote,
                          }
                        : row
                    )
                  );
                  if (session) {
                    addListingAction({
                      listingId: replaceFor.id,
                      action: "replaced",
                      performedBy: performerId,
                      performedByName: session.name,
                      performedByRole: session.role ?? "moderator",
                      note: replaceNote,
                      meta: { replacementId: replaceTarget },
                    });
                    addAdminLog({
                      action: "listing.replaced",
                      category: "listings",
                      performedBy: performerId,
                      performedByName: session.name,
                      performedByRole: session.role ?? "moderator",
                      details: `تم استبدال الإعلان: ${replaceFor.title}`,
                      meta: { replacementId: replaceTarget },
                    });
                    reloadLogs();
                  }
                  setReplaceFor(null);
                  notify("تم استبدال الإعلان وأرشفة القديم");
                }}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                تنفيذ الاستبدال
              </button>
            </div>
          </div>
        </div>
      )}

      {historyFor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">سجل الإعلان</h3>
              <button onClick={() => setHistoryFor(null)}>
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">{historyFor.title}</p>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {getListingActions(historyFor.id).map((action) => (
                <div key={action.id} className="rounded-2xl border border-slate-100 p-3">
                  <p className="text-sm font-bold text-slate-800">{action.action}</p>
                  <p className="text-[11px] text-slate-500">
                    {action.performedByName} •{" "}
                    {new Date(action.timestamp).toLocaleString("ar-EG")}
                  </p>
                  {action.note && <p className="mt-1 text-[11px] text-slate-500">{action.note}</p>}
                </div>
              ))}
              {getListingActions(historyFor.id).length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">لا توجد إجراءات مسجلة بعد.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
