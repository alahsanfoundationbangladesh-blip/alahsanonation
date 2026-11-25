import { Link } from "react-router-dom";
import { useBranding } from "../context/BrandingContext";
import {
  isPunctuationOnly,
  formatMissionContent,
} from "../utils/textFormatters";
import "../index.css";

const About = () => {
  const { settings } = useBranding();
  const about = settings.about || {};

  // 1. Title: cleanly fallback if title is empty or punctuation-only like ",,"
  const rawTitle = settings.overviewTitle;
  const title =
    !rawTitle || isPunctuationOnly(rawTitle)
      ? about.missionTitle || `${settings.siteName} সম্পর্কে`
      : rawTitle;

  // 2. Button text & link
  const buttonText = settings.overviewButtonText || "আমাদের কার্যক্রম দেখুন";
  const buttonLink = settings.overviewButtonLink || "/campaigns";

  // 3. Text content: fallback from overview to about.missionText1 to default
  let rawText = settings.overview;
  if (!rawText || isPunctuationOnly(rawText)) {
    rawText = about.missionText1 || "";
  }
  if (!rawText || isPunctuationOnly(rawText)) {
    rawText =
      "আল-আহসান ফাউন্ডেশন বাংলাদেশ হলো একটি অলাভজনক ও জনকল্যাণমূলক সংস্থা, যার মূল লক্ষ্য মানবতার সেবা করা এবং সুবিধাবঞ্চিত মানুষের জীবনমান উন্নয়নে কাজ করা।\n\n• অসহায় ও সুবিধাবঞ্চিতদের পাশে দাঁড়ানো: এতিম, অবহেলিত ও দরিদ্র মানুষের মৌলিক অধিকার নিশ্চিত করা এবং তাদের আত্মমর্যাদা রক্ষা করা।\n• শিক্ষা ও মানবিক সহায়তা: দরিদ্র শিক্ষার্থীদের শিক্ষা সহায়তা দেওয়া, অসহায়দের খাদ্য ও শীতবস্ত্র বিতরণ, চিকিৎসা সেবা প্রদান, বিশুদ্ধ পানির ব্যবস্থা এবং দুর্যোগে জরুরি ত্রাণ কার্যক্রম পরিচালনা করা।\n• ডিজিটাল ও প্রযুক্তিগত উদ্যোগ: আধুনিক প্রযুক্তি ও এআই সহায়ক প্ল্যাটফর্ম ব্যবহার করে মানুষের দৈনন্দিন কাজ, শিক্ষা ও গবেষণাকে আরও সহজতর করা।";
  }

  const { intro, items } = formatMissionContent(rawText);

  return (
    <div
      className="card my-12 bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-9 lg:p-12 border border-gray-100 shadow-sm transition-all duration-300"
      data-aos="fade-up"
    >
      <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
        <div>
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full mb-3">
            আমাদের লক্ষ্য ও পরিচিতি
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            {title}
          </h2>
        </div>

        {intro && (
          <p className="text-gray-700 leading-relaxed text-base lg:text-lg whitespace-pre-line bg-sky-50/40 p-4 sm:p-5 rounded-2xl border border-sky-100/60">
            {intro}
          </p>
        )}

        {items.length > 0 && (
          <div className="grid gap-3.5 my-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl bg-gray-50/70 border border-gray-100/80 transition-all hover:bg-sky-50/50 hover:border-sky-100"
              >
                <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary shrink-0 ring-4 ring-primary/20" />
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                  {item.title && (
                    <strong className="text-gray-900 font-semibold">
                      {item.title}:{" "}
                    </strong>
                  )}
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="card-actions pt-3">
          <Link
            to={buttonLink}
            className="btn bg-gradient-to-r from-[#1da1f2] to-[#0e71c8] text-white hover:opacity-90 shadow-md border-none px-8 text-base font-medium rounded-xl"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
