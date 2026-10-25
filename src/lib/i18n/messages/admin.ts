/**
 * رسائل لوحة تحكم المدير (/admin): الإحصاءات السريعة، تبويبات الإدارة،
 * جداول العقارات والمستخدمين والمطورين، وشاشة منع الوصول.
 */
export const adminMessages = {
  /* ---------- ترويسة اللوحة ---------- */
  "admin.title": { ar: "لوحة تحكم مدير الموقع", en: "Site admin dashboard" },
  "admin.subtitle": {
    ar: "مراجعة الإعلانات وإدارة المستخدمين وتوثيق المطورين العقاريين",
    en: "Review listings, manage users and verify real-estate developers",
  },
  "admin.backHome": { ar: "عودة للموقع", en: "Back to site" },
  "admin.updatedNow": { ar: "محدّث الآن", en: "Updated just now" },

  /* ---------- الإحصاءات السريعة ---------- */
  "admin.stat.listings": { ar: "إجمالي الإعلانات", en: "Total listings" },
  "admin.stat.pending": { ar: "بانتظار الموافقة", en: "Pending approvals" },
  "admin.stat.developers": { ar: "المطورون العقاريون", en: "Developers" },
  "admin.stat.users": { ar: "المستخدمون النشطون", en: "Active users" },

  /* ---------- التبويبات ---------- */
  "admin.tab.listings": {
    ar: "إدارة العقارات والإعلانات",
    en: "Listings management",
  },
  "admin.tab.users": {
    ar: "إدارة المستخدمين والموظفين",
    en: "Users & staff",
  },
  "admin.tab.developers": {
    ar: "المطورون العقاريون",
    en: "Developers verification",
  },

  /* ---------- تبويب الإعلانات ---------- */
  "admin.listings.heading": {
    ar: "إدارة العقارات والإعلانات",
    en: "Listings management",
  },
  "admin.listings.desc": {
    ar: "راجع الإعلانات المقدَّمة على المنصة واقبلها أو ارفضها أو عدّلها.",
    en: "Review submitted listings and approve, reject or edit them.",
  },
  "admin.col.property": { ar: "العقار", en: "Property" },
  "admin.col.city": { ar: "المدينة", en: "City" },
  "admin.col.type": { ar: "النوع", en: "Type" },
  "admin.col.price": { ar: "السعر", en: "Price" },
  "admin.col.seller": { ar: "المعلن", en: "Seller" },
  "admin.col.status": { ar: "الحالة", en: "Status" },
  "admin.col.actions": { ar: "إجراءات", en: "Actions" },
  "admin.status.pending": { ar: "قيد المراجعة", en: "Pending" },
  "admin.status.approved": { ar: "مقبول", en: "Approved" },
  "admin.status.rejected": { ar: "مرفوض", en: "Rejected" },
  "admin.source.user": { ar: "إعلان مستخدم", en: "User listing" },
  "admin.source.demo": { ar: "بيانات تجريبية", en: "Demo data" },
  "admin.listings.empty": {
    ar: "لا توجد إعلانات مطابقة.",
    en: "No listings found.",
  },

  /* ---------- تبويب المستخدمين ---------- */
  "admin.users.desc": {
    ar: "تابع الحسابات المسجّلة، ووزّع الأدوار، وفعّل أو أوقف أي حساب.",
    en: "Track registered accounts, assign roles, and activate or suspend accounts.",
  },
  "admin.col.user": { ar: "المستخدم", en: "User" },
  "admin.col.contact": { ar: "بيانات التواصل", en: "Contact" },
  "admin.col.role": { ar: "الدور", en: "Role" },
  "admin.col.account": { ar: "الحساب", en: "Account" },
  "admin.col.joined": { ar: "تاريخ الانضمام", en: "Joined" },
  "admin.state.active": { ar: "نشط", en: "Active" },
  "admin.state.inactive": { ar: "موقوف", en: "Suspended" },
  "admin.action.activate": { ar: "تفعيل الحساب", en: "Activate account" },
  "admin.action.deactivate": { ar: "إيقاف الحساب", en: "Deactivate account" },
  "admin.users.empty": {
    ar: "لا يوجد مستخدمون مطابقون.",
    en: "No users found.",
  },
  "admin.role.user": { ar: "مستخدم", en: "User" },
  "admin.role.agent": { ar: "مسوّق عقاري", en: "Agent" },
  "admin.role.moderator": { ar: "مشرف", en: "Moderator" },
  "admin.role.admin": { ar: "مدير", en: "Admin" },
  "admin.role.super_admin": { ar: "مدير عام", en: "Super admin" },
  "admin.role.current": { ar: "دورك الحالي", en: "Your current role" },

  /* ---------- تبويب المطورين ---------- */
  "admin.developers.desc": {
    ar: "راجع طلبات انضمام شركات التطوير وامنح شارة «مطور مميز» للمعتمدين.",
    en: "Review developer join requests and grant the premium-developer badge to verified companies.",
  },
  "admin.dev.projects": { ar: "المشاريع: {count}", en: "Projects: {count}" },
  "admin.dev.requested": { ar: "تاريخ الطلب", en: "Requested" },
  "admin.dev.verified": { ar: "مطور مميز", en: "Premium developer" },
  "admin.dev.unverified": { ar: "قيد التوثيق", en: "Under verification" },
  "admin.action.verify": { ar: "منح شارة التمييز", en: "Grant premium badge" },
  "admin.action.unverify": { ar: "إلغاء شارة التمييز", en: "Revoke premium badge" },
  "admin.developers.empty": {
    ar: "لا توجد طلبات انضمام حالياً.",
    en: "No developer requests at the moment.",
  },

  /* ---------- إجراءات عامة ---------- */
  "admin.action.approve": { ar: "قبول", en: "Approve" },
  "admin.action.reject": { ar: "رفض", en: "Reject" },
  "admin.action.edit": { ar: "تعديل", en: "Edit" },
  "admin.action.save": { ar: "حفظ التعديل", en: "Save changes" },
  "admin.action.cancel": { ar: "إلغاء", en: "Cancel" },
  "admin.action.close": { ar: "إغلاق", en: "Close" },
  "admin.changesSaved": { ar: "تم حفظ التعديلات", en: "Changes saved" },

  /* ---------- منع الوصول ---------- */
  "admin.denied.title": {
    ar: "لا تملك صلاحية الوصول",
    en: "You don't have access",
  },
  "admin.denied.body": {
    ar: "هذه اللوحة مخصّصة لحسابات المدير (مدير / مدير عام) فقط. سجّل الدخول بحساب إداري مؤهّل للمتابعة.",
    en: "This dashboard is limited to admin accounts (admin / super admin). Sign in with an authorized admin account to continue.",
  },
  "admin.denied.cta": {
    ar: "تسجيل الدخول / حساب جديد",
    en: "Sign in / New account",
  },
};
