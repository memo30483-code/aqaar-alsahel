"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { saveSession } from "@/lib/session";
import { useT, type MessageKey } from "@/lib/i18n";

/* ============================ الأنواع ============================ */

type AccountType = "individual" | "developer" | "lawyer";
type IndividualRole = "seeker" | "owner";

type TextFieldName =
  | "fullName"
  | "companyName"
  | "legalOfficerName"
  | "fullTripleName"
  | "email"
  | "password"
  | "phone"
  | "nationalId"
  | "commercialRegister"
  | "taxCard"
  | "barNumber";

type FileFieldName =
  | "idCardFront"
  | "idCardBack"
  | "idCardImage"
  | "commercialRegisterImage"
  | "taxCardImage"
  | "barCardImage";

type FieldName = TextFieldName | FileFieldName;

/** خريطة الأخطاء: كل حقل مطلوب + اختيار نوع الحساب للأفراد */
type ErrorMap = Partial<Record<FieldName | "individualRole", string>>;

interface BaseField {
  labelKey: MessageKey;
  hintKey?: MessageKey;
  placeholder?: string;
  placeholderKey?: MessageKey;
}

interface TextField extends BaseField {
  kind: "text";
  name: TextFieldName;
  type?: "text" | "email" | "password" | "tel";
  numeric?: boolean;
  maxLength?: number;
  validate: (value: string) => MessageKey | undefined;
}

interface FileField extends BaseField {
  kind: "file";
  name: FileFieldName;
}

type Field = TextField | FileField;

/* ============================ قواعد التحقق ============================ */

const vFullName = (v: string): MessageKey | undefined =>
  v.trim().split(/\s+/).filter(Boolean).length >= 2
    ? undefined
    : "register.error.fullName";

const vTripleName = (v: string): MessageKey | undefined =>
  v.trim().split(/\s+/).filter(Boolean).length >= 3
    ? undefined
    : "register.error.tripleName";

const vEmail = (v: string): MessageKey | undefined =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
    ? undefined
    : "register.error.email";

const vPassword = (v: string): MessageKey | undefined =>
  v.length >= 8 ? undefined : "register.error.password";

const vPhone = (v: string): MessageKey | undefined =>
  /^01[0125][0-9]{8}$/.test(v) ? undefined : "register.error.phone";

const vNationalId = (v: string): MessageKey | undefined =>
  /^[0-9]{14}$/.test(v) ? undefined : "register.error.nationalId";

const vCommercialRegister = (v: string): MessageKey | undefined =>
  /^[0-9]{5,10}$/.test(v) ? undefined : "register.error.commercialRegister";

const vTaxCard = (v: string): MessageKey | undefined =>
  /^[0-9]{9}$/.test(v) ? undefined : "register.error.taxCard";

const vBarNumber = (v: string): MessageKey | undefined =>
  /^[0-9]{3,10}$/.test(v) ? undefined : "register.error.barNumber";

/* ============================ تعريف الأنواع والحقول ============================ */

const ACCOUNT_TYPES: {
  id: AccountType;
  titleKey: MessageKey;
  noteKey: MessageKey;
  icon: ReactNode;
}[] = [
  {
    id: "individual",
    titleKey: "register.account.individual.title",
    noteKey: "register.account.individual.note",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0v.75H4.5v-.75z"
      />
    ),
  },
  {
    id: "developer",
    titleKey: "register.account.developer.title",
    noteKey: "register.account.developer.note",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3.75 21V7.5L12 3l8.25 4.5V21M9 21v-6h6v6M7.5 10.5h1.5m6 0h1.5M7.5 14.25h1.5m6 0h1.5"
      />
    ),
  },
  {
    id: "lawyer",
    titleKey: "register.account.lawyer.title",
    noteKey: "register.account.lawyer.note",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 3v18m-6-15h12M6 6l-2.25 6a2.25 2.25 0 004.5 0L6 6zm12 0l-2.25 6a2.25 2.25 0 004.5 0L18 6zM8.25 21h7.5"
      />
    ),
  },
];

