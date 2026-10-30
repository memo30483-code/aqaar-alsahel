"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  ADDABLE_BLOCK_TYPES,
  BLOCK_TYPE_META,
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
  FONT_OPTIONS,
  blockCssVars,
  blockScopeClasses,
  sanitizeBlockStyle,
  type HomeBlockStyle,
} from "@/lib/home-block-style";
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
  videoUrl: string;
  linkUrl: string;
  linkLabelAr: string;
  linkLabelEn: string;
  tone: "navy" | "sand" | "white";
  items: HomeBlockItem[];
  style: HomeBlockStyle;
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
    videoUrl: block.videoUrl ?? "",
    linkUrl: block.linkUrl ?? "",
    linkLabelAr: block.linkLabelAr ?? "",
    linkLabelEn: block.linkLabelEn ?? "",
    tone: block.tone ?? "white",
    items: (block.items ?? []).map((item) => ({ ...item })),
    style: { ...(block.style ?? {}) },
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
    notify("تمت إضافة نسخة جديدة من القسم وفتح محررها");
    setAddOpen(false);
    setEditor(toEditor(created));
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
      videoUrl: editor.videoUrl,
      linkUrl: editor.linkUrl,
      linkLabelAr: editor.linkLabelAr,
      linkLabelEn: editor.linkLabelEn,
      tone: editor.tone,
      items: editor.items,
      style: sanitizeBlockStyle(editor.style),
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

  /** تعديل تنسيق القسم */
  const patchStyle = (patch: Partial<HomeBlockStyle>) =>
    setEditor((prev) =>
      prev ? { ...prev, style: { ...prev.style, ...patch } } : prev
    );

  const clearStyle = () =>
    setEditor((prev) => (prev ? { ...prev, style: {} } : prev));

  const addType = (type: HomeBlockType) => {
    const meta = BLOCK_TYPE_META[type];
    const count = blocks.filter((block) => block.type === type).length;
    return (
      <button
        key={type}
        type="button"
        onClick={() => addBlock(type)}
        disabled={!canManage}
        className="group rounded-2xl border border-sand-200 bg-white p-3 text-start transition hover:border-gold-300 hover:bg-gold-50/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-black text-ocean-900">{meta.label}</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ocean-50 px-2 py-0.5 text-[9px] font-black text-ocean-700 transition group-hover:bg-gold-100 group-hover:text-gold-800">
            <Plus className="h-2.5 w-2.5" /> إضافة نسخة
          </span>
        </span>
        <p className="mt-0.5 text-[10.5px] leading-5 text-sand-600">
          {meta.description}
        </p>
        {count > 0 && (
          <p className="mt-1 text-[9.5px] font-bold text-emerald-700">
            موجود حاليًا: {count}
          </p>
        )}
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
      case "projects_slider":
        return { eyebrow: true, title: true, subtitle: true, body: false };
      case "story_dossier":
        return { eyebrow: true, title: true, subtitle: true, body: false };
      case "manage_note":
        return { eyebrow: false, title: true, subtitle: false, body: true };
      case "marquee":
      case "ad_slider":
        return { eyebrow: false, title: true, subtitle: true, body: false };
      case "inline_ad":
      case "ad_band":
        return { eyebrow: false, title: true, subtitle: true, body: true };
      default:
        return { eyebrow: true, title: true, subtitle: true, body: true };
    }
  };

  const mediaTypes: HomeBlockType[] = [
    "hero",
    "banner",
    "text",
    "inline_ad",
    "ad_slider",
    "ad_band",
  ];
  const linkTypes: HomeBlockType[] = [
    "banner",
    "text",
    "cta",
    "inline_ad",
    "ad_slider",
    "ad_band",
  ];
  const itemTypes: HomeBlockType[] = ["stats", "faq", "marquee", "ad_slider"];

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
            <p className="mb-2 text-[10.5px] font-bold leading-5 text-sand-600">
              كل القوالب مفعّلة ويمكن إضافتها أكثر من مرة. بعد الإضافة سيفتح محرر النسخة الجديدة لضبط محتواها ومقاساتها.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ADDABLE_BLOCK_TYPES.map(addType)}
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

                      {mediaTypes.includes(editor.type) && (
                        <>
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
                          <Field
                            label="رابط فيديو (اختياري)"
                            hint="mp4/webm أو يوتيوب/فيميو — له الأولوية على الصورة"
                          >
                            <input
                              value={editor.videoUrl}
                              onChange={(event) =>
                                setEditor({ ...editor, videoUrl: event.target.value })
                              }
                              placeholder="https://youtu.be/..."
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                        </>
                      )}

                      {linkTypes.includes(editor.type) && (
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

                    {/* التصميم والمقاسات — تحكم كامل في شكل القسم */}
                    <div className="mt-3 rounded-2xl border border-ocean-100 bg-white/80 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-[12px] font-black text-ocean-900">
                          <Palette className="h-3.5 w-3.5 text-gold-600" />
                          التصميم والمقاسات
                        </p>
                        <button
                          type="button"
                          onClick={clearStyle}
                          className={ROW_ACTION}
                        >
                          <RotateCcw className="h-3 w-3" /> إعادة ضبط التنسيق
                        </button>
                      </div>

                      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="نوع الخط">
                          <select
                            value={editor.style.fontFamily ?? ""}
                            onChange={(event) =>
                              patchStyle({
                                fontFamily: event.target.value
                                  ? (event.target.value as HomeBlockStyle["fontFamily"])
                                  : undefined,
                              })
                            }
                            className={INPUT}
                          >
                            <option value="">خط الموقع الافتراضي (Cairo)</option>
                            {FONT_OPTIONS.map((font) => (
                              <option key={font.value} value={font.value}>
                                {font.label} — {font.hint}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="حجم العنوان (px)" hint="من 14 إلى 72">
                          <input
                            type="number"
                            min={14}
                            max={72}
                            value={editor.style.titleSize ?? ""}
                            onChange={(event) =>
                              patchStyle({
                                titleSize:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                              })
                            }
                            className={INPUT}
                          />
                        </Field>

                        <Field label="حجم النص (px)" hint="من 10 إلى 32">
                          <input
                            type="number"
                            min={10}
                            max={32}
                            value={editor.style.bodySize ?? ""}
                            onChange={(event) =>
                              patchStyle({
                                bodySize:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                              })
                            }
                            className={INPUT}
                          />
                        </Field>

                        <Field label="لون العنوان">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={editor.style.titleColor ?? "#141a33"}
                              onChange={(event) =>
                                patchStyle({ titleColor: event.target.value })
                              }
                              aria-label="لون العنوان"
                              className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-sand-200 bg-white p-1"
                            />
                            <input
                              value={editor.style.titleColor ?? ""}
                              onChange={(event) =>
                                patchStyle({
                                  titleColor: event.target.value || undefined,
                                })
                              }
                              placeholder="#141a33"
                              dir="ltr"
                              className={INPUT}
                            />
                          </div>
                        </Field>

                        <Field label="لون النص">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={editor.style.bodyColor ?? "#5b6478"}
                              onChange={(event) =>
                                patchStyle({ bodyColor: event.target.value })
                              }
                              aria-label="لون النص"
                              className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-sand-200 bg-white p-1"
                            />
                            <input
                              value={editor.style.bodyColor ?? ""}
                              onChange={(event) =>
                                patchStyle({
                                  bodyColor: event.target.value || undefined,
                                })
                              }
                              placeholder="#5b6478"
                              dir="ltr"
                              className={INPUT}
                            />
                          </div>
                        </Field>

                        <Field label="محاذاة النص">
                          <select
                            value={editor.style.align ?? "start"}
                            onChange={(event) =>
                              patchStyle({
                                align: event.target.value as HomeBlockStyle["align"],
                              })
                            }
                            className={INPUT}
                          >
                            <option value="start">بداية السطر (يمين)</option>
                            <option value="center">وسط</option>
                            <option value="end">نهاية السطر (يسار)</option>
                          </select>
                        </Field>

                        <Field
                          label="مسافة رأسية إضافية (px)"
                          hint="تكبير/تصغير ارتفاع القسم — من 0 إلى 160"
                        >
                          <input
                            type="number"
                            min={0}
                            max={160}
                            step={4}
                            value={editor.style.paddingY ?? 0}
                            onChange={(event) =>
                              patchStyle({ paddingY: Number(event.target.value) })
                            }
                            className={INPUT}
                          />
                        </Field>

                        <Field label="خلفية القسم">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={editor.style.background ?? "#ffffff"}
                              onChange={(event) =>
                                patchStyle({ background: event.target.value })
                              }
                              aria-label="خلفية القسم"
                              className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-sand-200 bg-white p-1"
                            />
                            <input
                              value={editor.style.background ?? ""}
                              onChange={(event) =>
                                patchStyle({
                                  background: event.target.value || undefined,
                                })
                              }
                              placeholder="بدون لون"
                              dir="ltr"
                              className={INPUT}
                            />
                          </div>
                        </Field>

                        {mediaTypes.includes(editor.type) && (
                          <>
                            <Field
                              label="ارتفاع الصورة/الفيديو (px)"
                              hint="اتركه فارغاً لارتفاع القسم الطبيعي"
                            >
                              <input
                                type="number"
                                min={80}
                                max={720}
                                step={20}
                                value={editor.style.mediaHeight ?? ""}
                                onChange={(event) =>
                                  patchStyle({
                                    mediaHeight:
                                      event.target.value === ""
                                        ? undefined
                                        : Number(event.target.value),
                                  })
                                }
                                className={INPUT}
                              />
                            </Field>

                            <Field label="طريقة عرض الوسائط">
                              <select
                                value={editor.style.mediaFit ?? "cover"}
                                onChange={(event) =>
                                  patchStyle({
                                    mediaFit: event.target
                                      .value as HomeBlockStyle["mediaFit"],
                                  })
                                }
                                className={INPUT}
                              >
                                <option value="cover">تغطية كاملة (قص الحواف)</option>
                                <option value="contain">احتواء كامل (بدون قص)</option>
                              </select>
                            </Field>

                            <Field label="استدارة حواف الوسائط (px)">
                              <input
                                type="number"
                                min={0}
                                max={48}
                                value={editor.style.mediaRadius ?? 0}
                                onChange={(event) =>
                                  patchStyle({
                                    mediaRadius: Number(event.target.value),
                                  })
                                }
                                className={INPUT}
                              />
                            </Field>
                          </>
                        )}

                        {(editor.type === "projects_slider" ||
                          editor.type === "ad_slider") && (
                          <Field
                            label="عرض بطاقة المشروع (px)"
                            hint="من 200 إلى 560"
                          >
                            <input
                              type="number"
                              min={200}
                              max={560}
                              step={10}
                              value={editor.style.cardWidth ?? ""}
                              onChange={(event) =>
                                patchStyle({
                                  cardWidth:
                                    event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value),
                                })
                              }
                              className={INPUT}
                            />
                          </Field>
                        )}
                      </div>

                      {/* معاينة مصغّرة للتنسيق */}
                      <div className="mt-3 rounded-xl border border-sand-200 bg-sand-50/70 p-3">
                        <p className="mb-2 text-[10.5px] font-bold text-sand-500">
                          معاينة مصغّرة
                        </p>
                        <div
                          className={[
                            "rounded-xl border border-sand-200 p-3",
                            ...blockScopeClasses(editor.style, {
                              backgroundMedia:
                                editor.type === "hero" || editor.type === "banner",
                            }),
                          ].join(" ")}
                          style={
                            blockCssVars(editor.style) as React.CSSProperties
                          }
                        >
                          <p className="hb-title text-[20px] font-black text-ocean-900">
                            عنوان تجريبي للقسم
                          </p>
                          <p className="hb-body mt-1 text-[12px] leading-6 text-sand-700">
                            نص تجريبي يوضح شكل الخط وحجمه ولونه داخل هذا القسم.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* عناصر البطاقات والقوائم والشرائط */}
                    {itemTypes.includes(editor.type) && (
                      <div className="mt-3 rounded-2xl border border-sand-200 bg-white/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-black text-ocean-900">
                            {editor.type === "stats"
                              ? "بطاقات الأرقام"
                              : editor.type === "faq"
                                ? "الأسئلة"
                                : editor.type === "marquee"
                                  ? "عبارات الشريط المتحرك"
                                  : "بطاقات الإعلانات"}
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
                                  editor.type === "stats"
                                    ? "القيمة (مثال: 100%)"
                                    : editor.type === "faq"
                                      ? "السؤال"
                                      : editor.type === "marquee"
                                        ? "نص العبارة المتحركة"
                                        : "عنوان الإعلان"
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
                                placeholder={
                                  editor.type === "stats"
                                    ? "الوصف"
                                    : editor.type === "faq"
                                      ? "الإجابة"
                                      : editor.type === "ad_slider"
                                        ? "الموقع أو الوصف"
                                        : "وصف اختياري"
                                }
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
                              {editor.type === "ad_slider" && (
                                <>
                                  <input
                                    value={item.imageUrl ?? ""}
                                    onChange={(event) =>
                                      updateItem(index, { imageUrl: event.target.value })
                                    }
                                    placeholder="رابط صورة الإعلان https://"
                                    dir="ltr"
                                    className={INPUT}
                                  />
                                  <input
                                    value={item.linkUrl ?? ""}
                                    onChange={(event) =>
                                      updateItem(index, { linkUrl: event.target.value })
                                    }
                                    placeholder="رابط فتح الإعلان"
                                    dir="ltr"
                                    className={INPUT}
                                  />
                                </>
                              )}
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
            يمكنك إنشاء أي عدد من كل قالب، وتعديل محتوى كل نسخة وتصميمها بصورة
            مستقلة. «استعادة الافتراضي» تحذف النسخ الإضافية وتعيد التخطيط الأصلي.
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
