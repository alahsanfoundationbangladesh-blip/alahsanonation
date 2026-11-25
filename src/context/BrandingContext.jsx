/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import localforage from "localforage";
import { getApiUrl } from "../utils/apiConfig";

export const DEFAULT_SLIDES = [
  {
    id: 1,
    image: "https://i.ibb.co/Wy1D8Np/DALL-E-2024-11-19-04-43-42-A-volunteer-warmly-wrapping-a-child-in-a-cozy-blanket-during-winter-surro.webp",
    heading: "সবার জন্য উষ্ণতা",
    description: "শীতবস্ত্র পেয়ে পরিবারগুলোতে ছড়িয়ে পড়ছে উষ্ণতা ও আশার আলো।",
    buttonLabel: "এখনই অনুদান দিন",
    buttonLink: "/donate",
  },
  {
    id: 2,
    image: "https://i.ibb.co.com/KjC0cVX/DALL-E-2024-11-19-05-13-31-A-heartwarming-scene-of-volunteers-distributing-warm-winter-clothing-to-p.webp",
    heading: "একসঙ্গে আমরা পরিবর্তন আনতে পারি",
    description: "এই শীতে প্রয়োজনমতো মানুষের হাতে শীতবস্ত্র তুলে দিচ্ছেন স্বেচ্ছাসেবীরা।",
    buttonLabel: "কার্যক্রম দেখুন",
    buttonLink: "/campaigns",
  },
  {
    id: 3,
    image: "https://i.ibb.co.com/L5mK6Vs/DALL-E-2024-11-19-05-15-26-A-touching-scene-of-a-child-smiling-joyfully-as-they-receive-warm-winter.webp",
    heading: "প্রতিটি সদয় উদ্যোগই মূল্যবান",
    description: "উষ্ণ পোশাক পেয়ে হাসছে একটি শিশু।",
    buttonLabel: "অংশ নিন",
    buttonLink: "/campaigns",
  },
  {
    id: 4,
    image: "https://i.ibb.co.com/cwxPF9M/DALL-E-2024-11-19-05-17-07-A-highly-realistic-and-heartwarming-scene-of-people-from-diverse-backgrou.webp",
    heading: "আমাদের উদ্যোগে যুক্ত হোন",
    description: "একসঙ্গে আমরা গড়ছি উজ্জ্বল ও উষ্ণ ভবিষ্যৎ।",
    buttonLabel: "সহায়তা করুন",
    buttonLink: "/how-to-help",
  },
];

export const DEFAULT_TEAM = [
  {
    id: 1,
    name: "আব্দুল জব্বার আল নাহিদ",
    role: "প্রতিষ্ঠাতা ও নির্বাহী পরিচালক",
    image: "https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg",
    bio: "আল আহসান ফাউন্ডেশনের প্রতিষ্ঠাতা ও প্রধান নির্বাহী।",
  },
  {
    id: 2,
    name: "মুফতি মুহিউস সুন্নাহ",
    role: "প্রধান উপদেষ্টা",
    image: "https://i.ibb.co.com/xLVb14x/website-photos-2.webp",
    bio: "উপদেষ্টা পরিষদ প্রধান ও মানবিক কার্যক্রম সমন্বয়ক।",
  },
  {
    id: 3,
    name: "মো. শামীম এহসান",
    role: "সমন্বয়ক ও প্রশাসন",
    image: "https://i.ibb.co.com/nsgmKpH/Shamsh-Hadi.jpg",
    bio: "মাঠ পর্যায় ও ভলান্টিয়ার সমন্বয় প্রধান।",
  },
];