/** الحقول المطلوبة لكل نوع حساب — كلها إجبارية بلا استثناء */
const TYPE_FIELDS: Record<AccountType, Field[]> = {
  individual: [
    {
      kind: "text",
      name: "fullName",
      labelKey: "register.field.fullName",
      placeholderKey: "register.ph.fullNameExample",
      validate: vFullName,
    },
    {
      kind: "text",
      name: "email",
      labelKey: "register.field.email",
      type: "email",
      placeholder: "name@example.com",
      validate: vEmail,
    },
    {
      kind: "text",
      name: "password",
      labelKey: "register.field.password",
      type: "password",
      placeholderKey: "register.ph.password",
      validate: vPassword,
    },
    {
      kind: "text",
      name: "phone",
      labelKey: "register.field.phone",
      type: "tel",
      numeric: true,
      maxLength: 11,
      placeholder: "01xxxxxxxxx",
      hintKey: "register.hint.otpPhone",
      validate: vPhone,
    },
    {
      kind: "text",
      name: "nationalId",
      labelKey: "register.field.nationalIdCard",
      numeric: true,
      maxLength: 14,
      placeholderKey: "register.ph.nationalId",
      validate: vNationalId,
    },
    {
      kind: "file",
      name: "idCardFront",
      labelKey: "register.field.idCardFront",
      hintKey: "register.hint.clearImage",
    },
    {
      kind: "file",
      name: "idCardBack",
      labelKey: "register.field.idCardBack",
      hintKey: "register.hint.clearImage",
    },
  ],
  developer: [
    {
      kind: "text",
      name: "companyName",
      labelKey: "register.field.companyName",
      placeholderKey: "register.ph.companyExample",
      validate: vFullName,
    },
    {
      kind: "text",
      name: "legalOfficerName",
      labelKey: "register.field.legalOfficerName",
      placeholderKey: "register.ph.officerExample",
      validate: vFullName,
    },
    {
      kind: "text",
      name: "email",
      labelKey: "register.field.email",
      type: "email",
      placeholder: "name@example.com",
      validate: vEmail,
    },
    {
      kind: "text",
      name: "password",
      labelKey: "register.field.password",
      type: "password",
      placeholderKey: "register.ph.password",
      validate: vPassword,
    },
    {
      kind: "text",
      name: "phone",
      labelKey: "register.field.businessPhone",
      type: "tel",
      numeric: true,
      maxLength: 11,
      placeholder: "01xxxxxxxxx",
      hintKey: "register.hint.otpPhone",
      validate: vPhone,
    },
    {
      kind: "text",
      name: "nationalId",
      labelKey: "register.field.officerNationalId",
      numeric: true,
      maxLength: 14,
      placeholderKey: "register.ph.nationalId",
      validate: vNationalId,
    },
    {
      kind: "file",
      name: "idCardImage",
      labelKey: "register.field.idCardImageOfficer",
      hintKey: "register.hint.clearImage",
    },
    {
      kind: "text",
      name: "commercialRegister",
      labelKey: "register.field.commercialRegister",
      numeric: true,
      maxLength: 10,
      placeholderKey: "register.ph.commercialRegister",
      validate: vCommercialRegister,
    },
    {
      kind: "file",
      name: "commercialRegisterImage",
      labelKey: "register.field.commercialRegisterImage",
      hintKey: "register.hint.validCertificate",
    },
    {
      kind: "text",
      name: "taxCard",
      labelKey: "register.field.taxCard",
      numeric: true,
      maxLength: 9,
      placeholderKey: "register.ph.taxCard",
      validate: vTaxCard,
    },
    {
      kind: "file",
      name: "taxCardImage",
      labelKey: "register.field.taxCardImage",
      hintKey: "register.hint.clearTaxCard",
    },
  ],
  lawyer: [
    {
      kind: "text",
      name: "fullTripleName",
      labelKey: "register.field.fullTripleName",
      placeholderKey: "register.ph.tripleNameExample",
      validate: vTripleName,
    },
    {
      kind: "text",
      name: "email",
      labelKey: "register.field.email",
      type: "email",
      placeholder: "name@example.com",
      validate: vEmail,
    },
    {
      kind: "text",
      name: "password",
      labelKey: "register.field.password",
      type: "password",
      placeholderKey: "register.ph.password",
      validate: vPassword,
    },
    {
      kind: "text",
      name: "phone",
      labelKey: "register.field.phone",
      type: "tel",
      numeric: true,
      maxLength: 11,
      placeholder: "01xxxxxxxxx",
      hintKey: "register.hint.otpPhone",
      validate: vPhone,
    },
    {
      kind: "text",
      name: "nationalId",
      labelKey: "register.field.nationalId",
      numeric: true,
      maxLength: 14,
      placeholderKey: "register.ph.nationalId",
      validate: vNationalId,
    },
    {
      kind: "file",
      name: "idCardImage",
      labelKey: "register.field.idCardImage",
      hintKey: "register.hint.clearImage",
    },
    {
      kind: "text",
      name: "barNumber",
      labelKey: "register.field.barNumber",
      numeric: true,
      maxLength: 10,
      placeholderKey: "register.ph.barNumber",
      validate: vBarNumber,
    },
    {
      kind: "file",
      name: "barCardImage",
      labelKey: "register.field.barCardImage",
      hintKey: "register.hint.validBarCard",
    },
  ],
};

