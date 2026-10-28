"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  BLOCK_TYPE_META,
  CORE_BLOCK_TYPES,
  CUSTOM_BLOCK_TYPES,
  addHomeBlock,
  isCoreBlockType,
  moveHomeBlock,
  moveHomeBlockBy,
  removeHomeBlock,
  resetHomeBlocks,
  toggleHomeBlock,
  updateHomeBlock,
  useHomeBlocks,
  type HomeBlock,
  type HomeBlockItem,
  type HomeBlockType,
} from "@/lib/home-builder-store";
import { addAdminLog } from "@/lib/admin-system";
import { getSession } from "@/lib/session";
import {
  BTN_PRIMARY,
  Field,
  INPUT,
  Panel,
  ROW_ACTION,
} from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

interface EditorState {
  id: string;
  type: HomeBlockType;
  eyebrowAr: string;
  eyebrowEn: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  bodyAr: string;
  bodyEn: string;
  imageUrl: string;
  linkUrl: string;
  linkLabelAr: string;
  linkLabelEn: string;
  tone: "navy" | "sand" | "white";
  items: HomeBlockItem[];
}

function toEditor(block: HomeBlock): EditorState {
  return {
    id: block.id,
    type: block.type,
    eyebrowAr: block.eyebrowAr ?? "",
    eyebrowEn: block.eyebrowEn ?? "",
    titleAr: block.titleAr ?? "",
    titleEn: block.titleEn ?? "",
    subtitleAr: block.subtitleAr ?? "",
    subtitleEn: block.subtitleEn ?? "",
    bodyAr: block.bodyAr ?? "",
    bodyEn: block.bodyEn ?? "",
    imageUrl: block.imageUrl ?? "",
    linkUrl: block.linkUrl ?? "",
    linkLabelAr: block.linkLabelAr ?? "",
    linkLabelEn: block.linkLabelEn ?? "",
    tone: block.tone ?? "white",
    items: (block.items ?? []).map((item) => ({ ...item })),
  };
}