export const DEFAULT_ABOUT = {
  headerTitle: "আমাদের সম্পর্কে",
  headerSubtitle: "আমাদের লক্ষ্য, স্বপ্ন এবং এই উদ্যোগের পেছনের মানুষদের সম্পর্কে জানুন।",
  missionTitle: "আমাদের লক্ষ্য",
  missionText1: "এর লক্ষ্য হলো শীতবস্ত্র ও প্রয়োজনীয় সহায়তা পৌঁছে দিয়ে অসহায় মানুষের পাশে দাঁড়ানো এবং সবাইকে মানবিক কাজে অংশ নেওয়ার সুযোগ করে দেওয়া।",
  missionText2: "আমরা বিশ্বাস করি, সহমর্মিতা ও সম্মিলিত উদ্যোগ মানুষের জীবনে ইতিবাচক পরিবর্তন আনে। শিক্ষা, স্বাস্থ্যসেবা কিংবা নিত্যপ্রয়োজনীয় সহায়তা—প্রতিটি অবদানই মূল্যবান।",
  missionImage: "https://i.ibb.co.com/hFKT7MM/pexels-photo-6995106.webp",
  visionTitle: "আমাদের স্বপ্ন",
  visionText: "এমন একটি সমাজ গড়ে তোলা, যেখানে প্রত্যেকে প্রয়োজনীয় সহায়তা ও এগিয়ে যাওয়ার সুযোগ পায়। মানুষের মধ্যে দান, সহমর্মিতা এবং টেকসই উন্নয়নের মনোভাব ছড়িয়ে দেওয়াই আমাদের স্বপ্ন।",
  ctaTitle: "আজই আমাদের সঙ্গে যুক্ত হোন",
  ctaSubtitle: "এই উদ্যোগের অংশ হয়ে মানুষের জীবনে ইতিবাচক পরিবর্তন আনুন।",
  ctaButtonText: "অংশ নিন",
  ctaButtonLink: "/donate",
  teamSectionTitle: "আমাদের দলের সঙ্গে পরিচিত হোন",
  teamMembers: DEFAULT_TEAM,
};

export const DEFAULT_HOW_IT_WORKS = {
  title: "যেভাবে কাজ করে",
  steps: [
    {
      id: 1,
      stepNumber: "১",
      title: "কার্যক্রম দেখুন",
      description: "আপনার এলাকার চলমান অনুদান কার্যক্রম দেখুন এবং কীভাবে সহায়তা করবেন জানুন।",
    },
    {
      id: 2,
      stepNumber: "২",
      title: "অনুদানের সামগ্রী বেছে নিন",
      description: "অনুদানের জন্য কম্বল, জ্যাকেট ও সোয়েটারের মতো শীতবস্ত্র বেছে নিন।",
    },
    {
      id: 3,
      stepNumber: "৩",
      title: "অনুদান ফর্ম পূরণ করুন",
      description: "আপনার কাছ থেকে সংগ্রহের ঠিকানা জানান অথবা নিকটস্থ জমাদানের স্থান খুঁজুন।",
    },
    {
      id: 4,
      stepNumber: "৪",
      title: "উষ্ণতা ছড়িয়ে দিন",
      description: "স্বেচ্ছাসেবীরা অনুদান প্রয়োজনীয় মানুষের কাছে পৌঁছে দেবেন।",
    },
  ],
  divisionsTitle: "কার্যক্রমের বিভাগ",
  divisionsSubtitle: "বর্তমানে আমরা নিচের বিভাগগুলোতে কাজ করছি:",
  divisions: "ঢাকা, চট্টগ্রাম, সিলেট, খুলনা, রাজশাহী, বরিশাল, রংপুর, ময়মনসিংহ",
  flowchartImage: "/flowchart-bangla.svg",
};

export const DEFAULT_TESTIMONIALS = {
  title: "মানুষের অভিজ্ঞতা",
  items: [
    {
      id: 1,
      name: "আব্দুল জব্বার আল নাহিদ",
      role: "উপকারভোগী",
      image: "https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg",
      message:
        "শীতের সবচেয়ে কঠিন সময়ে আমরা জ্যাকেট ও কম্বল পেয়েছি। এই সহায়তা আমাদের পরিবারকে উষ্ণতা ও স্বস্তি দিয়েছে। আপনাদের সদয় উদ্যোগের জন্য ধন্যবাদ!",
      location: "সিলেট",
      title: "শীতকালীন সহায়তা বিতরণ",
    },
    {
      id: 2,
      name: "রহিম উদ্দিন",
      role: "স্বেচ্ছাসেবক",
      image: "https://i.ibb.co.com/931fDV3/pexels-photo-749091.webp",
      message:
        "খুলনায় কম্বল বিতরণের অভিজ্ঞতা আমার মনে থাকবে। মানুষের আনন্দ ও কৃতজ্ঞতা দেখে সব পরিশ্রম সার্থক মনে হয়েছে।",
      location: "খুলনা",
      title: "শীতকালীন সহায়তায় হাসি",
    },
    {
      id: 3,
      name: "আয়েশা খাতুন",
      role: "উপকারভোগী",
      image: "https://i.ibb.co.com/tZc6dPW/pexels-1844773-3426975.webp",
      message:
        "এই উদ্যোগের সহায়তায় শীতের কঠিন সময়ে আমার সন্তানেরা উষ্ণ ও নিরাপদ ছিল। এমন সহায়তার জন্য আমরা কৃতজ্ঞ।",
      location: "ঢাকা",
      title: "পরিবারের পাশে উষ্ণ সহায়তা",
    },
    {
      id: 4,
      name: "করিম আলী",
      role: "স্বেচ্ছাসেবক",
      image: "https://i.ibb.co.com/B67Ggd1/pexels-photo-7562076.webp",
      message:
        "এমন মানবিক কাজে যুক্ত হতে পেরে আমি আনন্দিত। কঠিন সময়ে চট্টগ্রামের মানুষের পাশে দাঁড়িয়ে সমাজকে ফিরিয়ে দেওয়ার মূল্য বুঝেছি।",
      location: "চট্টগ্রাম",
      title: "চট্টগ্রামে মানুষের পাশে",
    },
  ],
};