const STEPS: { id: number; titleKey: MessageKey; descKey: MessageKey }[] = [
  {
    id: 1,
    titleKey: "register.step.basic.title",
    descKey: "register.step.basic.desc",
  },
  {
    id: 2,
    titleKey: "register.step.otp.title",
    descKey: "register.step.otp.desc",
  },
];

const EMPTY_DETAILS: Record<TextFieldName, string> = {
  fullName: "",
  companyName: "",
  legalOfficerName: "",
  fullTripleName: "",
  email: "",
  password: "",
  phone: "",
  nationalId: "",
  commercialRegister: "",
  taxCard: "",
  barNumber: "",
};

const EMPTY_DOCUMENTS: Record<FileFieldName, string> = {
  idCardFront: "",
  idCardBack: "",
  idCardImage: "",
  commercialRegisterImage: "",
  taxCardImage: "",
  barCardImage: "",
};

/* ============================ عناصر مساعدة ============================ */

function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const t = useT();
  return (
    <ol className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
      {STEPS.map((s, index) => {
        const isDone = step > s.id;
        const isCurrent = step === s.id;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                isDone
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {isDone ? <CheckIcon className="h-4 w-4" /> : s.id}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm font-bold ${isCurrent || isDone ? "text-gray-900" : "text-gray-400"}`}
              >
                {t(s.titleKey)}
              </span>
              <span className="block text-xs text-gray-500">{t(s.descKey)}</span>
            </span>
            {index === 0 && (
              <span
                className={`mx-1 hidden h-1 flex-1 rounded-full sm:block ${
                  step === 2 ? "bg-emerald-500" : "bg-gray-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface TextFieldRowProps {
  field: TextField;
  value: string;
  error?: string;
  touched: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function TextFieldRow({
  field,
  value,
  error,
  touched,
  onChange,
  onBlur,
}: TextFieldRowProps) {
  const t = useT();
  const showError = touched && Boolean(error);
  return (
    <div>
      <label
        htmlFor={field.name}
        className="mb-1.5 block text-sm font-semibold text-gray-800"
      >
        {t(field.labelKey)}
        <span className="text-rose-500"> *</span>
      </label>
      <input
        id={field.name}
        name={field.name}
        type={field.type ?? "text"}
        inputMode={field.numeric ? "numeric" : undefined}
        maxLength={field.maxLength}
        value={value}
        placeholder={field.placeholderKey ? t(field.placeholderKey) : field.placeholder}
        aria-invalid={showError}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
          showError
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-gray-200 focus:border-gray-900 focus:ring-gray-100"
        }`}
      />
      {showError ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : field.hintKey ? (
        <p className="mt-1.5 text-xs text-gray-400">{t(field.hintKey)}</p>
      ) : null}
    </div>
  );
}

interface FileFieldRowProps {
  field: FileField;
  value: string;
  error?: string;
  touched: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onOpen: () => void;
}

function FileFieldRow({
  field,
  value,
  error,
  touched,
  onChange,
  onRemove,
  onOpen,
}: FileFieldRowProps) {
  const t = useT();
  const showError = touched && Boolean(error);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-gray-800">
        {t(field.labelKey)}
        <span className="text-rose-500"> *</span>
      </span>
      <div
        className={`flex items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition ${
          value
            ? "border-emerald-200 bg-emerald-50/50"
            : showError
              ? "border-rose-200 bg-rose-50/40"
              : "border-gray-200 bg-gray-50"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={t(field.labelKey)}
            className="h-16 w-24 shrink-0 rounded-lg border border-white object-cover shadow-soft"
          />
        ) : (
          <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-300">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-.53-8.97 6 6 0 0111.56-1.54 4.5 4.5 0 01.87 8.91"
              />
            </svg>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-800">
            {value ? t("register.file.uploaded") : t("register.file.notUploaded")}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {field.hintKey ? t(field.hintKey) : t("register.hint.clearImage")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label
              htmlFor={field.name}
              onClick={onOpen}
              className="cursor-pointer rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white transition hover:bg-gray-800"
            >
              {value ? t("register.file.replace") : t("register.file.upload")}
            </label>
            {value && (
              <button
                type="button"
                onClick={onRemove}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
              >
                {t("register.action.delete")}
              </button>
            )}
          </div>
        </div>
        <input
          id={field.name}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />
      </div>
      {showError && (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}

/* ============================ الصفحة ============================ */

export default function RegisterPage() {
  const t = useT();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [individualRole, setIndividualRole] = useState<IndividualRole | "">("");
  const [details, setDetails] =
    useState<Record<TextFieldName, string>>(EMPTY_DETAILS);
  const [documents, setDocuments] =
    useState<Record<FileFieldName, string>>(EMPTY_DOCUMENTS);
  const [touched, setTouched] = useState<
    Partial<Record<FieldName | "individualRole", boolean>>
  >({});

  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState("");
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);

  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState("");

  /** قراءة هدف التوجيه بعد إتمام التسجيل من ?redirect=/add-property */
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("redirect");
    if (target && target.startsWith("/")) setRedirectTo(target);
  }, []);

  /** بعد نجاح التوثيق: توجيه تلقائي لصفحة الهدف (مثل أضف عقارك) */
  useEffect(() => {
    if (!verified || !redirectTo) return;
    const timer = window.setTimeout(() => router.push(redirectTo), 1200);
    return () => window.clearTimeout(timer);
  }, [verified, redirectTo, router]);

  const fields = TYPE_FIELDS[accountType];

  /** كل الحقول إجبارية: أي خطأ واحد يمنع الانتقال */
  const errors = useMemo<ErrorMap>(() => {
    const out: ErrorMap = {};
    if (accountType === "individual" && !individualRole) {
      out.individualRole = t("register.error.roleRequired");
    }
    fields.forEach((field) => {
      const value =
        field.kind === "file" ? documents[field.name] : details[field.name];
      if (!value.trim()) {
        out[field.name] =
          field.kind === "file"
            ? t("register.error.fileRequired", { label: t(field.labelKey) })
            : t("register.error.fieldRequired", { label: t(field.labelKey) });
        return;
      }
      if (field.kind === "text") {
        const error = field.validate(value);
        if (error) out[field.name] = t(error);
      }
    });
    return out;
  }, [accountType, individualRole, fields, details, documents, t]);

  const remaining = Object.keys(errors).length;
  const complete = remaining === 0;

  /** إجمالي البنود المطلوبة = الحقول + صفة الفرد (إن وُجدت) */
  const totalItems = fields.length + (accountType === "individual" ? 1 : 0);
  const completedItems = totalItems - remaining;
  const progress = Math.min(
    100,
    Math.max(0, Math.round((completedItems / totalItems) * 100))
  );

  const textFields = fields.filter((f): f is TextField => f.kind === "text");
  const fileFields = fields.filter((f): f is FileField => f.kind === "file");

  const activeType = ACCOUNT_TYPES.find((type) => type.id === accountType);

  const setDetail = (name: TextFieldName, value: string) =>
    setDetails((prev) => ({ ...prev, [name]: value }));

  const markTouched = (name: FieldName | "individualRole") =>
    setTouched((prev) => ({ ...prev, [name]: true }));

  const onTextChange = (field: TextField, raw: string) => {
    setDetail(
      field.name,
      field.numeric ? raw.replace(/[^0-9]/g, "") : raw
    );
  };

  const onFileChange = (
    name: FileFieldName,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    markTouched(name);
    const reader = new FileReader();
    reader.onload = () =>
      setDocuments((prev) => ({ ...prev, [name]: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const removeDocument = (name: FileFieldName) =>
    setDocuments((prev) => ({ ...prev, [name]: "" }));

  const sendOtp = () => {
    setCode(String(Math.floor(100000 + Math.random() * 900000)));
    setOtp("");
    setOtpError("");
    setResent(true);
  };

  const onSubmitDetails = (e: FormEvent) => {
    e.preventDefault();
    if (!complete || sending) return;
    setSending(true);
    // محاكاة إرسال الكود عبر SMS — لا يوجد ربط بمزود رسائل بعد
    setTimeout(() => {
      sendOtp();
      setSending(false);
      setStep(2);
    }, 900);
  };

  const onSubmitOtp = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError(t("register.otp.error.length"));
      return;
    }
    if (otp !== code) {
      setOtpError(t("register.otp.error.wrong"));
      return;
    }
    setOtpError("");
    saveSession({
      name: details.fullName || details.companyName || details.fullTripleName,
      email: details.email,
      phone: details.phone,
      accountType,
      verifiedAt: new Date().toISOString(),
    });
    setVerified(true);
  };

  const uploadedCount = Object.values(documents).filter(Boolean).length;

  return (
    <div className="bg-gray-50 pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black px-4 pb-24 pt-14 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">
            {t("register.badge")}
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            {t("register.hero.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
            {t("register.hero.desc")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
            {ACCOUNT_TYPES.map((type) => (
              <span
                key={type.id}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/75"
              >
                {t(type.titleKey)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-14 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* العمود الرئيسي */}
          <div className="space-y-6">
            <StepIndicator step={verified ? 2 : step} />

            {verified ? (
              /* ------------------ شاشة النجاح ------------------ */
              <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-soft">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckIcon className="h-8 w-8" />
                </span>
                <h2 className="mt-5 text-2xl font-black text-gray-900">
                  {t("register.success.title")}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  {t("register.success.desc")}
                </p>
                <dl className="mx-auto mt-6 max-w-md space-y-2 rounded-2xl bg-gray-50 p-4 text-right text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-gray-700">
                      {t("register.success.accountType")}
                    </dt>
                    <dd className="text-gray-900">
                      {activeType ? t(activeType.titleKey) : null}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-gray-700">
                      {t("register.success.name")}
                    </dt>
                    <dd className="text-gray-900">
                      {details.fullName ||
                        details.companyName ||
                        details.fullTripleName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-gray-700">
                      {t("register.success.email")}
                    </dt>
                    <dd className="text-gray-900">{details.email}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-gray-700">
                      {t("register.success.phone")}
                    </dt>
                    <dd className="text-gray-900">{details.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-gray-700">
                      {t("register.success.documents")}
                    </dt>
                    <dd className="text-gray-900">
                      {t("register.success.documentsCount", { count: uploadedCount })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-gray-700">
                      {t("register.success.status")}
                    </dt>
                    <dd className="font-bold text-emerald-600">
                      {t("register.success.verified")}
                    </dd>
                  </div>
                </dl>
                {redirectTo && (
                  <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                    {t("register.success.redirecting")}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href={redirectTo || "/add-property"}
                    className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    {t("register.success.addProperty")}
                  </Link>
                  <Link
                    href="/"
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                  >
                    {t("register.success.backHome")}
                  </Link>
                </div>
              </div>
            ) : step === 1 ? (
              /* ------------------ الخطوة 1 ------------------ */
              <form
                onSubmit={onSubmitDetails}
                className="space-y-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-soft sm:p-7"
              >
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {t("register.section.accountType")}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("register.section.accountTypeDesc")}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {ACCOUNT_TYPES.map((type) => {
                      const active = accountType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setAccountType(type.id)}
                          className={`rounded-2xl border p-4 text-right transition ${
                            active
                              ? "border-black bg-black text-white shadow-lg"
                              : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <svg
                            className={`h-6 w-6 ${active ? "text-white" : "text-gray-400"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {type.icon}
                          </svg>
                          <span className="mt-2 block text-sm font-bold">
                            {t(type.titleKey)}
                          </span>
                          <span
                            className={`mt-0.5 block text-xs ${active ? "text-white/70" : "text-gray-500"}`}
                          >
                            {t(type.noteKey)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {accountType === "individual" && (
                  <div>
                    <h2 className="text-lg font-black text-gray-900">
                      {t("register.role.heading")}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        {
                          id: "seeker" as IndividualRole,
                          labelKey: "register.role.seeker" as MessageKey,
                        },
                        {
                          id: "owner" as IndividualRole,
                          labelKey: "register.role.owner" as MessageKey,
                        },
                      ].map((role) => {
                        const active = individualRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setIndividualRole(role.id);
                              markTouched("individualRole");
                            }}
                            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                              active
                                ? "bg-black text-white shadow"
                                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {t(role.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                    {touched.individualRole && errors.individualRole && (
                      <p className="mt-1.5 text-xs font-medium text-rose-600">
                        {errors.individualRole}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-lg font-black text-gray-900">
                    {t("register.section.basicData")}
                  </h2>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {textFields.map((field) => (
                      <TextFieldRow
                        key={field.name}
                        field={field}
                        value={details[field.name]}
                        error={errors[field.name]}
                        touched={Boolean(touched[field.name])}
                        onChange={(value) => onTextChange(field, value)}
                        onBlur={() => markTouched(field.name)}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-lg font-black text-gray-900">
                    {t("register.section.documents")}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("register.section.documentsDesc")}
                  </p>
                  <div className="mt-4 space-y-4">
                    {fileFields.map((field) => (
                      <FileFieldRow
                        key={field.name}
                        field={field}
                        value={documents[field.name]}
                        error={errors[field.name]}
                        touched={Boolean(touched[field.name])}
                        onChange={(e) => onFileChange(field.name, e)}
                        onRemove={() => removeDocument(field.name)}
                        onOpen={() => markTouched(field.name)}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <button
                    type="submit"
                    disabled={!complete || sending}
                    className={`w-full rounded-2xl px-6 py-4 text-sm font-black transition ${
                      complete && !sending
                        ? "bg-black text-white hover:bg-gray-800"
                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                    }`}
                  >
                    {sending
                      ? t("register.action.sendingOtp")
                      : t("register.action.nextOtp")}
                  </button>
                  <p
                    className={`mt-2 text-center text-xs font-medium ${
                      complete ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {complete
                      ? t("register.status.complete")
                      : t("register.status.incomplete", { count: remaining })}
                  </p>
                </div>
              </form>
            ) : (
              /* ------------------ الخطوة 2 ------------------ */
              <form
                onSubmit={onSubmitOtp}
                className="space-y-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-soft sm:p-7"
              >
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    {t("register.otp.heading")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("register.otp.sentPrefix")}{" "}
                    <span className="font-bold text-gray-900">
                      {details.phone}
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {t("register.otp.demoPrefix")}{" "}
                  <span className="font-mono text-sm font-black tracking-widest">
                    {code}
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="otp"
                    className="mb-1.5 block text-sm font-semibold text-gray-800"
                  >
                    {t("register.otp.label")}
                    <span className="text-rose-500"> *</span>
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    placeholder="- - - - - -"
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.5em] text-gray-900 outline-none transition focus:ring-2 ${
                      otpError
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-gray-200 focus:border-gray-900 focus:ring-gray-100"
                    }`}
                  />
                  {otpError && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      {otpError}
                    </p>
                  )}
                  {resent && !otpError && (
                    <p className="mt-1.5 text-xs font-medium text-emerald-600">
                      {t("register.otp.resent")}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className={`w-full rounded-2xl px-6 py-4 text-sm font-black transition ${
                    otp.length === 6
                      ? "bg-black text-white hover:bg-gray-800"
                      : "cursor-not-allowed bg-gray-200 text-gray-400"
                  }`}
                >
                  {t("register.otp.confirm")}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpError("");
                    }}
                    className="text-xs font-bold text-gray-600 transition hover:text-gray-900"
                  >
                    {t("register.otp.back")}
                  </button>
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="text-xs font-bold text-gray-600 transition hover:text-gray-900"
                  >
                    {t("register.otp.resend")}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* العمود الجانبي */}
          <aside className="space-y-4 lg:sticky lg:top-[88px] lg:self-start">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-black text-gray-900">
                {t("register.sidebar.checklist", {
                  type: activeType ? t(activeType.titleKey) : "",
                })}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t("register.sidebar.checklistDesc")}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {accountType === "individual" && (
                  <li className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        individualRole
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {individualRole ? "✓" : "!"}
                    </span>
                    <span
                      className={
                        individualRole ? "text-gray-700" : "text-gray-900"
                      }
                    >
                      {t("register.role.heading")}
                    </span>
                  </li>
                )}
                {fields.map((field) => {
                  const invalid = Boolean(errors[field.name]);
                  return (
                    <li key={field.name} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          invalid
                            ? "bg-gray-100 text-gray-400"
                            : "bg-emerald-500 text-white"
                        }`}
                      >
                        {invalid ? "!" : "✓"}
                      </span>
                      <span
                        className={invalid ? "text-gray-900" : "text-gray-700"}
                      >
                        {t(field.labelKey)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>{t("register.sidebar.progress")}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      complete ? "bg-emerald-500" : "bg-black"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-black p-5 text-white">
              <h3 className="text-sm font-black">{t("register.why.heading")}</h3>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-white/70">
                <li>{t("register.why.b1")}</li>
                <li>{t("register.why.b2")}</li>
                <li>{t("register.why.b3")}</li>
                <li>{t("register.why.b4")}</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-black text-gray-900">
                {t("register.help.heading")}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t("register.help.desc")}
              </p>
              <Link
                href="/legal-consultational"
                className="mt-3 inline-block rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-800 transition hover:bg-gray-50"
              >
                {t("register.help.cta")}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
