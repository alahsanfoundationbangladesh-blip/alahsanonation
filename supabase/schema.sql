-- =====================================================================
-- আল আহসান ফাউন্ডেশন (Al-Ahsan Foundation) - Supabase Database Schema
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =====================================================================

-- 1. Create site_settings table (stores branding, committee, content, and campaigns)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create donations table (stores online donations, TrxIDs, verification, receipts)
CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  method TEXT NOT NULL,
  trx_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  campaign_id BIGINT,
  campaign_title TEXT,
  note TEXT,
  status TEXT DEFAULT 'pending',
  invoice_number TEXT,
  email_status TEXT,
  email_error TEXT,
  email_id TEXT,
  email_attempts JSONB DEFAULT '[]'::jsonb,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_trx_id ON public.donations(trx_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);

-- 3. Create expenses table (stores organizational expenses and ledger entries)
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  amount NUMERIC NOT NULL,
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 5. Public read policy for site settings & campaigns
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings" ON public.site_settings
  FOR SELECT
  USING (true);

-- Note: The Vercel serverless API uses SUPABASE_SERVICE_ROLE_KEY, which
-- automatically bypasses RLS and can securely read/write all tables.

-- 6. Seed Default Bengali Site Content & Settings
INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
  'settings',
  '{"siteName":"আল আহসান ফাউন্ডেশন","logo":"/Warm-Hearts-Initiative.png","primaryColor":"#4A90E2","overviewTitle":"আল আহসান ফাউন্ডেশন সম্পর্কে","overview":"মানবিক সহায়তা ও শীতবস্ত্র বিতরণের মাধ্যমে সুবিধাবঞ্চিত মানুষের পাশে দাঁড়াই।","overviewImage":"https://i.ibb.co.com/hFKT7MM/pexels-photo-6995106.webp","sliderAutoplayDelay":5,"heroSlides":[{"id":1,"image":"https://i.ibb.co/Wy1D8Np/DALL-E-2024-11-19-04-43-42-A-volunteer-warmly-wrapping-a-child-in-a-cozy-blanket-during-winter-surro.webp","heading":"সবার জন্য উষ্ণতা","description":"শীতবস্ত্র পেয়ে পরিবারগুলোতে ছড়িয়ে পড়ছে উষ্ণতা ও আশার আলো।","buttonLabel":"এখনই অনুদান দিন","buttonLink":"/donate"},{"id":2,"image":"https://i.ibb.co.com/KjC0cVX/DALL-E-2024-11-19-05-13-31-A-heartwarming-scene-of-volunteers-distributing-warm-winter-clothing-to-p.webp","heading":"একসঙ্গে আমরা পরিবর্তন আনতে পারি","description":"এই শীতে প্রয়োজনমতো মানুষের হাতে শীতবস্ত্র তুলে দিচ্ছেন স্বেচ্ছাসেবীরা।","buttonLabel":"কার্যক্রম দেখুন","buttonLink":"/campaigns"},{"id":3,"image":"https://i.ibb.co.com/L5mK6Vs/DALL-E-2024-11-19-05-15-26-A-touching-scene-of-a-child-smiling-joyfully-as-they-receive-warm-winter.webp","heading":"প্রতিটি সদয় উদ্যোগই মূল্যবান","description":"উষ্ণ পোশাক পেয়ে হাসছে একটি শিশু।","buttonLabel":"অংশ নিন","buttonLink":"/campaigns"},{"id":4,"image":"https://i.ibb.co.com/cwxPF9M/DALL-E-2024-11-19-05-17-07-A-highly-realistic-and-heartwarming-scene-of-people-from-diverse-backgrou.webp","heading":"আমাদের উদ্যোগে যুক্ত হোন","description":"একসঙ্গে আমরা গড়ছি উজ্জ্বল ও উষ্ণ ভবিষ্যৎ।","buttonLabel":"সহায়তা করুন","buttonLink":"/how-to-help"}],"about":{"headerTitle":"আমাদের সম্পর্কে","headerSubtitle":"আমাদের লক্ষ্য, স্বপ্ন এবং এই উদ্যোগের পেছনের মানুষদের সম্পর্কে জানুন।","missionTitle":"আমাদের লক্ষ্য","missionText1":"এর লক্ষ্য হলো শীতবস্ত্র ও প্রয়োজনীয় সহায়তা পৌঁছে দিয়ে অসহায় মানুষের পাশে দাঁড়ানো এবং সবাইকে মানবিক কাজে অংশ নেওয়ার সুযোগ করে দেওয়া।","missionText2":"আমরা বিশ্বাস করি, সহমর্মিতা ও সম্মিলিত উদ্যোগ মানুষের জীবনে ইতিবাচক পরিবর্তন আনে। শিক্ষা, স্বাস্থ্যসেবা কিংবা নিত্যপ্রয়োজনীয় সহায়তা—প্রতিটি অবদানই মূল্যবান।","missionImage":"https://i.ibb.co.com/hFKT7MM/pexels-photo-6995106.webp","visionTitle":"আমাদের স্বপ্ন","visionText":"এমন একটি সমাজ গড়ে তোলা, যেখানে প্রত্যেকে প্রয়োজনীয় সহায়তা ও এগিয়ে যাওয়ার সুযোগ পায়। মানুষের মধ্যে দান, সহমর্মিতা এবং টেকসই উন্নয়নের মনোভাব ছড়িয়ে দেওয়াই আমাদের স্বপ্ন।","ctaTitle":"আজই আমাদের সঙ্গে যুক্ত হোন","ctaSubtitle":"এই উদ্যোগের অংশ হয়ে মানুষের জীবনে ইতিবাচক পরিবর্তন আনুন।","ctaButtonText":"অংশ নিন","ctaButtonLink":"/donate","teamSectionTitle":"আমাদের দলের সঙ্গে পরিচিত হোন","teamMembers":[{"id":1,"name":"আব্দুল জব্বার আল নাহিদ","role":"প্রতিষ্ঠাতা ও নির্বাহী পরিচালক","image":"https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg","bio":"আল আহসান ফাউন্ডেশনের প্রতিষ্ঠাতা ও প্রধান নির্বাহী।"},{"id":2,"name":"মুফতি মুহিউস সুন্নাহ","role":"প্রধান উপদেষ্টা","image":"https://i.ibb.co.com/xLVb14x/website-photos-2.webp","bio":"উপদেষ্টা পরিষদ প্রধান ও মানবিক কার্যক্রম সমন্বয়ক।"},{"id":3,"name":"মো. শামীম এহসান","role":"সমন্বয়ক ও প্রশাসন","image":"https://i.ibb.co.com/nsgmKpH/Shamsh-Hadi.jpg","bio":"মাঠ পর্যায় ও ভলান্টিয়ার সমন্বয় প্রধান।"}]},"howItWorks":{"title":"যেভাবে কাজ করে","steps":[{"id":1,"stepNumber":"১","title":"কার্যক্রম দেখুন","description":"আপনার এলাকার চলমান অনুদান কার্যক্রম দেখুন এবং কীভাবে সহায়তা করবেন জানুন।"},{"id":2,"stepNumber":"২","title":"অনুদানের সামগ্রী বেছে নিন","description":"অনুদানের জন্য কম্বল, জ্যাকেট ও সোয়েটারের মতো শীতবস্ত্র বেছে নিন।"},{"id":3,"stepNumber":"৩","title":"অনুদান ফর্ম পূরণ করুন","description":"আপনার কাছ থেকে সংগ্রহের ঠিকানা জানান অথবা নিকটস্থ জমাদানের স্থান খুঁজুন।"},{"id":4,"stepNumber":"৪","title":"উষ্ণতা ছড়িয়ে দিন","description":"স্বেচ্ছাসেবীরা অনুদান প্রয়োজনীয় মানুষের কাছে পৌঁছে দেবেন।"}],"divisionsTitle":"কার্যক্রমের বিভাগ","divisionsSubtitle":"বর্তমানে আমরা নিচের বিভাগগুলোতে কাজ করছি:","divisions":"ঢাকা, চট্টগ্রাম, সিলেট, খুলনা, রাজশাহী, বরিশাল, রংপুর, ময়মনসিংহ","flowchartImage":"/flowchart-bangla.svg"},"testimonials":{"title":"মানুষের অভিজ্ঞতা","items":[{"id":1,"name":"আব্দুল জব্বার আল নাহিদ","role":"উপকারভোগী","image":"https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg","message":"শীতের সবচেয়ে কঠিন সময়ে আমরা জ্যাকেট ও কম্বল পেয়েছি। এই সহায়তা আমাদের পরিবারকে উষ্ণতা ও স্বস্তি দিয়েছে। আপনাদের সদয় উদ্যোগের জন্য ধন্যবাদ!","location":"সিলেট","title":"শীতকালীন সহায়তা বিতরণ"},{"id":2,"name":"রহিম উদ্দিন","role":"স্বেচ্ছাসেবক","image":"https://i.ibb.co.com/931fDV3/pexels-photo-749091.webp","message":"খুলনায় কম্বল বিতরণের অভিজ্ঞতা আমার মনে থাকবে। মানুষের আনন্দ ও কৃতজ্ঞতা দেখে সব পরিশ্রম সার্থক মনে হয়েছে।","location":"খুলনা","title":"শীতকালীন সহায়তায় হাসি"},{"id":3,"name":"আয়েশা খাতুন","role":"উপকারভোগী","image":"https://i.ibb.co.com/tZc6dPW/pexels-1844773-3426975.webp","message":"এই উদ্যোগের সহায়তায় শীতের কঠিন সময়ে আমার সন্তানেরা উষ্ণ ও নিরাপদ ছিল। এমন সহায়তার জন্য আমরা কৃতজ্ঞ।","location":"ঢাকা","title":"পরিবারের পাশে উষ্ণ সহায়তা"},{"id":4,"name":"করিম আলী","role":"স্বেচ্ছাসেবক","image":"https://i.ibb.co.com/B67Ggd1/pexels-photo-7562076.webp","message":"এমন মানবিক কাজে যুক্ত হতে পেরে আমি আনন্দিত। কঠিন সময়ে চট্টগ্রামের মানুষের পাশে দাঁড়িয়ে সমাজকে ফিরিয়ে দেওয়ার মূল্য বুঝেছি।","location":"চট্টগ্রাম","title":"চট্টগ্রামে মানুষের পাশে"}]},"faqs":{"title":"সাধারণ জিজ্ঞাসা","items":[{"id":1,"question":"আপনাদের কার্যক্রম কীভাবে কাজ করে?","answer":"কার্যক্রমের তালিকা থেকে আপনার পছন্দের উদ্যোগ বেছে নিন। অর্থ অনুদানের ক্ষেত্রে বিকাশ, নগদ বা রকেটে টাকা পাঠিয়ে TrxID জমা দিন; সামগ্রী দিতে চাইলে কার্যক্রমের পাতায় বিস্তারিত দেখুন।"},{"id":2,"question":"এই প্ল্যাটফর্ম ব্যবহার করতে কি কোনো ফি লাগে?","answer":"ওয়েবসাইটে কার্যক্রম দেখা ও অনুদানের তথ্য জমা দিতে কোনো সেবা ফি নেই। মোবাইল আর্থিক সেবাদাতার নিজস্ব লেনদেন ফি প্রযোজ্য হতে পারে।"},{"id":3,"question":"সহায়তা প্রয়োজন হলে কী করব?","answer":"কোনো সহায়তা লাগলে যোগাযোগ পাতায় দেওয়া ইমেইল বা ফোন নম্বরে আমাদের সঙ্গে যোগাযোগ করুন।"},{"id":4,"question":"অনুরোধ জমা দেওয়ার পর কি বাতিল করা যাবে?","answer":"অনুদানের তথ্য জমা দেওয়ার পর তা যাচাইয়ের আগে সংশোধন বা বাতিলের অনুরোধ করতে আমাদের সঙ্গে যোগাযোগ করুন। যাচাই হয়ে গেলে অনুদানের রসিদ তৈরি হতে পারে।"},{"id":5,"question":"আপনারা কী ধরনের সহায়তা দেন?","answer":"আমরা শীতবস্ত্র বিতরণ, মানবিক সহায়তা এবং অনুদান কার্যক্রম পরিচালনা করি। চলমান কার্যক্রমের পাতায় বর্তমান উদ্যোগগুলো দেখুন।"}]},"contact":{"headerTitle":"যোগাযোগ","headerSubtitle":"আপনার প্রশ্ন বা মতামত জানাতে আমাদের সঙ্গে যোগাযোগ করুন।","formTitle":"যোগাযোগ করুন","formSubtitle":"নিচের ফর্মে আপনার বার্তা লিখুন, আমরা যোগাযোগ করার চেষ্টা করব।","phone":"+৮৮০ ১৩১২৫১৫৬৪৩","email":"alahsanfoundationbangladesh@gmail.com","address":"বাংলাদেশ","ctaTitle":"আজই আমাদের সঙ্গে যুক্ত হোন","ctaSubtitle":"এই উদ্যোগের অংশ হয়ে মানুষের জীবনে ইতিবাচক পরিবর্তন আনুন।","ctaButtonText":"অংশ নিন","ctaButtonLink":"/donate","facebookUrl":"https://www.facebook.com/abnahidagency","twitterUrl":"https://twitter.com/xahid_420","instagramUrl":"https://www.instagram.com/abnahidseo","youtubeUrl":"","linkedinUrl":"","footerDescription":"মানবিক সহায়তা ও শীতবস্ত্র বিতরণের মাধ্যমে মানুষের পাশে দাঁড়াই। আমাদের উদ্যোগে যুক্ত হোন।","bkashNumber":"8801312515643","nagadNumber":"8801312515643","rocketNumber":"8801312515643"},"teamMembers":[{"id":1,"name":"আব্দুল জব্বার আল নাহিদ","role":"প্রতিষ্ঠাতা ও নির্বাহী পরিচালক","image":"https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg","bio":"আল আহসান ফাউন্ডেশনের প্রতিষ্ঠাতা ও প্রধান নির্বাহী।"},{"id":2,"name":"মুফতি মুহিউস সুন্নাহ","role":"প্রধান উপদেষ্টা","image":"https://i.ibb.co.com/xLVb14x/website-photos-2.webp","bio":"উপদেষ্টা পরিষদ প্রধান ও মানবিক কার্যক্রম সমন্বয়ক।"},{"id":3,"name":"মো. শামীম এহসান","role":"সমন্বয়ক ও প্রশাসন","image":"https://i.ibb.co.com/nsgmKpH/Shamsh-Hadi.jpg","bio":"মাঠ পর্যায় ও ভলান্টিয়ার সমন্বয় প্রধান।"}]}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- 7. Seed Default Campaigns