export const DEFAULT_FAQS = {
  title: "সাধারণ জিজ্ঞাসা",
  items: [
    {
      id: 1,
      question: "আপনাদের কার্যক্রম কীভাবে কাজ করে?",
      answer: "কার্যক্রমের তালিকা থেকে আপনার পছন্দের উদ্যোগ বেছে নিন। অর্থ অনুদানের ক্ষেত্রে বিকাশ, নগদ বা রকেটে টাকা পাঠিয়ে TrxID জমা দিন; সামগ্রী দিতে চাইলে কার্যক্রমের পাতায় বিস্তারিত দেখুন।",
    },
    {
      id: 2,
      question: "এই প্ল্যাটফর্ম ব্যবহার করতে কি কোনো ফি লাগে?",
      answer: "ওয়েবসাইটে কার্যক্রম দেখা ও অনুদানের তথ্য জমা দিতে কোনো সেবা ফি নেই। মোবাইল আর্থিক সেবাদাতার নিজস্ব লেনদেন ফি প্রযোজ্য হতে পারে।",
    },
    {
      id: 3,
      question: "সহায়তা প্রয়োজন হলে কী করব?",
      answer: "কোনো সহায়তা লাগলে যোগাযোগ পাতায় দেওয়া ইমেইল বা ফোন নম্বরে আমাদের সঙ্গে যোগাযোগ করুন।",
    },
    {
      id: 4,
      question: "অনুরোধ জমা দেওয়ার পর কি বাতিল করা যাবে?",
      answer: "অনুদানের তথ্য জমা দেওয়ার পর তা যাচাইয়ের আগে সংশোধন বা বাতিলের অনুরোধ করতে আমাদের সঙ্গে যোগাযোগ করুন। যাচাই হয়ে গেলে অনুদানের রসিদ তৈরি হতে পারে।",
    },
    {
      id: 5,
      question: "আপনারা কী ধরনের সহায়তা দেন?",
      answer: "আমরা শীতবস্ত্র বিতরণ, মানবিক সহায়তা এবং অনুদান কার্যক্রম পরিচালনা করি। চলমান কার্যক্রমের পাতায় বর্তমান উদ্যোগগুলো দেখুন।",
    },
  ],
};

export const DEFAULT_CONTACT = {
  headerTitle: "যোগাযোগ",
  headerSubtitle: "আপনার প্রশ্ন বা মতামত জানাতে আমাদের সঙ্গে যোগাযোগ করুন।",
  formTitle: "যোগাযোগ করুন",
  formSubtitle: "নিচের ফর্মে আপনার বার্তা লিখুন, আমরা যোগাযোগ করার চেষ্টা করব।",
  phone: "+৮৮০ ১৩১২৫১৫৬৪৩",
  email: "alahsanfoundationbangladesh@gmail.com",
  address: "বাংলাদেশ",
  ctaTitle: "আজই আমাদের সঙ্গে যুক্ত হোন",
  ctaSubtitle: "এই উদ্যোগের অংশ হয়ে মানুষের জীবনে ইতিবাচক পরিবর্তন আনুন।",
  ctaButtonText: "অংশ নিন",
  ctaButtonLink: "/donate",
  facebookUrl: "https://www.facebook.com/abnahidagency",
  twitterUrl: "https://twitter.com/xahid_420",
  instagramUrl: "https://www.instagram.com/abnahidseo",
  youtubeUrl: "",
  linkedinUrl: "",
  footerDescription: "মানবিক সহায়তা ও শীতবস্ত্র বিতরণের মাধ্যমে মানুষের পাশে দাঁড়াই। আমাদের উদ্যোগে যুক্ত হোন।",
  quickLinksTitle: "দ্রুত লিংক",
  contactInfoTitle: "যোগাযোগের ঠিকানা",
  helplineLabel: "হেল্পলাইন",
  copyrightText: "কপিরাইট © 2026 · সর্বস্বত্ব সংরক্ষিত — আল আহসান ফাউন্ডেশন",
  bkashNumber: "8801312515643",
  nagadNumber: "8801312515643",
  rocketNumber: "8801312515643",
  bankDetails: "হিসাবের নাম: আল আহসান ফাউন্ডেশন, ব্যাংক: ইসলামী ব্যাংক বাংলাদেশ লিমিটেড",
};

