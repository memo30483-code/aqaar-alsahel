/** رسائل صفحة التسجيل والتوثيق */
export const registerMessages = {
  "register.title": { ar: "تسجيل حساب جديد", en: "Create a new account" },

  /* ---------- الهيدر (Hero) ---------- */
  "register.badge": { ar: "توثيق إجباري 100%", en: "100% mandatory verification" },
  "register.hero.title": {
    ar: "توثيق حساب موثّق على منصة عقار الساحل",
    en: "Verify an account on the Aqaar Alsahel platform",
  },
  "register.hero.desc": {
    ar: "لا يمكن إتمام التسجيل أو نشر أي عقار إلا بعد استكمال كافة البيانات ورفع الوثائق الرسمية المطلوبة. الهدف: حماية المشترين والبائعين من الإعلانات الوهمية ومنع التعامل مع هويات غير موثقة.",
    en: "Registration or listing any property can only be completed after filling in all data and uploading the required official documents. The goal: protecting buyers and sellers from fake listings and preventing dealings with unverified identities.",
  },

  /* ---------- أنواع الحسابات ---------- */
  "register.account.individual.title": { ar: "فرد", en: "Individual" },
  "register.account.individual.note": {
    ar: "باحث عن عقار أو بائع",
    en: "Property seeker or seller",
  },
  "register.account.developer.title": {
    ar: "مطور / وسيط عقاري",
    en: "Developer / Real-estate broker",
  },
  "register.account.developer.note": {
    ar: "شركة أو مكتب تسويق",
    en: "Company or marketing office",
  },
  "register.account.lawyer.title": { ar: "محامٍ معتمد", en: "Certified lawyer" },
  "register.account.lawyer.note": {
    ar: "استشارات وتوثيق عقود",
    en: "Consultations & contract authentication",
  },

  /* ---------- تسميات الحقول ---------- */
  "register.field.fullName": { ar: "الاسم الكامل", en: "Full name" },
  "register.field.email": { ar: "البريد الإلكتروني", en: "Email address" },
  "register.field.password": { ar: "كلمة السر", en: "Password" },
  "register.field.phone": { ar: "رقم الجوال", en: "Mobile number" },
  "register.field.nationalIdCard": {
    ar: "رقم البطاقة الشخصية",
    en: "National ID number",
  },
  "register.field.idCardFront": {
    ar: "صورة البطاقة الشخصية — الوجه",
    en: "National ID photo — front",
  },
  "register.field.idCardBack": {
    ar: "صورة البطاقة الشخصية — الظهر",
    en: "National ID photo — back",
  },
  "register.field.companyName": {
    ar: "اسم الشركة / المكتب",
    en: "Company / office name",
  },
  "register.field.legalOfficerName": {
    ar: "اسم المسؤول القانوني",
    en: "Legal representative name",
  },
  "register.field.businessPhone": {
    ar: "رقم الجوال التجاري",
    en: "Business mobile number",
  },
  "register.field.officerNationalId": {
    ar: "الرقم القومي للمسؤول",
    en: "Representative's national ID",
  },
  "register.field.idCardImageOfficer": {
    ar: "صورة بطاقة المسؤول القانوني",
    en: "Legal representative's ID photo",
  },
  "register.field.commercialRegister": {
    ar: "رقم السجل التجاري",
    en: "Commercial register number",
  },
  "register.field.commercialRegisterImage": {
    ar: "صورة شهادة السجل التجاري",
    en: "Commercial register certificate photo",
  },
  "register.field.taxCard": {
    ar: "رقم البطاقة الضريبية",
    en: "Tax card number",
  },
  "register.field.taxCardImage": {
    ar: "صورة البطاقة الضريبية",
    en: "Tax card photo",
  },
  "register.field.fullTripleName": {
    ar: "الاسم الثلاثي",
    en: "Full triple name",
  },
  "register.field.nationalId": { ar: "الرقم القومي", en: "National ID" },
  "register.field.idCardImage": {
    ar: "صورة البطاقة الشخصية",
    en: "National ID photo",
  },
  "register.field.barNumber": {
    ar: "رقم القيد بنقابة المحامين",
    en: "Bar association registration number",
  },
  "register.field.barCardImage": {
    ar: "صورة كارنيه النقابة",
    en: "Bar association card photo",
  },

  /* ---------- النصوص التوضيحية داخل الحقول (Placeholders) ---------- */
  "register.ph.fullNameExample": {
    ar: "مثال: أحمد محمد السيد",
    en: "Example: Ahmed Mohamed El-Sayed",
  },
  "register.ph.password": {
    ar: "8 أحرف على الأقل",
    en: "At least 8 characters",
  },
  "register.ph.nationalId": { ar: "14 رقماً", en: "14 digits" },
  "register.ph.companyExample": {
    ar: "مثال: شركة الساحل للتطوير العقاري",
    en: "Example: Al-Sahel Real Estate Development Co.",
  },
  "register.ph.officerExample": {
    ar: "مثال: م. محمود عبد السلام",
    en: "Example: Eng. Mahmoud Abdel Salam",
  },
  "register.ph.commercialRegister": {
    ar: "من 5 إلى 10 أرقام",
    en: "From 5 to 10 digits",
  },
  "register.ph.taxCard": { ar: "9 أرقام", en: "9 digits" },
  "register.ph.tripleNameExample": {
    ar: "مثال: محمود عبد السلام الدسوقي",
    en: "Example: Mahmoud Abdel Salam El-Desouky",
  },
  "register.ph.barNumber": { ar: "رقم القيد", en: "Registration number" },

  /* ---------- التلميحات ---------- */
  "register.hint.otpPhone": {
    ar: "يُرسل عليه كود التفعيل (OTP)",
    en: "The activation code (OTP) is sent to it",
  },
  "register.hint.clearImage": {
    ar: "صورة واضحة JPG أو PNG",
    en: "A clear JPG or PNG image",
  },
  "register.hint.validCertificate": {
    ar: "شهادة سارية وغير منتهية",
    en: "A valid, non-expired certificate",
  },
  "register.hint.clearTaxCard": {
    ar: "صورة واضحة للبطاقة السارية",
    en: "A clear photo of the valid card",
  },
  "register.hint.validBarCard": {
    ar: "كارنيه ساري وواضح",
    en: "A valid and clear card",
  },

  /* ---------- رسائل التحقق ---------- */
  "register.error.fullName": {
    ar: "أدخل الاسم الكامل (الاسم واسم العائلة على الأقل)",
    en: "Enter the full name (first and last name at least)",
  },
  "register.error.tripleName": {
    ar: "أدخل الاسم الثلاثي كاملاً",
    en: "Enter the full triple name",
  },
  "register.error.email": {
    ar: "صيغة البريد الإلكتروني غير صحيحة",
    en: "Invalid email format",
  },
  "register.error.password": {
    ar: "كلمة السر 8 أحرف على الأقل",
    en: "Password must be at least 8 characters",
  },
  "register.error.phone": {
    ar: "رقم الجوال 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015",
    en: "Mobile number must be 11 digits and start with 010, 011, 012, or 015",
  },
  "register.error.nationalId": {
    ar: "الرقم القومي 14 رقماً بالضبط",
    en: "National ID must be exactly 14 digits",
  },
  "register.error.commercialRegister": {
    ar: "رقم السجل التجاري من 5 إلى 10 أرقام",
    en: "Commercial register number must be 5 to 10 digits",
  },
  "register.error.taxCard": {
    ar: "رقم البطاقة الضريبية 9 أرقام بالضبط",
    en: "Tax card number must be exactly 9 digits",
  },
  "register.error.barNumber": {
    ar: "أدخل رقم القيد الصحيح (أرقام فقط)",
    en: "Enter a valid registration number (digits only)",
  },
  "register.error.roleRequired": {
    ar: "اختر نوع حسابك (باحث عن عقار أو بائع)",
    en: "Choose your account type (property seeker or seller)",
  },
  "register.error.fileRequired": {
    ar: "يجب رفع {label}",
    en: "You must upload {label}",
  },
  "register.error.fieldRequired": {
    ar: "{label} إجباري",
    en: "{label} is required",
  },

  /* ---------- صفة الفرد ---------- */
  "register.role.heading": {
    ar: "صفتك على المنصة",
    en: "Your role on the platform",
  },
  "register.role.seeker": { ar: "باحث عن عقار", en: "Property seeker" },
  "register.role.owner": { ar: "بائع لعقار", en: "Property seller" },

  /* ---------- خطوات التسجيل ---------- */
  "register.step.basic.title": {
    ar: "البيانات الأساسية والوثائق",
    en: "Basic data & documents",
  },
  "register.step.basic.desc": {
    ar: "بيانات الحساب + رفع الوثائق الرسمية",
    en: "Account data + uploading official documents",
  },
  "register.step.otp.title": {
    ar: "كود التفعيل (OTP)",
    en: "Activation code (OTP)",
  },
  "register.step.otp.desc": {
    ar: "تأكيد رقم الجوال وإتمام التسجيل",
    en: "Confirm the mobile number and complete registration",
  },

  /* ---------- الأقسام ---------- */
  "register.section.accountType": { ar: "نوع الحساب", en: "Account type" },
  "register.section.accountTypeDesc": {
    ar: "تختلف الوثائق المطلوبة حسب نوع الحساب — كل الاختيارات موثقة إجبارياً.",
    en: "The required documents differ by account type — all options are mandatorily verified.",
  },
  "register.section.basicData": { ar: "البيانات الأساسية", en: "Basic data" },
  "register.section.documents": {
    ar: "الوثائق الرسمية",
    en: "Official documents",
  },
  "register.section.documentsDesc": {
    ar: "كل وثيقة إجبارية — لن يمكنك المتابعة بدون رفعها كاملة.",
    en: "Every document is mandatory — you cannot continue without uploading them all.",
  },

  /* ---------- الأزرار والإجراءات ---------- */
  "register.action.sendingOtp": {
    ar: "جاري إرسال كود التفعيل...",
    en: "Sending the activation code...",
  },
  "register.action.nextOtp": {
    ar: "التالي — إرسال كود OTP",
    en: "Next — send OTP code",
  },
  "register.action.delete": { ar: "حذف", en: "Delete" },

  /* ---------- حالة الاكتمال ---------- */
  "register.status.complete": {
    ar: "كل البيانات والوثائق مكتملة 100% — يمكنك المتابعة",
    en: "All data and documents are 100% complete — you can continue",
  },
  "register.status.incomplete": {
    ar: "أكمل كافة البيانات والوثائق للمتابعة (متبقي {count} عنصر)",
    en: "Complete all data and documents to continue ({count} item(s) remaining)",
  },

  /* ---------- رفع الوثائق ---------- */
  "register.file.uploaded": { ar: "تم رفع الوثيقة", en: "Document uploaded" },
  "register.file.notUploaded": {
    ar: "لم يتم رفع الوثيقة بعد",
    en: "Document not uploaded yet",
  },
  "register.file.replace": { ar: "استبدال الصورة", en: "Replace image" },
  "register.file.upload": { ar: "رفع الصورة", en: "Upload image" },

  /* ---------- خطوة كود التفعيل ---------- */
  "register.otp.heading": {
    ar: "أدخل كود التفعيل",
    en: "Enter the activation code",
  },
  "register.otp.sentPrefix": {
    ar: "أرسلنا كوداً مكوّناً من 6 أرقام إلى رقم الجوال",
    en: "We sent a 6-digit code to the mobile number",
  },
  "register.otp.demoPrefix": {
    ar: "بيئة تجريبية (بدون ربط مزود SMS): كود التفعيل الحالي هو",
    en: "Demo environment (no SMS provider connected): the current activation code is",
  },
  "register.otp.label": { ar: "كود التفعيل (OTP)", en: "Activation code (OTP)" },
  "register.otp.resent": {
    ar: "تم إرسال كود جديد لرقم جوالك.",
    en: "A new code has been sent to your mobile number.",
  },
  "register.otp.error.length": {
    ar: "أدخل الكود المكوّن من 6 أرقام",
    en: "Enter the 6-digit code",
  },
  "register.otp.error.wrong": {
    ar: "الكود غير صحيح — تأكد من الأرقام أو اطلب كوداً جديداً.",
    en: "Incorrect code — check the digits or request a new code.",
  },
  "register.otp.confirm": {
    ar: "تأكيد الحساب وإتمام التسجيل",
    en: "Confirm account and complete registration",
  },
  "register.otp.back": {
    ar: "← الرجوع لتعديل البيانات",
    en: "← Back to edit data",
  },
  "register.otp.resend": { ar: "إعادة إرسال الكود", en: "Resend code" },

  /* ---------- شاشة النجاح ---------- */
  "register.success.title": {
    ar: "تم توثيق حسابك بنجاح",
    en: "Your account has been verified successfully",
  },
  "register.success.desc": {
    ar: "تم تأكيد رقم الجوال وأصبح حسابك موثقاً بالكامل على المنصة.",
    en: "Your mobile number has been confirmed and your account is now fully verified on the platform.",
  },
  "register.success.accountType": { ar: "نوع الحساب", en: "Account type" },
  "register.success.name": { ar: "الاسم", en: "Name" },
  "register.success.email": { ar: "البريد الإلكتروني", en: "Email address" },
  "register.success.phone": { ar: "رقم الجوال", en: "Mobile number" },
  "register.success.documents": {
    ar: "الوثائق المرفوعة",
    en: "Uploaded documents",
  },
  "register.success.documentsCount": {
    ar: "{count} وثيقة",
    en: "{count} document(s)",
  },
  "register.success.status": { ar: "الحالة", en: "Status" },
  "register.success.verified": { ar: "موثّق ✓", en: "Verified ✓" },
  "register.success.redirecting": {
    ar: "سيتم توجيهك تلقائياً إلى الصفحة المطلوبة خلال لحظات...",
    en: "You will be redirected automatically to the requested page in a moment...",
  },
  "register.success.addProperty": {
    ar: "أضف عقارك الآن",
    en: "List your property now",
  },
  "register.success.backHome": { ar: "العودة للرئيسية", en: "Back to home" },

  /* ---------- الشريط الجانبي ---------- */
  "register.sidebar.checklist": {
    ar: "قائمة المتطلبات ({type})",
    en: "Checklist ({type})",
  },
  "register.sidebar.checklistDesc": {
    ar: "كل بند هنا إجباري — لا يمكن إتمام التسجيل بدون اكتماله 100%.",
    en: "Every item here is mandatory — registration cannot be completed until it is 100% done.",
  },
  "register.sidebar.progress": {
    ar: "نسبة الاكتمال",
    en: "Completion percentage",
  },

  /* ---------- لماذا التوثيق إجباري؟ ---------- */
  "register.why.heading": {
    ar: "لماذا التوثيق إجباري؟",
    en: "Why is verification mandatory?",
  },
  "register.why.b1": {
    ar: "• التأكد من هوية كل بائع ومطور قبل عرض عقاراته.",
    en: "• Verify the identity of every seller and developer before showing their properties.",
  },
  "register.why.b2": {
    ar: "• منع الإعلانات الوهمية والأسعار المضللة.",
    en: "• Prevent fake listings and misleading prices.",
  },
  "register.why.b3": {
    ar: "• حماية أطراف التعاقد قانونياً وتوثيق المستندات.",
    en: "• Legally protect the contracting parties and authenticate documents.",
  },
  "register.why.b4": {
    ar: "• أولوية ظهور للإعلانات الصادرة من حسابات موثقة.",
    en: "• Priority visibility for listings from verified accounts.",
  },

  /* ---------- المساعدة ---------- */
  "register.help.heading": { ar: "محتاج مساعدة؟", en: "Need help?" },
  "register.help.desc": {
    ar: "فريق التوثيق يتابع معك خطوة بخطوة حتى تأكيد الحساب.",
    en: "The verification team follows up with you step by step until the account is confirmed.",
  },
  "register.help.cta": { ar: "الاستشارات القانونية", en: "Legal consultations" },
};
