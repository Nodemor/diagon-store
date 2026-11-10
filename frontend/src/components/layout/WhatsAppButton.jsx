import { motion } from "motion/react";
import { useSettings } from "../../context/SettingsContext";
import { whatsappLink } from "../../lib/format";
import { WhatsAppIcon } from "../ui/icons";

/** Floating "chat with us" button (proposal §3). Hidden until a WhatsApp number is set. */
export function WhatsAppButton() {
  const { whatsappNumber, storeName } = useSettings();
  const href = whatsappLink(whatsappNumber, `Hello ${storeName}, I have a question.`);
  if (!href) return null;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.6, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-night shadow-[0_10px_30px_-8px_rgb(20_25_36/0.6)] md:bottom-7 md:right-7"
    >
      <WhatsAppIcon width={28} height={28} />
    </motion.a>
  );
}
