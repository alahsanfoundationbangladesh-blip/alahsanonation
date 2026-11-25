export const isPunctuationOnly = (str) =>
  typeof str === "string" && /^[\s,.'"\-_।]*$/.test(str);

export const isTextScreenshotData = (str) =>
  typeof str === "string" &&
  (str.startsWith("data:image/webp;base64,UklGRtaeAQB") ||
   str.startsWith("data:image/webp;base64,UklGRnC/AQB"));

export const resolveMissionPhoto = (primary, fallback) => {
  if (primary && !isTextScreenshotData(primary)) return primary;
  if (fallback && !isTextScreenshotData(fallback)) return fallback;
  return "https://i.ibb.co.com/hFKT7MM/pexels-photo-6995106.webp";
};

export const formatMissionContent = (rawText) => {
  if (!rawText) return { intro: "", items: [] };

  const clean = rawText
    .replace(/আল\s*আহসান\s*ফাউন্ডেশন\s*আল[- ]?আহসান\s*ফাউন্ডেশন/g, "আল-আহসান ফাউন্ডেশন")
    .replace(/আপনার তথ্য ও আগের কথোপকথন অনুযায়ী[^:\n।]+[:।]?/g, "")
    .replace(/আপনার তথ্য ও আগের কথোপকথন অনুযায়ী[^:\n।]+[:।]?/g, "")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .trim();

  const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];
  const introParts = [];

  for (const line of lines) {
    const isBullet =
      line.startsWith("•") ||
      line.startsWith("-") ||
      line.startsWith("*") ||
      /^[১-৯1-9][.।)]/.test(line);
    const colonIndex = line.indexOf(":");
    const banglaColonIndex = line.indexOf("ঃ");
    const splitIndex = colonIndex !== -1 ? colonIndex : banglaColonIndex;

    if (isBullet || (splitIndex > 0 && splitIndex < 40 && introParts.length > 0)) {
      let content = line;
      if (isBullet) {
        content = content.replace(/^([•\-*]|[১-৯1-9][.।)])\s*/, "").trim();
      }
      const cIdx = content.indexOf(":") !== -1 ? content.indexOf(":") : content.indexOf("ঃ");
      if (cIdx !== -1) {
        const title = content.substring(0, cIdx).trim();
        const desc = content.substring(cIdx + 1).trim();
        items.push({ title, desc });
      } else {
        items.push({ title: "", desc: content });
      }
    } else {
      introParts.push(line);
    }
  }

  return {
    intro: introParts.join("\n\n"),
    items,
  };
};
