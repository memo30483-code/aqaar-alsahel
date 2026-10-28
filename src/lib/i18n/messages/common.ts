/**
 * الرسائل المشتركة: الهيدر، الفوتر، المدن، العملات، والدول.
 * كل مفتاح يحمل نسختيه العربية والإنجليزية بجانب بعضهما لضمان التزامن.
 */
export const commonMessages = {
  /* ---------- الهوية ---------- */
  "brand.name": { ar: "عقار FAMILY", en: "Aqaar FAMILY" },
  "brand.tagline": {
    ar: "عقار أحلامك · مدن الدلتا",
    en: "Your dream home · Delta cities",
  },

  /* ---------- التنقّل ---------- */
  "nav.cities": { ar: "المدن", en: "Cities" },
  "nav.companies": { ar: "الشركات العقارية", en: "Real-estate companies" },
  "nav.compass": { ar: "البوصلة العقارية", en: "Market compass" },
  "nav.legal": { ar: "الاستشارات القانونية", en: "Legal consultations" },
  "nav.login": { ar: "تسجيل الدخول / حساب جديد", en: "Sign in / New account" },
  "nav.loginShort": { ar: "تسجيل الدخول", en: "Sign in" },
  "nav.account": { ar: "الحساب", en: "Account" },
  "nav.logout": { ar: "تسجيل الخروج", en: "Sign out" },
  "nav.adminPanel": { ar: "لوحة التحكم", en: "Admin dashboard" },
  "nav.addProperty": { ar: "أضف عقارك", en: "List your property" },
  "nav.menu": { ar: "القائمة", en: "Menu" },
  "nav.sectionCities": { ar: "المدن", en: "Cities" },
  "nav.sectionSections": { ar: "الأقسام", en: "Sections" },

  /* ---------- صفحة تسجيل الدخول ---------- */
  "login.title": { ar: "تسجيل الدخول", en: "Sign in" },
  "login.hero.desc": {
    ar: "أدخل بياناتك للدخول إلى حسابك على منصة عقار FAMILY.",
    en: "Enter your credentials to sign in to your Aqaar FAMILY account.",
  },
  "login.email": { ar: "البريد الإلكتروني", en: "Email" },
  "login.password": { ar: "كلمة السر", en: "Password" },
  "login.loginButton": { ar: "دخول", en: "Login" },
  "login.createAccount": {
    ar: "مستخدم جديد؟ إنشاء حساب",
    en: "New user? Create account",
  },
  "login.demoAdminHint": {
    ar: "حساب تجريبي: admin@aqaar.com / admin123",
    en: "Demo account: admin@aqaar.com / admin123",
  },
  "login.error.invalid": {
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    en: "Invalid email or password",
  },
  "login.error.required": {
    ar: "البريد الإلكتروني وكلمة المرور مطلوبان",
    en: "Email and password are required",
  },
  "login.success": {
    ar: "تم تسجيل الدخول بنجاح",
    en: "Signed in successfully",
  },
  "login.redirecting": {
    ar: "جارٍ التوجيه...",
    en: "Redirecting...",
  },

  /* ---------- قائمة الشركات العقارية ---------- */
  "companies.heading": {
    ar: "الشركات العقارية في الدلتا",
    en: "Real-estate companies in the Delta",
  },
  "companies.developers": {
    ar: "المطورون العقاريون",
    en: "Real-estate developers",
  },
  "companies.developersDesc": {
    ar: "شركات التطوير ومشاريعها في مدن الدلتا",
    en: "Development companies and their projects across the Delta cities",
  },
  "companies.brokers": {
    ar: "المسوقون والوسطاء العقاريون",
    en: "Marketers & brokers",
  },
  "companies.brokersDesc": {
    ar: "مكاتب الوساطة والمسوّقون المعتمدون",
    en: "Licensed brokerage offices and marketers",
  },

  /* ---------- التفضيلات: اللغة والعملة ---------- */
  "pref.language": { ar: "اللغة", en: "Language" },
  "pref.currency": { ar: "العملة", en: "Currency" },
  "pref.country": { ar: "الدولة", en: "Country" },
  "pref.settings": { ar: "التفضيلات", en: "Preferences" },
  "pref.ratesLive": { ar: "أسعار صرف محدّثة", en: "Live exchange rates" },
  "pref.ratesFallback": { ar: "أسعار تقديرية", en: "Estimated rates" },
  "pref.updatedAt": { ar: "آخر تحديث", en: "Updated" },
  "pref.langAr": { ar: "العربية", en: "Arabic" },
  "pref.langEn": { ar: "English", en: "English" },

  /* ---------- المدن ---------- */
  "city.all": { ar: "كل المدن", en: "All cities" },
  "city.rasElBar": { ar: "رأس البر", en: "Ras El Bar" },
  "city.damietta": { ar: "دمياط", en: "Damietta" },
  "city.newDamietta": { ar: "دمياط الجديدة", en: "New Damietta" },
  "city.oldDamietta": { ar: "دمياط القديمة", en: "Old Damietta" },
  "city.faraskur": { ar: "فارسكور", en: "Faraskur" },
  "city.newMansoura": { ar: "المنصورة الجديدة", en: "New Mansoura" },
  "city.gamasa": { ar: "جمصة", en: "Gamasa" },

  /* ---------- العملات ---------- */
  "currency.EGP": { ar: "جنيه مصري", en: "Egyptian Pound" },
  "currency.SAR": { ar: "ريال سعودي", en: "Saudi Riyal" },
  "currency.AED": { ar: "درهم إماراتي", en: "UAE Dirham" },
  "currency.KWD": { ar: "دينار كويتي", en: "Kuwaiti Dinar" },
  "currency.USD": { ar: "دولار أمريكي", en: "US Dollar" },

  /* ---------- الدول ---------- */
  "country.EG": { ar: "مصر", en: "Egypt" },
  "country.SA": { ar: "السعودية", en: "Saudi Arabia" },
  "country.AE": { ar: "الإمارات", en: "United Arab Emirates" },
  "country.KW": { ar: "الكويت", en: "Kuwait" },
  "country.US": { ar: "الولايات المتحدة", en: "United States" },

  /* ---------- تصنيفات العقار والبائع والطلب ---------- */
  "type.apartment": { ar: "شقة", en: "Apartment" },
  "type.villa": { ar: "فيلا", en: "Villa" },
  "type.shop": { ar: "محل", en: "Shop" },
  "type.land": { ar: "أرض", en: "Land" },
  "type.house": { ar: "منزل", en: "House" },
  "type.duplex": { ar: "شقة دوبلكس", en: "Duplex" },
  "seller.individual": { ar: "فرد", en: "Individual" },
  "seller.developer": { ar: "مطور", en: "Developer" },
  "seller.marketer": { ar: "مسوق", en: "Marketer" },
  "demand.high": { ar: "مرتفع", en: "High" },
  "demand.seasonal": { ar: "موسمي", en: "Seasonal" },
  "demand.stable": { ar: "مستقر", en: "Stable" },

  /* ---------- نوع العرض ---------- */
  "purpose.buy": { ar: "بيع", en: "Buy" },
  "purpose.rent": { ar: "إيجار", en: "Rent" },

  /* ---------- الفوتر ---------- */
  "footer.tagline": {
    ar: "سوق عقاري موثّق في مدن الدلتا",
    en: "A documented real-estate market across the Delta cities",
  },
  "footer.home": { ar: "الرئيسية", en: "Home" },
  "footer.about": {
    ar: "منصة عقارية موثّقة في رأس البر، دمياط، دمياط الجديدة، فارسكور، جمصة، والمنصورة الجديدة. كل عرض يتم التحقق من مستنداته وسلامته القانونية قبل النشر، وكل تواصل يتم عبر إدارة الموقع.",
    en: "A documented real-estate platform across Ras El Bar, Damietta, New Damietta, Faraskur, Gamasa and New Mansoura. Every listing is checked for documents and legal safety before publishing, and all contact goes through site management.",
  },
  "footer.quickLinks": { ar: "روابط سريعة", en: "Quick links" },
  "footer.cities": { ar: "المدن", en: "Cities" },
  "footer.newsletter.title": { ar: "خليك على اطلاع", en: "Stay in the loop" },
  "footer.newsletter.desc": {
    ar: "اشترك لتصلك أفضل الفرص العقارية في المدن المعتمدة قبل غيرك.",
    en: "Subscribe to get the best property opportunities across the approved cities.",
  },
  "footer.newsletter.placeholder": { ar: "بريدك الإلكتروني", en: "Your email" },
  "footer.newsletter.cta": { ar: "اشترك", en: "Subscribe" },
  "footer.newsletter.success": {
    ar: "تم تسجيل بريدك — هنبعتلك أول الفرص.",
    en: "You're subscribed — we'll send you the best opportunities.",
  },
  "footer.managementNote": {
    ar: "كل التواصل عبر إدارة الموقع",
    en: "All contact goes through site management",
  },
  "footer.contact.title": { ar: "خدمة العملاء", en: "Customer service" },
  "footer.links.privacy": { ar: "سياسة الخصوصية", en: "Privacy policy" },
  "footer.links.terms": { ar: "الشروط والأحكام", en: "Terms & conditions" },
  "footer.links.advertise": { ar: "أعلن معنا", en: "Advertise" },
  "footer.links.sitemap": { ar: "خريطة الموقع", en: "Sitemap" },
  "footer.rights": {
    ar: "© {year} عقار FAMILY — جميع الحقوق محفوظة",
    en: "© {year} Aqaar FAMILY — All rights reserved",
  },

  /* ---------- وسائل التواصل والدعم الفني ---------- */
  "footer.support.title": {
    ar: "وسائل التواصل والدعم الفني",
    en: "Contact & Technical Support",
  },
  "footer.support.phone": { ar: "أرقام الدعم", en: "Support lines" },
  "footer.support.email": { ar: "بريد الدعم", en: "Support email" },
  "footer.support.hours": { ar: "ساعات العمل", en: "Working hours" },
  "footer.support.hoursValue": {
    ar: "يومياً من 9 صباحاً حتى 9 مساءً",
    en: "Daily from 9:00 AM to 9:00 PM",
  },

  /* ---------- المساحات الإعلانية ---------- */
  "ads.label": { ar: "إعلان", en: "Ad" },
  "ads.featured": { ar: "إعلان مميز", en: "Featured ad" },
  "ads.sponsoredDevelopers": {
    ar: "برعاية المطورين",
    en: "Sponsored by developers",
  },
  "ads.developerSponsorships": {
    ar: "برعايات المطورين",
    en: "Developer sponsorships",
  },
  "ads.developerProjects": {
    ar: "مشاريع المطورين المتميزة",
    en: "Featured developer projects",
  },
  "ads.floatingBody": {
    ar: "وحدات بحرية في دمياط الجديدة — تقسيط يصل إلى 7 سنوات",
    en: "Seafront units in New Damietta — up to 7-year installments",
  },
  "ads.slotBody": {
    ar: "شقق وشاليهات بأسعار مرحلة وخطط سداد مناسبة",
    en: "Apartments and chalets with staged prices and suitable payment plans",
  },
  "ads.exploreProject": { ar: "استكشف المشروع", en: "Explore the project" },
  "ads.freeConsultation": { ar: "استشارة مجانية", en: "Free consultation" },
  "ads.close": { ar: "إغلاق الإعلان", en: "Close the ad" },

  /* ---------- الصندوق الإعلاني الجانبي ---------- */
  "ads.sidebar.title": {
    ar: "مساحة إعلانية للشركات والمطورين",
    en: "Ad space for companies & developers",
  },
  "ads.sidebar.body": {
    ar: "اعرض مشروعك أو وحداتك أمام الباحثين عن عقار في مدن الساحل.",
    en: "Showcase your project or units to property seekers across the coastal cities.",
  },
  "ads.sidebar.point1": {
    ar: "ظهور دائم في الصفحة الرئيسية",
    en: "Permanent placement on the home page",
  },
  "ads.sidebar.point2": {
    ar: "استهداف دقيق بحسب المدينة والنوع",
    en: "Precise targeting by city and property type",
  },
  "ads.sidebar.point3": {
    ar: "تقارير مشاهدات وأداء",
    en: "Views and performance reports",
  },
  "ads.sidebar.cta": { ar: "اعرف المزيد", en: "Learn more" },

  /* ---------- المساحة الإعلانية الرئيسية (العمود الأيسر) ---------- */
  "ads.mainPlacement": {
    ar: "مساحة إعلانية رئيسية",
    en: "Main ad placement",
  },
  "ads.mainPlacementDesc": {
    ar: "أماكن مخصّصة للشركات والمطورين العقاريين في الصفحة الرئيسية.",
    en: "Dedicated slots for companies and developers on the home page.",
  },
  "ads.yourAdHere": { ar: "إعلانك هنا", en: "Your ad here" },
  "ads.yourAdHereDesc": {
    ar: "احجز هذه المساحة واعرض مشاريعك أمام أكبر عدد من الباحثين عن عقار.",
    en: "Book this slot and showcase your projects to more property seekers.",
  },

  /* ---------- شريط المطورين المميزين ---------- */
  "ads.featuredDevelopers": {
    ar: "مطورون عقاريون برعاية",
    en: "Sponsored developers",
  },
  "ads.featuredDevelopersDesc": {
    ar: "شركات تطوير معتمدة تعرض مشاريعها في مدن الساحل",
    en: "Verified developers showcasing their projects across the coastal cities",
  },
  "ads.devBadge": { ar: "مطور مميز", en: "Premium developer" },
  "ads.dev.0.name": {
    ar: "شركة الدلتا للتطوير العقاري",
    en: "Delta Real Estate Development",
  },
  "ads.dev.0.project": { ar: "كمبوند شاطئ النخيل", en: "Palm Beach Compound" },
  "ads.dev.0.city": { ar: "دمياط الجديدة", en: "New Damietta" },
  "ads.dev.1.name": {
    ar: "مجموعة الساحل للاستثمار",
    en: "Coast Investment Group",
  },
  "ads.dev.1.project": { ar: "أبراج رأس البر", en: "Ras El Bar Towers" },
  "ads.dev.1.city": { ar: "رأس البر", en: "Ras El Bar" },
  "ads.dev.2.name": {
    ar: "المنصورة الحديثة للتطوير",
    en: "Modern Mansoura Development",
  },
  "ads.dev.2.project": { ar: "حدائق المنصورة", en: "Mansoura Gardens" },
  "ads.dev.2.city": { ar: "المنصورة الجديدة", en: "New Mansoura" },

  /* ---------- شارة التوثيق الفرعونية-الإسلامية ---------- */
  "seal.title": {
    ar: "توثيق فرعوني-إسلامي معتمد",
    en: "Certified Pharaonic-Islamic verification",
  },
  "seal.label": { ar: "توثّق معتمد", en: "Certified" },

  /* ---------- مشترك ---------- */
  "common.sqm": { ar: "م²", en: "m²" },
  "common.currencyFallbackNote": {
    ar: "أسعار الصرف المعروضة تقديرية ويتم تحديثها تلقائياً عند توفر الاتصال.",
    en: "Displayed exchange rates are estimates and refresh automatically when online.",
  },
};