INSERT INTO public.site_settings (key, value, updated_at)
VALUES (
  'campaigns',
  '[{"id":1,"title":"উষ্ণ হৃদয়ের শীতবস্ত্র কার্যক্রম","image":"https://i.ibb.co.com/pj2js2n/pexels-photo-14831638.webp","description":"ঢাকার সুবিধাবঞ্চিত পরিবারের জন্য এই শীতে উষ্ণ পোশাক পৌঁছে দিতে সহায়তা করুন।","status":"চলমান","current_funds":20000,"goal":25000,"progress":80,"contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"ঢাকা","secondary_description":"উষ্ণ হৃদয়ের শীতবস্ত্র কার্যক্রমের লক্ষ্য হলো ঢাকার শীতার্ত ও সুবিধাবঞ্চিত পরিবারগুলোর কাছে প্রয়োজনীয় পোশাক পৌঁছে দেওয়া। শিশু, প্রবীণ এবং অসহায় মানুষের জন্য জ্যাকেট, সোয়েটার ও কম্বল সংগ্রহ করে স্থানীয় স্বেচ্ছাসেবীদের সহায়তায় সেগুলো বিতরণ করা হয়। আপনার দেওয়া প্রতিটি পোশাক কারও শীতের কষ্ট কমাতে পারে।"},{"id":2,"title":"চট্টগ্রাম উষ্ণতা উদ্যোগ","image":"https://i.ibb.co.com/NFTgTGM/pexels-photo-6647010.webp","description":"চট্টগ্রামের অসহায় মানুষের জন্য আপনার অব্যবহৃত শীতের পোশাক অনুদান দিন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"চট্টগ্রাম","current_funds":5000,"goal":10000,"progress":50,"secondary_description":"চট্টগ্রামের নিম্ন আয়ের পরিবার ও অসহায় মানুষের পাশে দাঁড়াতে এই উদ্যোগে নতুন বা ভালো অবস্থায় থাকা শীতের পোশাক সংগ্রহ করা হয়। স্থানীয় স্বেচ্ছাসেবীদের সঙ্গে কাজ করে সহায়তা পৌঁছে দেওয়া হয় যাঁদের প্রয়োজন সবচেয়ে বেশি।"},{"id":3,"title":"সিলেট শীতকালীন সহায়তা","image":"https://i.ibb.co.com/wrqsx9L/pexels-photo-6994891.webp","description":"শীতের মাসগুলোতে সিলেটের গৃহহীন মানুষের হাতে উষ্ণ পোশাক তুলে দিতে পাশে থাকুন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"সিলেট","current_funds":18000,"goal":30000,"progress":60,"secondary_description":"সিলেটের গৃহহীন ও সুবিধাবঞ্চিত মানুষের জন্য শীতের প্রয়োজনীয় পোশাক ও কম্বল পৌঁছে দিতে এই উদ্যোগ কাজ করে। আপনার সহায়তা মানুষের শীতের কষ্ট কমাতে এবং মর্যাদার সঙ্গে বাঁচতে সাহায্য করে।"},{"id":4,"title":"খুলনায় উষ্ণতার উদ্যোগ","image":"https://i.ibb.co.com/0m97fPm/steptodown-com556249.webp","description":"খুলনার পরিবারগুলোর জন্য শীতের পোশাক সংগ্রহ ও বিতরণে সহায়তা করুন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"খুলনা","current_funds":18000,"goal":30000,"progress":60,"secondary_description":"খুলনার শীতার্ত পরিবারগুলোর জন্য জ্যাকেট, সোয়েটার ও কম্বল সংগ্রহ করে স্বেচ্ছাসেবীরা মানুষের কাছে পৌঁছে দেন। আপনার অনুদান একটি পরিবারের শীতের রাতকে আরও নিরাপদ করতে পারে।"},{"id":5,"title":"বরিশাল কম্বল বিতরণ","image":"https://i.ibb.co.com/v1kktt7/Downloader-La-414305.webp","description":"বরিশালের শীতার্ত মানুষের জন্য কম্বল সংগ্রহে অংশ নিন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"Barisal","current_funds":7000,"goal":20000,"progress":35,"secondary_description":"বরিশালের শীতার্ত মানুষের জন্য কম্বল সংগ্রহ ও বিতরণে এই উদ্যোগ কাজ করে। স্থানীয় স্বেচ্ছাসেবীদের মাধ্যমে অনুদান পৌঁছে দেওয়া হয় সুবিধাবঞ্চিত পরিবারগুলোর কাছে।"},{"id":6,"title":"রাজশাহী শীতকালীন সহায়তা","image":"https://i.ibb.co.com/mvLSS36/Downloader-La-888948.webp","description":"রাজশাহীর অসহায় মানুষের জন্য শীতকালীন পোশাক দিন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"রাজশাহী","current_funds":15000,"goal":20000,"progress":75,"secondary_description":"রাজশাহীর সুবিধাবঞ্চিত মানুষের কাছে উষ্ণ পোশাক পৌঁছে দিতে এই উদ্যোগ কাজ করে। নতুন বা ব্যবহারযোগ্য শীতবস্ত্র অনুদান দিয়ে আপনিও পাশে দাঁড়াতে পারেন।"},{"id":7,"title":"ময়মনসিংহ শীতকালীন উদ্যোগ","image":"https://i.ibb.co.com/JytpDKk/Downloader-La-358871.webp","description":"ময়মনসিংহের পরিবারগুলোর পাশে দাঁড়াতে আমাদের শীতকালীন উদ্যোগে যুক্ত হোন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"ময়মনসিংহ","current_funds":15000,"goal":20000,"progress":75,"secondary_description":"ময়মনসিংহের শীতার্ত পরিবারগুলোর জন্য শীতের পোশাক সংগ্রহ ও বিতরণে স্বেচ্ছাসেবীরা কাজ করেন। আপনার অংশগ্রহণ মানুষের জীবনে উষ্ণতা ও আশার আলো আনতে পারে।"},{"id":8,"title":"রংপুরে উষ্ণতা পৌঁছে দেওয়া","image":"https://i.ibb.co.com/hLzvbQq/Downloader-La-432436.webp","description":"রংপুরের শীতার্ত মানুষের কাছে উষ্ণ পোশাক পৌঁছে দিতে সহায়তা করুন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"রংপুর","current_funds":8000,"goal":15000,"progress":53,"secondary_description":"রংপুরের শীতার্ত মানুষের কাছে প্রয়োজনীয় শীতবস্ত্র পৌঁছে দিতে এই উদ্যোগ কাজ করে। আপনার অনুদান ও স্বেচ্ছাসেবা স্থানীয় পরিবারগুলোর সহায়তায় কাজে লাগবে।"},{"id":9,"title":"ঢাকা নগর আশ্রয় সহায়তা","image":"https://i.ibb.co.com/rk3CddT/Downloader-La-693267.webp","description":"ঢাকার সুবিধাবঞ্চিত মানুষের জন্য শীতকালীন আশ্রয় ও পোশাক সহায়তায় অংশ নিন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"ঢাকা","current_funds":14000,"goal":20000,"progress":70,"secondary_description":"ঢাকার নগর এলাকায় বসবাসকারী অসহায় মানুষ ও পরিবারগুলোর জন্য শীতকালীন সহায়তা পৌঁছে দিতে এই উদ্যোগ কাজ করে। কম্বল ও উষ্ণ পোশাক দিয়ে পাশে দাঁড়ান।"},{"id":10,"title":"চট্টগ্রাম উপকূলীয় সহায়তা","image":"https://i.ibb.co.com/MhvhS31/Downloader-La-595837.webp","description":"চট্টগ্রামের উপকূলীয় অঞ্চলের মানুষের জন্য শীতবস্ত্র সহায়তা দিন।","status":"চলমান","contactInfo":"alahsanfoundationbangladesh@gmail.com","division":"চট্টগ্রাম","current_funds":30000,"goal":50000,"progress":60,"secondary_description":"চট্টগ্রামের উপকূলীয় এলাকার মানুষের জন্য শীতবস্ত্র সংগ্রহ ও বিতরণে এই উদ্যোগ কাজ করে। স্থানীয় মানুষের প্রয়োজন বুঝে স্বেচ্ছাসেবীরা সহায়তা পৌঁছে দেন।"}]'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;
