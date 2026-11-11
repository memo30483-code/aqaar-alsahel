# عقار FAMILY — منصة عقارية للساحل

سوق عقاري موثّق لمدن الساحل الجديدة (دمياط الجديدة، المنصورة الجديدة، ورأس البر)،
بهوية «عقار أحلامك». كل إعلان يُراجع من الإدارة قبل النشر، ومستندات الملكية تُفحص
مستقلًا قبل منح شارة التوثيق. التواصل مع المعلن يتم دائمًا عبر «تواصل مع الإدارة».

## التشغيل

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000).

قبل أول تشغيل، انسخ `.env.example` إلى `.env.local` واملأ قيم الأدمن
(التفاصيل في قسم «دخول لوحة التحكم»).

## السكربتات

| الأمر | الوظيفة |
|---|---|
| `npm run dev` | تشغيل بيئة التطوير |
| `npm run build` | بناء نسخة الإنتاج |
| `npm start` | تشغيل نسخة الإنتاج بعد البناء |
| `npm run lint` | فحص ESLint |
| `node --test tests/*.test.cjs` | تشغيل اختبارات المنطق والأمان |
| `npm run test:e2e` | تشغيل اختبارات المتصفح بعد بناء نسخة الإنتاج |

## التقنيات

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS بهوية ocean / sand / gold وخط Cairo
- Leaflet.js للخريطة التفاعلية
- Web Crypto لتوقيع جلسة الأدمن (يعمل على Edge وNode)

## البنية

```
src/
  app/            المسارات (App Router) وواجهات API
  components/     مكوّنات الواجهة ولوحة التحكم
  components/builder/  بلدر الصفحات (عرض الكتل وتنسيقها)
  lib/            المتاجر المحلية والمنطق المشترك
  data/           البيانات التجريبية
  types/          الأنواع المشتركة
tests/            اختبارات node:test
```

## دخول لوحة التحكم

الوصول إلى `/admin` محمي على مستوى السيرفر عبر `src/proxy.ts`:

- التحقق من البريد وكلمة المرور يتم في `/api/admin/login` فقط (لا توجد أي بيانات
  دخول داخل حزمة المتصفح).
- بعد النجاح يُضبط كوكي `aqaar_admin` موقّع بـ HMAC-SHA256 و`httpOnly`، مدته 8 ساعات.
- أي طلب إلى `/admin` أو `/api/admin/*` بدون توقيع صحيح يُرفض قبل تحميل الصفحة.
- النظام يفشل **مغلقًا**: إن غابت متغيرات البيئة فلا يمكن الدخول إطلاقًا.

متغيرات البيئة المطلوبة (في `.env.local` محليًا، وفي إعدادات Vercel عند النشر):

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=كلمة-مرور-قوية
ADMIN_SESSION_SECRET=سلسلة-عشوائية-64-حرفًا
USER_SESSION_SECRET=سلسلة-مستقلة-عشوائية-64-حرفًا
ADMIN_NAME=مدير النظام   # اختياري
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OTP_SECRET=سلسلة-مستقلة-عشوائية-64-حرفًا
RESEND_API_KEY=re_...
OTP_EMAIL_FROM=verify@your-domain.com
```

إنشاء الحسابات يفشل مغلقًا بدون Resend ومرسل بريد موثّق؛ لا تُعطّل المنصة
التحقق من ملكية البريد في بيئة الإنتاج.

لتغيير كلمة المرور: عدّل `ADMIN_PASSWORD` ثم أعد تشغيل السيرفر (أو أعد النشر)،
ثم سجّل الخروج والدخول من جديد.

## البيانات الحالية

المحتوى العام وإعدادات الإدارة تُزامَن مع جدول `app_state` في Supabase، بينما تستخدم
أجزاء مثل CRM والتقييمات وOTP وحدود الطلبات جداول PostgreSQL مستقلة. ما زالت بعض
واجهات الإدارة تستخدم `localStorage` ككاش محلي ثم تدفع التغييرات إلى السيرفر؛ لذلك
يجب ضبط `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` في بيئة الإنتاج.

قبل تشغيل نسخة جديدة، طبّق ملفات `supabase/migrations` بالترتيب. ملف
`20261111_professional_ownership.sql` مطلوب لحفظ تعديلات المهنيين بصورة ذرية
ولمنع جهاز قديم من الكتابة فوق تعديل أحدث.

## الاختبارات

اختبارات المنطق تُشغَّل عبر `npm test` ولا تحتاج متصفحًا. واختبارات المسارات
الديناميكية تعمل بمتصفح Chromium حقيقي بعد بناء نسخة الإنتاج:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

تشمل الاختبارات الحالية:

- `tests/page-builder-store.test.cjs` — محرك البلدر وسجل الصفحات والثيمات.
- `tests/admin-session.test.cjs` — توقيع جلسة الأدمن ورفض التلاعب والانتهاء.
- `tests/drag-scroll.test.cjs` — حساب اتجاه السحب في العربية والإنجليزية.

## النشر

المشروع منشور على Vercel. أضف متغيرات البيئة أعلاه في
**Project Settings → Environment Variables** (Production وPreview) قبل النشر،
وإلا ستظل لوحة التحكم مقفولة على الموقع.
