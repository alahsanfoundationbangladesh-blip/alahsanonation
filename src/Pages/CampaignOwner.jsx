import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa6";
import { useBranding } from "../context/BrandingContext";

const CampaignOwner = () => {
  const { settings } = useBranding();

  const owner = settings?.campaignOwner || {
    name: "আব্দুল জব্বার আল নাহিদ",
    email: "nanayeemgamer@gmail.com",
    profile_picture: "https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg",
    bio: "সমাজকল্যাণে কার্যকর অনুদান কার্যক্রম পরিচালনায় নিবেদিত।",
    facebookUrl: "https://www.facebook.com/abnahidagency",
    linkedinUrl: "https://www.linkedin.com/in/ajnahid",
    instagramUrl: "https://www.instagram.com/abnahidseo",
    twitterUrl: "https://twitter.com/xahid_420",
  };

  const volunteer_history = [
    {
      campaign_name: "ঢাকায় শীতকালীন সহায়তা",
      role: "আয়োজক",
      date: "2023-01-10",
    },
    {
      campaign_name: "সিলেট নগর আশ্রয় সহায়তা",
      role: "স্বেচ্ছাসেবক",
      date: "2022-12-15",
    },
  ];

  return (
    <div className="py-11">
      <div className="bg-white rounded-lg p-6 w-full lg:max-w-sm mx-auto shadow-sm border border-gray-100">
        <div className="flex flex-col items-center">
          <img
            src={owner.profile_picture || "https://i.ibb.co.com/XZdP5hF/2023-05-15-1.jpg"}
            alt={`${owner.name || "উদ্যোক্তা"}-এর প্রোফাইল ছবি`}
            className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-primary"
          />

          <h2 className="text-xl font-bold mb-1 text-center">{owner.name || "আব্দুল জব্বার আল নাহিদ"}</h2>
          {owner.email && <p className="text-gray-600 text-sm text-center">{owner.email}</p>}

          <p className="text-center text-gray-700 my-3 text-sm">{owner.bio || "সমাজকল্যাণে কার্যকর অনুদান কার্যক্রম পরিচালনায় নিবেদিত।"}</p>

          <div className="mb-6 flex justify-center space-x-3">
            {owner.linkedinUrl && (
              <a
                href={owner.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>
            )}
            {owner.facebookUrl && (
              <a
                href={owner.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
            )}
            {owner.instagramUrl && (
              <a
                href={owner.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            )}
            {owner.twitterUrl && (
              <a
                href={owner.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
            )}
          </div>

          <div className="w-full text-left">
            <h3 className="text-base font-semibold mb-2">স্বেচ্ছাসেবার ইতিহাস:</h3>
            <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
              {volunteer_history.map((history, index) => (
                <li key={index}>
                  <strong>{history.campaign_name}</strong> - <br />
                  <span className="text-gray-500">{history.role} · {new Date(history.date).toLocaleDateString("bn-BD")}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 w-full pt-4 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-sm">
              <strong>মোট অংশগ্রহণ করা কার্যক্রম:</strong> 10+
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignOwner;
