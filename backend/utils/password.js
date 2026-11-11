// Admin password rules. Returns a plain-language problem, or null when the password is fine.
const COMMON = [
  "password", "123456", "qwerty", "admin", "letmein", "welcome", "diagon", "iloveyou", "abc123", "111111",
];

function passwordProblem(password, { email, name } = {}) {
  const p = String(password || "");
  const lower = p.toLowerCase();
  if (p.length < 12) return "Use at least 12 characters.";
  if (p.length > 200) return "Use at most 200 characters.";
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return "Use both letters and numbers.";
  if (/^(.)\1+$/.test(p)) return "Don't repeat one character.";
  if (email && (lower === String(email).toLowerCase() || lower.includes(String(email).split("@")[0].toLowerCase()))) {
    return "Don't use your email address in the password.";
  }
  if (name && name.length >= 4 && lower.includes(String(name).toLowerCase().split(" ")[0])) return "Don't use your name in the password.";
  if (COMMON.some((w) => lower.includes(w) && lower.replace(/[^a-z]/g, "").length - w.length < 4)) {
    return "That password is too easy to guess. Try a short sentence or three random words with numbers.";
  }
  return null;
}

module.exports = { passwordProblem };