export const DEFAULT_BRANDING = {
  siteName: "আল আহসান ফাউন্ডেশন",
  logo: "/Warm-Hearts-Initiative.png",
  primaryColor: "#4A90E2",
  overviewTitle: "আল আহসান ফাউন্ডেশন সম্পর্কে",
  overview: "মানবিক সহায়তা ও শীতবস্ত্র বিতরণের মাধ্যমে সুবিধাবঞ্চিত মানুষের পাশে দাঁড়াই।",
  overviewImage: "https://i.ibb.co.com/hFKT7MM/pexels-photo-6995106.webp",
  overviewButtonText: "আমাদের সম্পর্কে আরও জানুন",
  overviewButtonLink: "/about",
  navHomeText: "হোম",
  navCampaignsText: "অনুদান কার্যক্রম",
  navDonateText: "অর্থ অনুদান",
  navHowToHelpText: "কীভাবে সহায়তা করবেন",
  navAboutText: "আমাদের সম্পর্কে",
  navContactText: "যোগাযোগ",
  donatePageTagline: "নিরাপদ ও যাচাইকৃত অনুদান",
  donatePageTitle: "অর্থ অনুদান দিন",
  donatePageSubtitle: "বিকাশ, নগদ অথবা রকেট থেকে অর্থ পাঠিয়ে TrxID দিয়ে অনুদান জমা করুন।",
  donateInstructionsTitle: "টাকা পাঠানোর নম্বর",
  donateInstructionsText: "বিকাশ, নগদ বা রকেট থেকে নিচের নম্বরে টাকা পাঠান। সফল লেনদেনের পর পাওয়া TrxID ফর্মে দিন। অনুদান যাচাই না হওয়া পর্যন্ত এটি অপেক্ষমাণ থাকবে।",
  campaignsPageTitle: "অনুদান কার্যক্রম",
  campaignsPageSubtitle: "চলমান কার্যক্রমগুলো দেখুন এবং প্রয়োজনীয় শীতবস্ত্র ও অর্থ অনুদানের মাধ্যমে পাশে দাঁড়ান।",
  itemDonationTitle: "সামগ্রী অনুদান দিন",
  itemDonationButtonText: "অনুদানের তথ্য জমা দিন",
  campaignOwner: {
    name: "আব্দুল জব্বার আল নাহিদ",
    email: "abnahid24@gmail.com",
    profile_picture: "https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg",
    bio: "আল আহসান ফাউন্ডেশনের প্রতিষ্ঠাতা ও প্রধান নির্বাহী। সুবিধাবঞ্চিত মানুষের পাশে দাঁড়াতে এই প্ল্যাটফর্মের প্রতিটি কার্যক্রমের দায়িত্বশীল তদারকি পরিচালনা করি।",
    facebookUrl: "https://www.facebook.com/abnahidagency",
    linkedinUrl: "https://www.linkedin.com/in/abnahid",
    instagramUrl: "https://www.instagram.com/abnahidseo",
    twitterUrl: "https://twitter.com/xahid_420",
  },
  sliderAutoplayDelay: 5,
  heroSlides: DEFAULT_SLIDES,
  about: DEFAULT_ABOUT,
  howItWorks: DEFAULT_HOW_IT_WORKS,
  testimonials: DEFAULT_TESTIMONIALS,
  faqs: DEFAULT_FAQS,
  contact: DEFAULT_CONTACT,
};

