# Supabase ডেটাবেস ও Vercel ডিপ্লয়মেন্ট নির্দেশিকা

আল আহসান ফাউন্ডেশন (Al-Ahsan Foundation) প্রজেক্টটির সমস্ত ডেটা (ওয়েবসাইটের কন্টেন্ট, নির্বাহী কমিটি, স্লাইডার, কার্যক্রম, বিকাশ/নগদ অনুদান ও আয়-ব্যয়ের হিসাব) ক্লাউডে স্থায়ীভাবে সংরক্ষণ করার জন্য **Supabase (PostgreSQL)** এবং **Vercel Serverless Functions** যুক্ত করা হয়েছে।

---

## ধাপ ১: Supabase-এ ডেটাবেস তৈরি ও স্কিমা রান করা (২ মিনিট)

১. [https://supabase.com](https://supabase.com) ওয়েবসাইটে গিয়ে আপনার একাউন্টে লগইন করুন বা বিনামূল্যে নতুন একাউন্ট খুলুন।
২. **New Project**-এ ক্লিক করুন:
   - নাম দিন (যেমন: `al-ahsan-foundation`)
   - একটি নিরাপদ Database Password দিন এবং Region বেছে নিন (যেমন: `Singapore [ap-southeast-1]` যা বাংলাদেশের জন্য দ্রুততম)।
   - **Create new project** চাপুন। প্রজেক্ট তৈরি হতে ১-২ মিনিট সময় লাগতে পারে।
৩. প্রজেক্টের ড্যাশবোর্ডের বাম পাশের মেনু থেকে **SQL Editor**-এ যান (অথবা `New query` খুলুন)।
৪. এই রিপোজিটরির **`supabase/schema.sql`** ফাইলের পুরো কোডটি কপি করে পেস্ট করুন এবং **Run** (Ctrl+Enter) চাপুন।
   - এটি স্বয়ংক্রিয়ভাবে ৩টি মূল টেবিল তৈরি করবে:
     - `site_settings` (সাইট পরিচিতি, লোগো, থিম, নির্বাহী কমিটি, সমস্ত পাতার কনটেন্ট ও কার্যক্রম)
     - `donations` (বিকাশ, নগদ, রকেটের অনুদান, TrxID, অনুমোদন ও রসিদ হিস্ট্রি)
     - `expenses` (ফাউন্ডেশনের ব্যয়ের খতিয়ান ও হিসাব)
   - সাথে সাথেই সম্পূর্ণ বাংলা সেটিংস ও প্রাথমিক কার্যক্রমের ডেটা ডেটাবেসে সিড হয়ে যাবে।

---

## ধাপ ২: Supabase থেকে API ক্রেডেনশিয়াল সংগ্রহ

১. Supabase ড্যাশবোর্ডের নিচে বাম কোণে **Project Settings** (কগ আইকন)-এ যান।
২. **API** ট্যাবে যান:
   - **Project URL** কপি করুন (যেমন: `https://xxxxxxxxx.supabase.co`)
   - **Project API keys** সেকশন থেকে **`service_role`** (secret) কী-টি কপি করুন (এটি ব্যাকএন্ড API-কে পূর্ণ নিরাপদ অ্যাক্সেস দেয়)। অথবা `anon` public key কপি করুন।

---

## ধাপ ৩: Vercel-এ ডিপ্লয় এবং Environment Variables সেট করা

১. [https://vercel.com](https://vercel.com)-এ গিয়ে **Add New...** -> **Project** নির্বাচন করুন।
২. আপনার GitHub একাউন্ট থেকে `alahsanonation` রিপোজিটরিটি ইমপোর্ট (Import) করুন।
৩. Framework Preset হিসেবে স্বয়ংক্রিয়ভাবে `Vite` শনাক্ত হবে।
৪. **Environment Variables** ড্রপডাউনে ক্লিক করে নিচের ভেরিয়েবলগুলো যুক্ত করুন:

| Variable Name | Value | বিবরণ |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://xxxxxxxxx.supabase.co` | ধাপ ২-এ পাওয়া আপনার Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | ধাপ ২-এ পাওয়া `service_role` সিক্রেট কী |
| `RESEND_API_KEY` *(ঐচ্ছিক)* | `re_xxxxxxxxx` | যাচাইকৃত অনুদানের ইমেইল রসিদ স্বয়ংক্রিয় পাঠাতে [Resend.com](https://resend.com) থেকে পাওয়া API কী |
| `RESEND_FROM_EMAIL` *(ঐচ্ছিক)* | `donation@yourdomain.com` বা `onboarding@resend.dev` | প্রেরক ইমেইল ঠিকানা |

৫. **Deploy** বাটনে ক্লিক করুন।
   - Vercel আপনার ফ্রন্টএন্ড এবং `/api` সার্ভারলেস ফাংশন তৈরি করে লাইভ লিংক দিয়ে দেবে।

---

## ধাপ ৪: স্থানীয়ভাবে (Localhost) পরীক্ষা করতে চাইলে

প্রজেক্টের রুট ডিরেক্টরিতে একটি `.env` ফাইল তৈরি করে নিচের মতো মান দিন:

```env
SUPABASE_URL=https://xxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=আপনার_service_role_key
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
```

এরপর টার্মিনালে চালান:
```bash
npm run build
npm run dev
```

---

## ডেটা স্থায়িত্ব ও নিরাপত্তা বৈশিষ্ট্য

- **ক্লাউড পারসিস্টেন্স:** ব্রাউজার ক্যাশ বা কুকি মুছে ফেললেও অথবা অন্য যেকোনো ডিভাইস/ব্রাউজার থেকে সাইট ভিজিট করলেও অ্যাডমিনের করা সমস্ত পরিবর্তন অপরিবর্তিত থাকবে।
- **ডুপ্লিকেট TrxID রোধ:** অনুদান জমা দেওয়ার সময় Supabase ডেটাবেসে TrxID যাচাই করা হয়, ফলে একই ট্রানজ্যাকশন আইডি দিয়ে একাধিকবার ভুয়া অনুদান জমা দেওয়া অসম্ভব।
- **রসিদ ট্র্যাকিং:** প্রতিটি অনুমোদিত অনুদানের জন্য ইউনিক চালান নম্বর (`AHF-...`) তৈরি হয় এবং ইমেইল ডেলিভারির পূর্ণ লগ ডেটাবেসে সংরক্ষিত থাকে।
- **ব্যাকওয়ার্ড কমপ্যাটিবিলিটি:** প্রজেক্টটিতে Vercel-এর সাথে সাথে Netlify-এর ফাংশন ও রিডাইরেক্ট কনফিগারেশনও বহাল রাখা হয়েছে, ফলে উভয় প্ল্যাটফর্মেই এটি সমানভাবে কাজ করবে।


---

## ⚠️ "permission denied for table site_settings" এরর সমাধান

যদি Vercel লগে `permission denied for table site_settings` দেখতে পান, তবে Supabase SQL Editor-এ গিয়ে নিচের কুয়েরিটি রান করুন:

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for site_settings" ON public.site_settings;
CREATE POLICY "Allow all for site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for donations" ON public.donations;
CREATE POLICY "Allow all for donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for expenses" ON public.expenses;
CREATE POLICY "Allow all for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
```

এছাড়াও Vercel Environment Variables-এ `SUPABASE_SERVICE_ROLE_KEY`-তে Supabase-এর `service_role` (secret) কী দেওয়া হয়েছে কি না নিশ্চিত করুন।
