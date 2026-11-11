// Contact form (Contact Us page): saved to the database AND emailed to the business,
// so no message is lost even if email isn't configured yet.
const prisma = require("../prisma");
const { getSettings } = require("../services/settings.service");
const { sendContactEmail } = require("../services/email.service");
const { paginate, pageResult } = require("../utils/serialize");
const { badRequest, notFound } = require("../utils/httpError");

// POST /api/contact
async function create(req, res) {
  const { website, ...data } = req.valid.body;
  if (website) throw badRequest("Invalid submission");

  const message = await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    },
  });

  getSettings()
    .then((settings) => sendContactEmail(message, settings))
    .catch((error) => console.error("Contact email error:", error));

  res.status(201).json({ message: "Thanks! We'll get back to you soon." });
}

// GET /api/admin/messages?unread=true&page=
async function list(req, res) {
  const where = req.valid.query.unread ? { isRead: false } : {};
  const pagination = paginate(req.valid.query, { defaultLimit: 20, maxLimit: 100 });
  const [items, total, unread] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.limit }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);
  res.json({ ...pageResult(items, total, pagination), unread });
}

// PATCH /api/admin/messages/:id { isRead }
async function update(req, res) {
  const id = req.valid.params.id;
  const existing = await prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Message");
  res.json(await prisma.contactMessage.update({ where: { id }, data: { isRead: req.valid.body.isRead } }));
}

// DELETE /api/admin/messages/:id
async function remove(req, res) {
  const id = req.valid.params.id;
  const existing = await prisma.contactMessage.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Message");
  await prisma.contactMessage.delete({ where: { id } });
  res.json({ message: "Message deleted" });
}

module.exports = { create, list, update, remove };
