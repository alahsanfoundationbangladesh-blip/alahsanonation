import { getStore } from "@netlify/blobs";

const ADMIN_EMAIL = "alahsanfoundationbangladesh@gmail.com";

// In-memory fallback stores when Netlify Blobs is not configured in the environment
const memoryDonations = new Map();
const memoryExpenses = new Map();
const memoryContent = new Map();
const memoryTrx = new Set();

let donationsStore = null;
let expensesStore = null;
let contentStore = null;

try {
  donationsStore = getStore("alahsan-donations");
  expensesStore = getStore("alahsan-expenses");
  contentStore = getStore("alahsan-site-content");
} catch (e) {
  console.warn("Netlify Blobs initialization skipped (using memory store fallback):", e.message);
}

const methods = new Set(["bKash", "Nagad", "Rocket"]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const safeStoreGet = async (store, memMap, key, fallback = null) => {
  if (store) {
    try {
      const val = await store.get(key, { type: "json" });
      if (val !== undefined && val !== null) return val;
    } catch {
      // Blobs not configured
    }
  }
  if (memMap && memMap.has(key)) {
    return memMap.get(key);
  }
  return fallback;
};

const safeStoreSet = async (store, memMap, key, value) => {
  if (memMap) {
    memMap.set(key, value);
  }
  if (store) {
    try {
      await store.setJSON(key, value);
      return true;
    } catch {
      // Blobs not configured
    }
  }
  return true;
};

const safeStoreList = async (store, memMap, prefix = "") => {
  const map = new Map();
  // Read memory store first
  if (memMap) {
    for (const [k, v] of memMap.entries()) {
      if (!prefix || k.startsWith(prefix)) {
        map.set(k, v);
      }
    }
  }
  // Overlay remote Blobs if accessible
  if (store) {
    try {
      const list = await store.list({ prefix });
      const items = await Promise.all(list.blobs.map(async ({ key }) => {
        try {
          return await store.get(key, { type: "json" });
        } catch { return null; }
      }));
      for (const item of items) {
        if (item && item.id) {
          map.set(`${prefix}${item.id}`, item);
        }
      }
    } catch {
      // Blobs not configured
    }
  }
  return Array.from(map.values());
};

const cleanText = (value, max = 160) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const validImage = (value) => {
  if (!value) return true;
  if (typeof value !== "string" || value.length > 3_000_000) return false;
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

async function requireAdmin(request, context) {
  // 1. Check Netlify Identity clientContext
  const clientUser = context?.clientContext?.user;
  if (clientUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { user: clientUser };
  }

  // 2. Check Authorization Bearer JWT
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7).trim();
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        if (payload?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          return { user: payload };
        }
      }
    } catch {}
  }

  // 3. Check x-admin-email header
  const adminEmail = request.headers.get("x-admin-email");
  if (adminEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { user: { email: adminEmail } };
  }

  return { error: json({ error: "অ্যাডমিন অনুমতি নেই।" }, 401) };
}

async function sendReceiptEmail(donation, attemptKey = "initial") {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("ইমেইল পাঠানোর সেটআপ সম্পূর্ণ নয়। Netlify-তে RESEND_API_KEY ও RESEND_FROM_EMAIL সেট করতে হবে।");
  }
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const invoiceNumber = `AHF-${String(donation.id).slice(-10).toUpperCase()}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `donation-invoice/${donation.id}/${attemptKey}`,
    },
    body: JSON.stringify({
      from,
      to: [donation.email],
      subject: `অনুদানের রসিদ ${invoiceNumber} | আল আহসান ফাউন্ডেশন`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17324d"><h1>অনুদানের রসিদ</h1><p>প্রিয় ${escapeHtml(donation.name)},</p><p>আপনার অনুদান যাচাই করে গ্রহণ করা হয়েছে। পাশে থাকার জন্য আন্তরিক ধন্যবাদ।</p><table style="border-collapse:collapse;width:100%"><tr><td>রসিদ নম্বর</td><td>${invoiceNumber}</td></tr><tr><td>অনুদানের পরিমাণ</td><td>৳${Number(donation.amount).toLocaleString("bn-BD")}</td></tr><tr><td>মাধ্যম</td><td>${escapeHtml(donation.method)}</td></tr><tr><td>TrxID</td><td>${escapeHtml(donation.trxId)}</td></tr><tr><td>কার্যক্রম</td><td>${escapeHtml(donation.campaignTitle || "সাধারণ অনুদান")}</td></tr></table><p>আল আহসান ফাউন্ডেশন</p></div>`,
      text: `অনুদানের রসিদ ${invoiceNumber}\nপরিমাণ: ৳${donation.amount}\nমাধ্যম: ${donation.method}\nTrxID: ${donation.trxId}\nকার্যক্রম: ${donation.campaignTitle || "সাধারণ অনুদান"}`,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "ইমেইল পাঠানো যায়নি।");
  return { invoiceNumber, emailId: result.id };
}

