/** "Warranty Info!" -> "warranty-info" (matches the backend's slug rules) */
export const slugifyText = (text) =>
  String(text || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "page";
