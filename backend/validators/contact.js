const { z, optionalText, boolQuery, pageQuery } = require("./common");

const createMessage = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(100),
    email: z.preprocess((v) => (v === "" ? null : v), z.email("Please enter a valid email").max(191).nullish()),
    phone: optionalText(20),
    subject: optionalText(150),
    message: z.string().trim().min(10, "Please write a little more (at least 10 characters)").max(3000),
    // honeypot — real users never fill it
    website: z.string().max(0).optional(),
  })
  .refine((v) => v.email || v.phone, { message: "Add an email or a phone number so we can reply", path: ["email"] });

const listQuery = z.object({ unread: boolQuery, ...pageQuery });
const updateMessage = z.object({ isRead: z.boolean() });

module.exports = { createMessage, listQuery, updateMessage };
