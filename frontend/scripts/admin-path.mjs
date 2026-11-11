// Creates a secret back-office address and the hash the website needs.
//   npm run admin-path            → random address
//   npm run admin-path -- my-door → use your own (at least 16 characters, letters/numbers/-)
//
// Put the printed VITE_ADMIN_PATH_HASH line in frontend/.env (or your hosting's build settings)
// and rebuild. Keep the address itself private: bookmark it, don't put it in the code or in .env.
import { createHash, randomBytes } from "node:crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alike characters
const custom = process.argv[2];

let segment;
if (custom) {
  segment = custom.replace(/^\/+/, "");
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(segment)) {
    console.error("Use 16–64 characters: letters, numbers and dashes.");
    process.exit(1);
  }
} else {
  const bytes = randomBytes(18);
  segment = "door-" + [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

const hash = createHash("sha256").update(segment).digest("hex");

console.log(`
Back-office address (keep this private, bookmark it):

    https://<your-shop-domain>/${segment}

Add this line to frontend/.env (or your hosting's environment settings), then rebuild:

    VITE_ADMIN_PATH_HASH=${hash}

After that, /admin and every other address show "page not found";
only the address above opens the sign-in page.
`);