export const STORAGE_KEYS = {
  SETTINGS: "alahsan-branding-settings",
  CAMPAIGNS: "alahsan-campaigns",
  DONATIONS: "alahsan-donations",
  EXPENSES: "alahsan-expenses",
};

const mergeWithDefaults = (parsed) => {
  if (!parsed || typeof parsed !== "object") return DEFAULT_BRANDING;
  return {
    ...DEFAULT_BRANDING,
    ...parsed,
    heroSlides: Array.isArray(parsed.heroSlides) ? parsed.heroSlides : DEFAULT_SLIDES,
    about: {
      ...DEFAULT_ABOUT,
      ...(parsed.about || {}),
      teamMembers: Array.isArray(parsed.about?.teamMembers)
        ? parsed.about.teamMembers
        : (Array.isArray(parsed.teamMembers) ? parsed.teamMembers : DEFAULT_TEAM),
    },
    howItWorks: {
      ...DEFAULT_HOW_IT_WORKS,
      ...(parsed.howItWorks || {}),
      steps: Array.isArray(parsed.howItWorks?.steps) ? parsed.howItWorks.steps : DEFAULT_HOW_IT_WORKS.steps,
    },
    testimonials: {
      ...DEFAULT_TESTIMONIALS,
      ...(parsed.testimonials || {}),
      items: Array.isArray(parsed.testimonials?.items) ? parsed.testimonials.items : DEFAULT_TESTIMONIALS.items,
    },
    faqs: {
      ...DEFAULT_FAQS,
      ...(parsed.faqs || {}),
      items: Array.isArray(parsed.faqs?.items) ? parsed.faqs.items : DEFAULT_FAQS.items,
    },
    contact: {
      ...DEFAULT_CONTACT,
      ...(parsed.contact || {}),
    },
    campaignOwner: {
      name: parsed.campaignOwner?.name || DEFAULT_BRANDING.campaignOwner.name,
      email: parsed.campaignOwner?.email || DEFAULT_BRANDING.campaignOwner.email,
      profile_picture: parsed.campaignOwner?.profile_picture || DEFAULT_BRANDING.campaignOwner.profile_picture,
      bio: parsed.campaignOwner?.bio || DEFAULT_BRANDING.campaignOwner.bio,
      facebookUrl: parsed.campaignOwner?.facebookUrl !== undefined ? parsed.campaignOwner.facebookUrl : DEFAULT_BRANDING.campaignOwner.facebookUrl,
      linkedinUrl: parsed.campaignOwner?.linkedinUrl !== undefined ? parsed.campaignOwner.linkedinUrl : DEFAULT_BRANDING.campaignOwner.linkedinUrl,
      instagramUrl: parsed.campaignOwner?.instagramUrl !== undefined ? parsed.campaignOwner.instagramUrl : DEFAULT_BRANDING.campaignOwner.instagramUrl,
      twitterUrl: parsed.campaignOwner?.twitterUrl !== undefined ? parsed.campaignOwner.twitterUrl : DEFAULT_BRANDING.campaignOwner.twitterUrl,
    },
  };
};

const loadInitialSettings = () => {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeWithDefaults(parsed);
    }
  } catch (e) {
    console.warn("Failed reading saved settings from storage:", e);
  }
  return DEFAULT_BRANDING;
};

const loadInitialCampaigns = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed reading saved campaigns from storage:", e);
  }
  return null;
};

const BrandingContext = createContext(null);