export default function AdminHomeBuilderTab({ can, notify, reloadLogs }: Props) {
  const blocks = useHomeBlocks();
  const canManage = can("site.settings") || can("site.blocks");

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  /* مزامنة المحرر مع أي تغيير خارجي */
  useEffect(() => {
    if (!editor) return;
    const current = blocks.find((block) => block.id === editor.id);
    if (!current) setEditor(null);
  }, [blocks, editor]);

  const log = (action: string, details: string) => {
    const session = getSession();
    if (!session) return;
    addAdminLog({
      action,
      category: "site",
      performedBy: session.email,
      performedByName: session.name,
      performedByRole: session.role ?? "admin",
      details,
    });
    reloadLogs();
  };

  const labelOf = (type: HomeBlockType) => BLOCK_TYPE_META[type]?.label ?? type;

  const addBlock = (type: HomeBlockType) => {
    const created = addHomeBlock(type);
    if (!created) {
      notify("هذا القسم موجود بالفعل — يمكنك تعديله أو حذفه أولاً");
      return;
    }
    log("home.block.added", `إضافة قسم للرئيسية: ${labelOf(type)}`);
    notify("تمت إضافة القسم في نهاية الصفحة");
    setAddOpen(false);
  };

  const removeBlock = (block: HomeBlock) => {
    removeHomeBlock(block.id);
    log("home.block.deleted", `حذف قسم من الرئيسية: ${labelOf(block.type)}`);
    notify("تم حذف القسم من الصفحة الرئيسية");
    setConfirmId(null);
  };

  const toggle = (block: HomeBlock) => {
    toggleHomeBlock(block.id);
    log(
      block.visible ? "home.block.hidden" : "home.block.shown",
      `${block.visible ? "إخفاء" : "إظهار"} قسم: ${labelOf(block.type)}`
    );
    notify(block.visible ? "تم إخفاء القسم" : "تم إظهار القسم");
  };

  const move = (block: HomeBlock, direction: "up" | "down") => {
    moveHomeBlockBy(block.id, direction);
    log("home.block.reordered", `تغيير ترتيب قسم: ${labelOf(block.type)}`);
  };

  const handleDrop = (targetIndex: number) => {
    if (!dragId) return;
    const block = blocks.find((item) => item.id === dragId);
    moveHomeBlock(dragId, targetIndex);
    if (block) {
      log("home.block.reordered", `سحب قسم: ${labelOf(block.type)}`);
    }
    setDragId(null);
    setOverIndex(null);
  };

  const saveEditor = () => {
    if (!editor) return;
    updateHomeBlock(editor.id, {
      eyebrowAr: editor.eyebrowAr,
      eyebrowEn: editor.eyebrowEn,
      titleAr: editor.titleAr,
      titleEn: editor.titleEn,
      subtitleAr: editor.subtitleAr,
      subtitleEn: editor.subtitleEn,
      bodyAr: editor.bodyAr,
      bodyEn: editor.bodyEn,
      imageUrl: editor.imageUrl,
      linkUrl: editor.linkUrl,
      linkLabelAr: editor.linkLabelAr,
      linkLabelEn: editor.linkLabelEn,
      tone: editor.tone,
      items: editor.items,
    });
    log("home.block.updated", `تعديل محتوى قسم: ${labelOf(editor.type)}`);
    notify("تم حفظ محتوى القسم");
    setEditor(null);
  };

  const updateItem = (index: number, patch: Partial<HomeBlockItem>) => {
    setEditor((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item, position) =>
              position === index ? { ...item, ...patch } : item
            ),
          }
        : prev
    );
  };

  const addType = (type: HomeBlockType) => {
    const meta = BLOCK_TYPE_META[type];
    const exists = blocks.some((block) => block.type === type);
    return (
      <button
        key={type}
        type="button"
        onClick={() => addBlock(type)}
        disabled={isCoreBlockType(type) && exists}
        className="rounded-2xl border border-sand-200 bg-white p-3 text-start transition hover:border-gold-300 hover:bg-gold-50/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <p className="text-[12px] font-black text-ocean-900">{meta.label}</p>
        <p className="mt-0.5 text-[10.5px] leading-5 text-sand-600">
          {meta.description}
        </p>
      </button>
    );
  };

  /** الحقول النصية المتاحة لكل نوع قسم — مطابقة لما تقرأه الصفحة الرئيسية فعلاً */
  const richFields = (
    type: HomeBlockType
  ): { eyebrow: boolean; title: boolean; subtitle: boolean; body: boolean } => {
    switch (type) {
      case "hero":
        return { eyebrow: true, title: true, subtitle: true, body: false };
      case "verify_strip":
        return { eyebrow: false, title: true, subtitle: true, body: false };
      case "featured_listings":
        return { eyebrow: true, title: true, subtitle: true, body: false };
      case "story_dossier":
        return { eyebrow: true, title: true, subtitle: true, body: false };
      case "manage_note":
        return { eyebrow: false, title: true, subtitle: false, body: true };
      case "marquee":
      case "projects_slider":
      case "ad_slider":
      case "inline_ad":
      case "ad_band":
        return { eyebrow: false, title: false, subtitle: false, body: false };
      default:
        return { eyebrow: true, title: true, subtitle: true, body: true };
    }
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Builder الصفحة الرئيسية"
        desc="اسحب أي قسم لترتيبه، أو أخفِه، أو احذفه، أو أضف أقساماً جديدة وحرّر محتواها. التغييرات تظهر على الرئيسية فوراً."
        actions={
          <>
            <button
              type="button"
              onClick={() => setAddOpen((value) => !value)}
              disabled={!canManage}
              className={BTN_PRIMARY}
            >
              <Plus className="h-4 w-4" /> إضافة قسم
            </button>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-bold text-gold-600"
            >
              <Eye className="h-4 w-4" /> معاينة
            </Link>
          </>
        }
      >
        {/* إضافة قسم */}
        {addOpen && (
          <div className="mb-4 rounded-2xl border border-gold-200 bg-gold-50/40 p-4">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-[12.5px] font-black text-ocean-900">
                اختر نوع القسم الجديد
              </p>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg border border-sand-200 bg-white p-1.5 text-sand-600 transition hover:text-ocean-900"
                aria-label="إغلاق"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CUSTOM_BLOCK_TYPES.map(addType)}
            </div>
            <p className="mt-3 text-[10.5px] font-bold text-sand-600">
              أقسام المنصة الأساسية المحذوفة يمكن إعادتها:
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_BLOCK_TYPES.filter(
                (type) => !blocks.some((block) => block.type === type)
              ).map(addType)}
            </div>
          </div>
        )}

        {/* قائمة الأقسام */}
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const meta = BLOCK_TYPE_META[block.type];
            const locked = meta.locked === true;
            const isEditing = editor?.id === block.id;
            return (
              <div
                key={block.id}
                draggable={!locked && canManage}
                onDragStart={() => setDragId(block.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverIndex(null);
                }}
                onDragOver={(event) => {
                  if (locked) return;
                  event.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(index);
                }}
                className={`rounded-2xl border p-3 transition ${
                  overIndex === index && dragId && dragId !== block.id
                    ? "border-gold-400 bg-gold-50/60"
                    : block.visible
                      ? "border-sand-200 bg-white"
                      : "border-dashed border-sand-300 bg-sand-50/70"
                } ${dragId === block.id ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`grid h-8 w-7 shrink-0 place-items-center rounded-lg text-sand-400 ${
                      locked ? "cursor-default opacity-40" : "cursor-grab active:cursor-grabbing"
                    }`}
                    title={locked ? "لا يمكن تغيير ترتيب هذا القسم" : "اسحب للترتيب"}
                    aria-hidden
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sand-100 text-[11px] font-black text-sand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[13px] font-black text-ocean-900">
                      {meta.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                          block.visible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-sand-200 text-sand-700"
                        }`}
                      >
                        {block.visible ? "ظاهر" : "مخفي"}
                      </span>
                      {isCoreBlockType(block.type) ? (
                        <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-[9.5px] font-bold text-ocean-700">
                          أساسي
                        </span>
                      ) : (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[9.5px] font-bold text-gold-700">
                          مخصّص
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-sand-500">
                      {meta.description}
                      {block.titleAr ? ` · «${block.titleAr}»` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => move(block, "up")}
                      disabled={!canManage || locked || index === 0}
                      className={`${ROW_ACTION} disabled:cursor-not-allowed disabled:opacity-40`}
                      aria-label="تحريك لأعلى"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(block, "down")}
                      disabled={!canManage || locked || index === blocks.length - 1}
                      className={`${ROW_ACTION} disabled:cursor-not-allowed disabled:opacity-40`}
                      aria-label="تحريك لأسفل"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(block)}
                      disabled={!canManage}
                      className={ROW_ACTION}
                      aria-label={block.visible ? "إخفاء القسم" : "إظهار القسم"}
                    >
                      {block.visible ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      {block.visible ? "إخفاء" : "إظهار"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditor(isEditing ? null : toEditor(block))
                      }
                      disabled={!canManage}
                      className={ROW_ACTION}
                    >
                      <Pencil className="h-3 w-3" /> {isEditing ? "إغلاق" : "تحرير"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(block.id)}
                      disabled={!canManage}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-40"
                    >
                      <Trash2 className="h-3 w-3" /> حذف
                    </button>
                  </div>
                </div>

                {/* تأكيد الحذف */}
                {confirmId === block.id && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                    <p className="text-[11.5px] font-bold leading-6 text-rose-800">
                      حذف «{meta.label}» من الصفحة الرئيسية؟ يمكنك إضافته مرة أخرى
                      لاحقاً من «إضافة قسم»، لكن محتواه المخصّص سيُفقد.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => removeBlock(block)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white px-3 py-1.5 text-[11px] font-black text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3 w-3" /> حذف القسم
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className={ROW_ACTION}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* محرر القسم */}
                {isEditing && editor && (
                  <div className="mt-3 rounded-2xl border border-gold-200 bg-gold-50/40 p-3">
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {richFields(editor.type).eyebrow && (
                        <>
                          <Field label="عنوان صغير بالعربية">
                            <input
                              value={editor.eyebrowAr}
                              onChange={(event) =>
                                setEditor({ ...editor, eyebrowAr: event.target.value })
                              }
                              className={INPUT}
                              placeholder="اختياري"
                            />
                          </Field>
                          <Field label="Eyebrow (English)">
                            <input
                              value={editor.eyebrowEn}
                              onChange={(event) =>
                                setEditor({ ...editor, eyebrowEn: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                        </>
                      )}
                      <Field label="النمط">
                        <select
                          value={editor.tone}
                          onChange={(event) =>
                            setEditor({
                              ...editor,
                              tone: event.target.value as EditorState["tone"],
                            })
                          }
                          className={INPUT}
                          disabled={isCoreBlockType(editor.type)}
                        >
                          <option value="white">فاتح</option>
                          <option value="sand">رملي</option>
                          <option value="navy">نيلي داكن</option>
                        </select>
                      </Field>

                      {richFields(editor.type).title && (
                        <>
                          <Field label="العنوان بالعربية">
                            <input
                              value={editor.titleAr}
                              onChange={(event) =>
                                setEditor({ ...editor, titleAr: event.target.value })
                              }
                              className={INPUT}
                              placeholder="اتركه فارغاً لاستخدام النص الافتراضي"
                            />
                          </Field>
                          <Field label="Title (English)">
                            <input
                              value={editor.titleEn}
                              onChange={(event) =>
                                setEditor({ ...editor, titleEn: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                        </>
                      )}
                      {richFields(editor.type).subtitle && (
                        <>
                          <Field label="العنوان الفرعي بالعربية">
                            <input
                              value={editor.subtitleAr}
                              onChange={(event) =>
                                setEditor({ ...editor, subtitleAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="Subtitle (English)">
                            <input
                              value={editor.subtitleEn}
                              onChange={(event) =>
                                setEditor({ ...editor, subtitleEn: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                        </>
                      )}
                      {richFields(editor.type).body && (
                        <>
                          <Field label="النص بالعربية" hint="كل سطر يظهر كفقرة مستقلة">
                            <textarea
                              value={editor.bodyAr}
                              onChange={(event) =>
                                setEditor({ ...editor, bodyAr: event.target.value })
                              }
                              rows={3}
                              className={INPUT}
                            />
                          </Field>
                          <Field label="Body (English)">
                            <textarea
                              value={editor.bodyEn}
                              onChange={(event) =>
                                setEditor({ ...editor, bodyEn: event.target.value })
                              }
                              rows={3}
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                        </>
                      )}

                      {(editor.type === "hero" || editor.type === "banner") && (
                        <Field label="رابط الصورة">
                          <input
                            value={editor.imageUrl}
                            onChange={(event) =>
                              setEditor({ ...editor, imageUrl: event.target.value })
                            }
                            placeholder="https://"
                            dir="ltr"
                            className={INPUT}
                          />
                        </Field>
                      )}

                      {["banner", "text", "cta"].includes(editor.type) && (
                        <>
                          <Field label="رابط الزر">
                            <input
                              value={editor.linkUrl}
                              onChange={(event) =>
                                setEditor({ ...editor, linkUrl: event.target.value })
                              }
                              placeholder="/add-property"
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="نص الزر بالعربية">
                            <input
                              value={editor.linkLabelAr}
                              onChange={(event) =>
                                setEditor({ ...editor, linkLabelAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="Button label (English)">
                            <input
                              value={editor.linkLabelEn}
                              onChange={(event) =>
                                setEditor({ ...editor, linkLabelEn: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                        </>
                      )}
                    </div>

                    {/* عناصر stats / faq */}
                    {(editor.type === "stats" || editor.type === "faq") && (
                      <div className="mt-3 rounded-2xl border border-sand-200 bg-white/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-black text-ocean-900">
                            {editor.type === "stats" ? "بطاقات الأرقام" : "الأسئلة"}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setEditor({
                                ...editor,
                                items: [
                                  ...editor.items,
                                  {
                                    id: `item-${Date.now()}`,
                                    titleAr: "",
                                    textAr: "",
                                  },
                                ],
                              })
                            }
                            className={ROW_ACTION}
                          >
                            <Plus className="h-3 w-3" /> إضافة
                          </button>
                        </div>
                        <div className="mt-2 space-y-2">
                          {editor.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="grid gap-2 rounded-xl border border-sand-200 bg-sand-50/60 p-2.5 sm:grid-cols-2"
                            >
                              <input
                                value={item.titleAr}
                                onChange={(event) =>
                                  updateItem(index, { titleAr: event.target.value })
                                }
                                placeholder={
                                  editor.type === "stats" ? "القيمة (مثال: 100%)" : "السؤال"
                                }
                                className={INPUT}
                              />
                              <input
                                value={item.titleEn ?? ""}
                                onChange={(event) =>
                                  updateItem(index, { titleEn: event.target.value })
                                }
                                placeholder="English"
                                dir="ltr"
                                className={INPUT}
                              />
                              <input
                                value={item.textAr ?? ""}
                                onChange={(event) =>
                                  updateItem(index, { textAr: event.target.value })
                                }
                                placeholder={editor.type === "stats" ? "الوصف" : "الإجابة"}
                                className={INPUT}
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  value={item.textEn ?? ""}
                                  onChange={(event) =>
                                    updateItem(index, { textEn: event.target.value })
                                  }
                                  placeholder="English"
                                  dir="ltr"
                                  className={INPUT}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditor({
                                      ...editor,
                                      items: editor.items.filter(
                                        (_, position) => position !== index
                                      ),
                                    })
                                  }
                                  className="shrink-0 rounded-lg border border-rose-200 bg-white p-2 text-rose-600 transition hover:bg-rose-50"
                                  aria-label="حذف العنصر"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {editor.items.length === 0 && (
                            <p className="text-[10.5px] text-sand-500">
                              لا توجد عناصر بعد — اضغط «إضافة».
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {editor.type === "hero" && (
                      <p className="mt-2 rounded-xl border border-sand-200 bg-white/70 px-3 py-2 text-[10.5px] font-semibold leading-5 text-sand-600">
                        اترك الحقول فارغة لاستخدام نصوص الموقع الافتراضية. تعديل
                        العنوان يستبدل العنوان الذهبي والسطر الثاني معاً.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={saveEditor}
                        className={BTN_PRIMARY}
                      >
                        <Save className="h-4 w-4" /> حفظ محتوى القسم
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditor(null)}
                        className={ROW_ACTION}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {blocks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-600">
              لا توجد أقسام في الصفحة الرئيسية. اضغط «إضافة قسم» لبناء الصفحة.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sand-200 bg-sand-50/70 px-3 py-2">
          <p className="text-[10.5px] font-semibold leading-5 text-sand-600">
            الأقسام الأساسية تُدار بياناتها من تبويباتها الأصلية (العقارات،
            البنرات، العروض، إعدادات الموقع)، وهنا تتحكم في موقعها وإظهارها.
          </p>
          <button
            type="button"
            onClick={() => {
              resetHomeBlocks();
              log("home.blocks.reset", "استعادة ترتيب أقسام الرئيسية الافتراضي");
              notify("تمت استعادة الترتيب الافتراضي");
            }}
            disabled={!canManage}
            className={ROW_ACTION}
          >
            <RotateCcw className="h-3 w-3" /> استعادة الافتراضي
          </button>
        </div>
      </Panel>
    </div>
  );
}
