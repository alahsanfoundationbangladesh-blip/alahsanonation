import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useBranding } from "../context/BrandingContext";
import { resolveMissionPhoto, formatMissionContent } from "../utils/textFormatters";

const AboutUs = () => {
  const { settings } = useBranding();
  const about = settings.about || {};
  const teamMembers = Array.isArray(about.teamMembers) && about.teamMembers.length > 0
    ? about.teamMembers
    : (Array.isArray(settings.teamMembers) ? settings.teamMembers : []);

  const rawMission = about.missionText1 || settings.overview || "আল-আহসান ফাউন্ডেশন বাংলাদেশ হলো একটি অলাভজনক ও জনকল্যাণমূলক সংস্থা, যার মূল লক্ষ্য মানবতার সেবা করা এবং সুবিধাবঞ্চিত মানুষের জীবনমান উন্নয়নে কাজ করা।\n\n• অসহায় ও সুবিধাবঞ্চিতদের পাশে দাঁড়ানো: এতিম, অবহেলিত ও দরিদ্র মানুষের মৌলিক অধিকার নিশ্চিত করা এবং তাদের আত্মমর্যাদা রক্ষা করা।\n• শিক্ষা ও মানবিক সহায়তা: দরিদ্র শিক্ষার্থীদের শিক্ষা সহায়তা দেওয়া, অসহায়দের খাদ্য ও শীতবস্ত্র বিতরণ, চিকিৎসা সেবা প্রদান, বিশুদ্ধ পানির ব্যবস্থা এবং দুর্যোগে জরুরি ত্রাণ কার্যক্রম পরিচালনা করা।\n• ডিজিটাল ও প্রযুক্তিগত উদ্যোগ: আধুনিক প্রযুক্তি ও এআই সহায়ক প্ল্যাটফর্ম ব্যবহার করে মানুষের দৈনন্দিন কাজ, শিক্ষা ও গবেষণাকে আরও সহজতর করা।";
  const { intro, items } = formatMissionContent(rawMission);
  const missionPhoto = resolveMissionPhoto(about.missionImage, settings.overviewImage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet><title>{about.headerTitle || "আমাদের সম্পর্কে"} - {settings.siteName}</title></Helmet>

      {/* Header Section */}
      <header className="bg-primary text-white py-10 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold">{about.headerTitle || "আমাদের সম্পর্কে"}</h1>
          <p className="mt-2 text-lg">
            {about.headerSubtitle || "আমাদের লক্ষ্য, স্বপ্ন এবং এই উদ্যোগের পেছনের মানুষদের সম্পর্কে জানুন।"}
          </p>
        </div>
      </header>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-12 scroll-mt-24">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/2">
            <img
              src={missionPhoto}
              alt={about.missionTitle || "আমাদের লক্ষ্য"}
              className="object-cover object-center w-full md:h-[500px] rounded-2xl shadow-sm"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              {about.missionTitle || "আমাদের লক্ষ্য"}
            </h2>
            {intro && (
              <p className="text-gray-600 leading-relaxed text-base lg:text-lg whitespace-pre-line">
                {intro}
              </p>
            )}
            {items.length > 0 && (
              <div className="space-y-3 mt-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
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
            {about.missionText2 && (
              <p className="mt-4 text-gray-600 leading-relaxed">
                {about.missionText2}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-gray-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              {about.visionTitle || "আমাদের স্বপ্ন"}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {about.visionText || "এমন একটি সমাজ গড়ে তোলা, যেখানে প্রত্যেকে প্রয়োজনীয় সহায়তা ও এগিয়ে যাওয়ার সুযোগ পায়। মানুষের মধ্যে দান, সহমর্মিতা এবং টেকসই উন্নয়নের মনোভাব ছড়িয়ে দেওয়াই আমাদের স্বপ্ন।"}
            </p>
          </div>
        </div>
      </section>

      {/* Team / Executive Committee Section */}
      <section className="container mx-auto px-4 py-12 scroll-mt-24">
        <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">
          {about.teamSectionTitle || "আমাদের দলের সঙ্গে পরিচিত হোন"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {teamMembers.map((member, idx) => (
            <div key={member.id || idx} className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow transition-shadow">
              <img
                src={member.image || "https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg"}
                alt={member.name}
                className="w-28 h-28 mx-auto rounded-full object-cover shadow"
              />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                {member.name}
              </h3>
              <p className="text-primary font-medium text-sm mt-1">{member.role}</p>
              {member.bio && <p className="text-gray-500 text-xs mt-2">{member.bio}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary text-white py-10 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold">{about.ctaTitle || "আজই আমাদের সঙ্গে যুক্ত হোন"}</h2>
          <p className="mt-2 text-lg">
            {about.ctaSubtitle || "এই উদ্যোগের অংশ হয়ে মানুষের জীবনে ইতিবাচক পরিবর্তন আনুন।"}
          </p>
          <Link
            to={about.ctaButtonLink || "/donate"}
            className="btn mt-4 px-6 py-3 bg-white text-primary rounded-lg shadow hover:bg-gray-100"
          >
            {about.ctaButtonText || "অংশ নিন"}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