export function BrandingProvider({ children }) {
  const [settings, setSettings] = useState(loadInitialSettings);
  const [campaigns, setCampaigns] = useState(loadInitialCampaigns);

  useEffect(() => {
    let active = true;

    // localForage uses IndexedDB and can store larger images than localStorage.
    localforage.getItem(STORAGE_KEYS.SETTINGS).then((saved) => {
      if (active && saved && typeof saved === "object") {
        setSettings((current) => mergeWithDefaults({ ...current, ...saved }));
      }
    }).catch(() => {});
    localforage.getItem(STORAGE_KEYS.CAMPAIGNS).then((saved) => {
      if (active && Array.isArray(saved)) setCampaigns(saved);
    }).catch(() => {});

    fetch(getApiUrl("public-settings"))
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (active && value && typeof value === "object" && Object.keys(value).length > 0) {
          setSettings((prev) => {
            const next = mergeWithDefaults({ ...prev, ...value });
            try { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next)); } catch { /* ignore */ }
            localforage.setItem(STORAGE_KEYS.SETTINGS, next).catch(() => {});
            return next;
          });
        }
      })
      .catch(() => {});

    fetch(getApiUrl("public-campaigns"))
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (active && Array.isArray(value) && value.length > 0) {
          setCampaigns(value);
          try { localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(value)); } catch { /* ignore */ }
          localforage.setItem(STORAGE_KEYS.CAMPAIGNS, value).catch(() => {});
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--site-primary", settings.primaryColor || "#4A90E2");
    document.documentElement.lang = "bn";
    document.title = settings.siteName || "আল আহসান ফাউন্ডেশন";
  }, [settings.primaryColor, settings.siteName]);

  const saveSettings = async (next) => {
    const merged = mergeWithDefaults(next);

    // Update immediately, then persist locally in both web storage options.
    setSettings(merged);
    try { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged)); } catch (e) {
      console.warn("localStorage quota exceeded or error:", e);
    }
    try { await localforage.setItem(STORAGE_KEYS.SETTINGS, merged); } catch (e) {
      console.warn("IndexedDB save failed:", e);
    }

    // Attempt server sync with authentication
    try {
      let token = "";
      let adminEmail = "alahsanfoundationbangladesh@gmail.com";
      try {
        const sessionRaw = localStorage.getItem("ahf_user_session");
        if (sessionRaw) {
          const sessionObj = JSON.parse(sessionRaw);
          if (sessionObj?.token) token = sessionObj.token;
          if (sessionObj?.email) adminEmail = sessionObj.email;
        }
      } catch { /* ignore malformed local session cache */ }

      const headers = {
        "Content-Type": "application/json",
        "x-admin-email": adminEmail,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl("admin"), {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "save-content", value: { kind: "settings", settings: merged } }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.value) {
          const finalMerged = mergeWithDefaults(result.value);
          setSettings(finalMerged);
          try { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(finalMerged)); } catch { /* ignore */ }
          return { value: finalMerged, persistence: result.persistence || "temporary" };
        }
      }
      const err = await response.json().catch(() => ({}));
      console.warn("Server save-content error:", err);
      return { value: merged, persistence: "local", warning: err.error || "সার্ভারে সংরক্ষণ করা যায়নি।" };
    } catch (error) {
      console.info("Server-side sync skipped or failed; local persistence active.", error);
      return { value: merged, persistence: "local", warning: "সার্ভারের সঙ্গে সংযোগ করা যায়নি।" };
    }
  };

  const saveCampaigns = async (next) => {
    setCampaigns(next);
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(next));
    } catch (e) {
      console.warn("Failed writing campaigns to localStorage:", e);
    }
    try { await localforage.setItem(STORAGE_KEYS.CAMPAIGNS, next); } catch (e) {
      console.warn("IndexedDB campaign save failed:", e);
    }

    try {
      let token = "";
      let adminEmail = "alahsanfoundationbangladesh@gmail.com";
      try {
        const sessionRaw = localStorage.getItem("ahf_user_session");
        if (sessionRaw) {
          const sessionObj = JSON.parse(sessionRaw);
          if (sessionObj?.token) token = sessionObj.token;
          if (sessionObj?.email) adminEmail = sessionObj.email;
        }
      } catch { /* ignore malformed local session cache */ }

      const headers = {
        "Content-Type": "application/json",
        "x-admin-email": adminEmail,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl("admin"), {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "save-content", value: { kind: "campaigns", campaigns: next } }),
      });
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result.campaigns)) {
          setCampaigns(result.campaigns);
          try { localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(result.campaigns)); } catch { /* ignore */ }
          localforage.setItem(STORAGE_KEYS.CAMPAIGNS, result.campaigns).catch(() => {});
          return { value: result.campaigns, persistence: result.persistence || "temporary" };
        }
      }
      const result = await response.json().catch(() => ({}));
      return { value: next, persistence: "local", warning: result.error || "সার্ভারে সংরক্ষণ করা যায়নি।" };
    } catch (error) {
      console.info("Server-side sync skipped or failed; local persistence active.", error);
      return { value: next, persistence: "local", warning: "সার্ভারের সঙ্গে সংযোগ করা যায়নি।" };
    }
  };

  const value = useMemo(() => ({ settings, campaigns, saveSettings, saveCampaigns }), [settings, campaigns]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) throw new Error("useBranding must be used within BrandingProvider");
  return context;
}