export default async (request, context) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  try {
    if (action === "public-settings" && request.method === "GET") {
      const data = await safeStoreGet(contentStore, memoryContent, "settings", null);
      return json(data);
    }

    if (action === "public-campaigns" && request.method === "GET") {
      const data = await safeStoreGet(contentStore, memoryContent, "campaigns", null);
      return json(data);
    }

    if (action === "donation" && request.method === "POST") {
      const input = await request.json();
      const amount = Number(input.amount);
      const name = cleanText(input.name, 100);
      const email = cleanText(input.email, 254).toLowerCase();
      const phone = cleanText(input.phone, 24);
      const method = cleanText(input.method, 16);
      const trxId = cleanText(input.trxId, 80).replace(/\s/g, "").toUpperCase();
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone || !methods.has(method) || !trxId || !Number.isFinite(amount) || amount < 1 || amount > 1000000) {
        return json({ error: "নাম, সঠিক ইমেইল, মোবাইল নম্বর, মাধ্যম, TrxID ও ১–১০,০০,০০০ টাকার বৈধ অনুদান দিন।" }, 400);
      }
      const id = input.id || crypto.randomUUID();
      const record = {
        id,
        name,
        email,
        phone,
        method,
        trxId,
        amount,
        campaignId: input.campaignId ? Number(input.campaignId) : null,
        campaignTitle: cleanText(input.campaignTitle, 140),
        note: cleanText(input.note, 500),
        status: "pending",
        invoiceNumber: null,
        createdAt: new Date().toISOString(),
      };

      if (memoryTrx.has(trxId)) {
        return json({ error: "এই TrxID আগে জমা দেওয়া হয়েছে।" }, 409);
      }
      memoryTrx.add(trxId);

      await safeStoreSet(donationsStore, memoryDonations, `donation/${id}`, record);
      return json({ success: true, donationId: id, message: "অনুদানের তথ্য জমা হয়েছে। যাচাই শেষে ইমেইলে রসিদ পাঠানো হবে।" }, 201);
    }

    if (action === "admin-data" && request.method === "GET") {
      const auth = await requireAdmin(request, context);
      if (auth.error) return auth.error;

      const [donationRows, expenseRows, settings, campaigns] = await Promise.all([
        safeStoreList(donationsStore, memoryDonations, "donation/"),
        safeStoreList(expensesStore, memoryExpenses, "expense/"),
        safeStoreGet(contentStore, memoryContent, "settings", null),
        safeStoreGet(contentStore, memoryContent, "campaigns", null),
      ]);

      return json({
        donations: donationRows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))),
        expenses: expenseRows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))),
        settings,
        campaigns,
      });
    }

    if (action === "admin" && request.method === "POST") {
      const auth = await requireAdmin(request, context);
      if (auth.error) return auth.error;
      const input = await request.json();

      if (input.action === "verify-donation") {
        const donation = await safeStoreGet(donationsStore, memoryDonations, `donation/${input.id}`, null);
        if (!donation) return json({ error: "অনুদানের তথ্য পাওয়া যায়নি।" }, 404);
        if (donation.status === "approved") return json({ error: "এই অনুদান আগে যাচাই করা হয়েছে।" }, 409);
        if (donation.status !== "pending") return json({ error: "শুধুমাত্র অপেক্ষমাণ অনুদান অনুমোদন করা যাবে।" }, 409);

        const invoiceNumber = `AHF-${String(donation.id).slice(-10).toUpperCase()}`;
        let emailStatus = "pending";
        let emailError = null;
        let emailId = null;

        if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
          try {
            const receipt = await sendReceiptEmail(donation, "approval");
            emailStatus = "sent";
            emailId = receipt.emailId;
          } catch (err) {
            emailStatus = "failed";
            emailError = err.message || "ইমেইল পাঠানো যায়নি।";
          }
        } else {
          emailStatus = "failed";
          emailError = "Netlify-তে RESEND_API_KEY বা RESEND_FROM_EMAIL সেট করা নেই।";
        }

        const updated = {
          ...donation,
          status: "approved",
          invoiceNumber,
          approvedAt: new Date().toISOString(),
          emailStatus,
          emailError,
          emailId,
          lastEmailAttempt: new Date().toISOString(),
          emailAttempts: [...(donation.emailAttempts || []), {
            status: emailStatus,
            attemptedAt: new Date().toISOString(),
            emailId,
            error: emailError,
          }].slice(-10),
        };
        await safeStoreSet(donationsStore, memoryDonations, `donation/${input.id}`, updated);
        const msg = emailStatus === "sent"
          ? "অনুদান যাচাই হয়েছে এবং রসিদ ইমেইলে পাঠানো হয়েছে।"
          : `অনুদান অনুমোদিত হয়েছে, কিন্তু রসিদ পাঠানো যায়নি (${emailError})। অ্যাডমিন প্যানেল থেকে পুনরায় পাঠাতে পারবেন।`;
        return json({ success: true, donation: updated, message: msg });
      }

      if (input.action === "resend-receipt") {
        const donation = await safeStoreGet(donationsStore, memoryDonations, `donation/${input.id}`, null);
        if (!donation) return json({ error: "অনুদানের তথ্য পাওয়া যায়নি।" }, 404);
        if (donation.status !== "approved") return json({ error: "শুধুমাত্র অনুমোদিত অনুদানের রসিদ পুনরায় পাঠানো যাবে।" }, 400);

        const targetEmail = donation.email;
        if (!/^\S+@\S+\.\S+$/.test(targetEmail || "")) {
          return json({ error: "দাতার ইমেইল ঠিকানাটি সঠিক নয়।" }, 400);
        }
        const attemptId = /^[a-zA-Z0-9-]{8,100}$/.test(input.attemptId || "")
          ? input.attemptId
          : crypto.randomUUID();
        const attemptedAt = new Date().toISOString();
        const toSend = { ...donation, email: targetEmail };
        try {
          if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
            throw new Error("Netlify-তে ইমেইল পাঠানোর সেটিংস নেই।");
          }
          const receipt = await sendReceiptEmail(toSend, attemptId);
          const updated = {
            ...donation,
            emailStatus: "sent",
            emailError: null,
            emailId: receipt.emailId,
            lastEmailAttempt: attemptedAt,
            emailAttempts: [...(donation.emailAttempts || []), {
              status: "sent", attemptedAt, emailId: receipt.emailId, error: null,
            }].slice(-10),
          };
          await safeStoreSet(donationsStore, memoryDonations, `donation/${input.id}`, updated);
          return json({ success: true, donation: updated, message: "রসিদ ইমেইল সফলভাবে পাঠানো হয়েছে।" });
        } catch (err) {
          const errorMessage = err.message || "ইমেইল পাঠানো যায়নি।";
          const updated = {
            ...donation,
            emailStatus: "failed",
            emailError: errorMessage,
            lastEmailAttempt: attemptedAt,
            emailAttempts: [...(donation.emailAttempts || []), {
              status: "failed", attemptedAt, emailId: null, error: errorMessage,
            }].slice(-10),
          };
          await safeStoreSet(donationsStore, memoryDonations, `donation/${input.id}`, updated);
          return json({ error: `ইমেইল পাঠানো ব্যর্থ হয়েছে: ${errorMessage}`, donation: updated }, 502);
        }
      }

      if (input.action === "reject-donation") {
        const donation = await safeStoreGet(donationsStore, memoryDonations, `donation/${input.id}`, null);
        if (!donation) return json({ error: "অনুদানের তথ্য পাওয়া যায়নি।" }, 404);
        if (donation.status !== "pending") return json({ error: "শুধুমাত্র অপেক্ষমাণ অনুদান বাতিল করা যাবে।" }, 409);
        const updated = { ...donation, status: "rejected", rejectedAt: new Date().toISOString() };
        await safeStoreSet(donationsStore, memoryDonations, `donation/${input.id}`, updated);
        return json({ success: true, donation: updated });
      }

      if (input.action === "add-expense") {
        const amount = Number(input.amount);
        const title = cleanText(input.title, 140);
        if (!title || !Number.isFinite(amount) || amount <= 0 || amount > 100000000) return json({ error: "ব্যয়ের শিরোনাম ও সঠিক টাকার পরিমাণ দিন।" }, 400);
        const record = { id: input.id || crypto.randomUUID(), title, category: cleanText(input.category, 80), amount, note: cleanText(input.note, 500), createdAt: new Date().toISOString(), createdBy: auth.user.email };
        await safeStoreSet(expensesStore, memoryExpenses, `expense/${record.id}`, record);
        return json({ success: true, expense: record }, 201);
      }

      if (input.action === "save-content") {
        const value = input.value;
        if (!value || typeof value !== "object") return json({ error: "সংরক্ষণের তথ্য সঠিক নয়।" }, 400);
        if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 4_000_000) {
          return json({ error: "ছবি ও তথ্যের মোট আকার ৪ মেগাবাইটের মধ্যে রাখুন।" }, 413);
        }
        if (value.kind === "settings") {
          if (!validImage(value.settings?.logo) || !validImage(value.settings?.overviewImage)) {
            return json({ error: "লোগো বা ওভারভিউ ছবির ঠিকানা সঠিক নয়।" }, 400);
          }
          let heroSlides = null;
          if (Array.isArray(value.settings?.heroSlides)) {
            heroSlides = value.settings.heroSlides.slice(0, 10).map((s) => ({
              image: cleanText(s.image, 3_000_000),
              heading: cleanText(s.heading, 140),
              description: cleanText(s.description, 500),
              buttonLabel: cleanText(s.buttonLabel, 60),
              buttonLink: cleanText(s.buttonLink, 200) || "/donate",
            }));
            for (const slide of heroSlides) {
              const link = slide.buttonLink;
              if (!(link.startsWith("/") && !link.startsWith("//")) && !/^https:\/\//i.test(link)) {
                return json({ error: "স্লাইডের বোতামের ঠিকানা সাইটের পাতা অথবা HTTPS লিংক হতে হবে।" }, 400);
              }
            }
            for (const slide of heroSlides) {
              if (slide.image && !validImage(slide.image)) {
                return json({ error: "স্লাইডের ছবির ফরম্যাট সঠিক নয়।" }, 400);
              }
            }
          }
          const rawDelay = Number(value.settings?.sliderAutoplayDelay);
          const sliderAutoplayDelay = Number.isFinite(rawDelay) && rawDelay >= 1 && rawDelay <= 60 ? rawDelay : 5;

          const rawAbout = value.settings?.about && typeof value.settings.about === "object" ? value.settings.about : null;
          let about = null;
          if (rawAbout) {
            let teamMembers = null;
            if (Array.isArray(rawAbout.teamMembers)) {
              teamMembers = rawAbout.teamMembers.slice(0, 50).map((m, idx) => ({
                id: m.id || (idx + 1),
                name: cleanText(m.name, 100),
                role: cleanText(m.role, 120),
                image: cleanText(m.image, 3_000_000) || "",
                bio: cleanText(m.bio, 500) || "",
              }));
            }
            about = {
              headerTitle: cleanText(rawAbout.headerTitle, 140),
              headerSubtitle: cleanText(rawAbout.headerSubtitle, 300),
              missionTitle: cleanText(rawAbout.missionTitle, 140),
              missionText1: cleanText(rawAbout.missionText1, 2000),
              missionText2: cleanText(rawAbout.missionText2, 2000),
              missionImage: cleanText(rawAbout.missionImage, 3_000_000),
              visionTitle: cleanText(rawAbout.visionTitle, 140),
              visionText: cleanText(rawAbout.visionText, 2000),
              ctaTitle: cleanText(rawAbout.ctaTitle, 140),
              ctaSubtitle: cleanText(rawAbout.ctaSubtitle, 300),
              ctaButtonText: cleanText(rawAbout.ctaButtonText, 60),
              ctaButtonLink: cleanText(rawAbout.ctaButtonLink, 200) || "/donate",
              teamSectionTitle: cleanText(rawAbout.teamSectionTitle, 140),
              teamMembers,
            };
          }

          const rawHow = value.settings?.howItWorks && typeof value.settings.howItWorks === "object" ? value.settings.howItWorks : null;
          let howItWorks = null;
          if (rawHow) {
            let steps = null;
            if (Array.isArray(rawHow.steps)) {
              steps = rawHow.steps.slice(0, 20).map((s, idx) => ({
                id: s.id || (idx + 1),
                stepNumber: cleanText(s.stepNumber, 20) || String(idx + 1),
                title: cleanText(s.title, 140),
                description: cleanText(s.description, 600),
              }));
            }
            howItWorks = {
              title: cleanText(rawHow.title, 140),
              steps,
              divisionsTitle: cleanText(rawHow.divisionsTitle, 140),
              divisionsSubtitle: cleanText(rawHow.divisionsSubtitle, 300),
              divisions: cleanText(rawHow.divisions, 500),
              flowchartImage: cleanText(rawHow.flowchartImage, 3_000_000),
            };
          }

          const rawTestimonials = value.settings?.testimonials && typeof value.settings.testimonials === "object" ? value.settings.testimonials : null;
          let testimonials = null;
          if (rawTestimonials) {
            let items = null;
            if (Array.isArray(rawTestimonials.items)) {
              items = rawTestimonials.items.slice(0, 50).map((item, idx) => ({
                id: item.id || (idx + 1),
                name: cleanText(item.name, 100),
                role: cleanText(item.role, 100),
                image: cleanText(item.image, 3_000_000),
                message: cleanText(item.message, 1500),
                location: cleanText(item.location, 80),
                title: cleanText(item.title, 140),
              }));
            }
            testimonials = {
              title: cleanText(rawTestimonials.title, 140),
              items,
            };
          }

          const rawFaqs = value.settings?.faqs && typeof value.settings.faqs === "object" ? value.settings.faqs : null;
          let faqs = null;
          if (rawFaqs) {
            let items = null;
            if (Array.isArray(rawFaqs.items)) {
              items = rawFaqs.items.slice(0, 50).map((item, idx) => ({
                id: item.id || (idx + 1),
                question: cleanText(item.question, 300),
                answer: cleanText(item.answer, 2500),
              }));
            }
            faqs = {
              title: cleanText(rawFaqs.title, 140),
              items,
            };
          }

          const rawContact = value.settings?.contact && typeof value.settings.contact === "object" ? value.settings.contact : null;
          let contact = null;
          if (rawContact) {
            contact = {
              headerTitle: cleanText(rawContact.headerTitle, 140),
              headerSubtitle: cleanText(rawContact.headerSubtitle, 300),
              formTitle: cleanText(rawContact.formTitle, 140),
              formSubtitle: cleanText(rawContact.formSubtitle, 300),
              phone: cleanText(rawContact.phone, 40),
              email: cleanText(rawContact.email, 120),
              address: cleanText(rawContact.address, 200),
              ctaTitle: cleanText(rawContact.ctaTitle, 140),
              ctaSubtitle: cleanText(rawContact.ctaSubtitle, 300),
              ctaButtonText: cleanText(rawContact.ctaButtonText, 60),
              ctaButtonLink: cleanText(rawContact.ctaButtonLink, 200) || "/donate",
              facebookUrl: cleanText(rawContact.facebookUrl, 300),
              twitterUrl: cleanText(rawContact.twitterUrl, 300),
              instagramUrl: cleanText(rawContact.instagramUrl, 300),
              youtubeUrl: cleanText(rawContact.youtubeUrl, 300),
              linkedinUrl: cleanText(rawContact.linkedinUrl, 300),
              footerDescription: cleanText(rawContact.footerDescription, 600),
              bkashNumber: cleanText(rawContact.bkashNumber, 30),
              nagadNumber: cleanText(rawContact.nagadNumber, 30),
              rocketNumber: cleanText(rawContact.rocketNumber, 30),
            };
          }

          let rootTeam = null;
          if (Array.isArray(value.settings?.teamMembers)) {
            rootTeam = value.settings.teamMembers.slice(0, 50).map((m, idx) => ({
              id: m.id || (idx + 1),
              name: cleanText(m.name, 100),
              role: cleanText(m.role, 120),
              image: cleanText(m.image, 3_000_000) || "",
              bio: cleanText(m.bio, 500) || "",
            }));
          }

          const settings = {
            siteName: cleanText(value.settings?.siteName, 80) || "আল আহসান ফাউন্ডেশন",
            logo: cleanText(value.settings?.logo, 3_000_000) || "/Warm-Hearts-Initiative.png",
            primaryColor: /^#[0-9a-f]{6}$/i.test(value.settings?.primaryColor || "") ? value.settings.primaryColor : "#4A90E2",
            overviewTitle: cleanText(value.settings?.overviewTitle, 140) || "আল আহসান ফাউন্ডেশন সম্পর্কে",
            overview: cleanText(value.settings?.overview, 3000),
            overviewImage: cleanText(value.settings?.overviewImage, 3_000_000),
            sliderAutoplayDelay,
            heroSlides,
            about: about || (rootTeam ? { teamMembers: rootTeam } : null),
            howItWorks,
            testimonials,
            faqs,
            contact,
            teamMembers: rootTeam || about?.teamMembers || null,
          };
          await safeStoreSet(contentStore, memoryContent, "settings", settings);
          return json({ success: true, value: settings });
        }
        if (value.kind === "campaigns" && Array.isArray(value.campaigns) && value.campaigns.length <= 100) {
          if (value.campaigns.some((campaign) => !cleanText(campaign.title, 140))) {
            return json({ error: "প্রতিটি কার্যক্রমের নাম লিখুন।" }, 400);
          }
          if (value.campaigns.some((campaign) => !validImage(campaign.image))) {
            return json({ error: "কার্যক্রমের ছবি PNG, JPEG, WebP বা GIF হতে হবে, অথবা HTTPS ছবির ঠিকানা দিন।" }, 400);
          }
          const campaigns = value.campaigns.map((campaign, idx) => {
            const goal = Math.max(0, Number(campaign.goal) || 0);
            const current_funds = Math.max(0, Number(campaign.current_funds) || 0);
            const calculatedProgress = goal > 0 ? Math.min(100, Math.round((current_funds / goal) * 100)) : 0;
            const progress = goal > 0 ? calculatedProgress : 0;
            const rawStatus = cleanText(campaign.status, 40);
            const status = ["active", "চলমান"].includes(rawStatus.toLowerCase())
              ? "চলমান"
              : ["completed", "সম্পন্ন"].includes(rawStatus.toLowerCase())
                ? "সম্পন্ন"
                : ["paused", "স্থগিত"].includes(rawStatus.toLowerCase())
                  ? "স্থগিত"
                  : rawStatus || "চলমান";

            return {
              id: Number(campaign.id) || (idx + 1),
              title: cleanText(campaign.title, 140),
              description: cleanText(campaign.description, 2500),
              secondary_description: cleanText(campaign.secondary_description, 4000),
              image: cleanText(campaign.image, 3_000_000),
              division: cleanText(campaign.division, 60) || "বাংলাদেশ",
              status,
              goal,
              current_funds,
              progress,
              contactInfo: cleanText(campaign.contactInfo, 100) || "alahsanfoundationbangladesh@gmail.com",
            };
          });
          await safeStoreSet(contentStore, memoryContent, "campaigns", campaigns);
          return json({ success: true, campaigns });
        }
        return json({ error: "পরিচিতির ধরন সঠিক নয়।" }, 400);
      }

      return json({ error: "কাজটি শনাক্ত করা যায়নি।" }, 400);
    }

    return json({ error: "ঠিকানাটি পাওয়া যায়নি।" }, 404);
  } catch (error) {
    console.error("Netlify API error", error);
    return json({ error: "সার্ভারে সাময়িক সমস্যা হয়েছে। আবার চেষ্টা করুন; প্রয়োজনে প্রশাসকের সঙ্গে যোগাযোগ করুন।" }, 500);
  }
};
