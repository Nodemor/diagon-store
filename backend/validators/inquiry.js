const { z, optionalText, id, pageQuery } = require("./common");

const INQUIRY_STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"];

const createInquiry = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  email: z.preprocess((v) => (v === "" ? null : v), z.email("Please enter a valid email").max(191).nullish()),
  address: z.string().trim().min(5, "Please enter your delivery address").max(1000),
  city: optionalText(100),
  notes: optionalText(2000),
  channel: z.enum(["WHATSAPP", "EMAIL"]).default("WHATSAPP"),
  items: z
    .array(z.object({ productId: id, quantity: z.coerce.number().int().min(1).max(99) }))
    .min(1, "Your cart is empty")
    .max(50),
  // honeypot field — real users never fill it
  website: z.string().max(0).optional(),
});

const trackQuery = z.object({
  number: z.string().trim().min(3).max(40),
  phone: z.string().trim().min(7).max(20),
});

const adminListQuery = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  ...pageQuery,
});

const statusUpdate = z.object({
  status: z.enum(INQUIRY_STATUSES),
  note: optionalText(500),
});

const notesUpdate = z.object({ adminNotes: optionalText(5000) });

module.exports = { INQUIRY_STATUSES, createInquiry, trackQuery, adminListQuery, statusUpdate, notesUpdate };
