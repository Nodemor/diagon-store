// Admin: banners, website settings, content pages, admin users, generic image upload
const bcrypt = require("bcryptjs");
const prisma = require("../../prisma");
const { getSettings, updateSettings: saveSettings } = require("../../services/settings.service");
const { removeUploadedFile } = require("../../services/storage.service");
const { publicPath } = require("../../middleware/upload");
const { badRequest, notFound } = require("../../utils/httpError");
const { passwordProblem } = require("../../utils/password");
const { sanitizeHtml } = require("../../utils/sanitizeHtml");

// ---- Generic upload (banners, categories, content) ----------------------------

// POST /api/admin/uploads/:folder  multipart "image" -> { url }
async function uploadImage(req, res) {
  if (!req.file) throw badRequest("Choose an image to upload (field name: image)");
  res.status(201).json({ url: publicPath(req.params.folder, req.file) });
}

// ---- Banners ----------------------------------------------------------------

async function listBanners(req, res) {
  res.json(await prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { id: "asc" }] }));
}

async function createBanner(req, res) {
  res.status(201).json(await prisma.banner.create({ data: req.valid.body }));
}

async function updateBanner(req, res) {
  const existing = await prisma.banner.findUnique({ where: { id: req.valid.params.id } });
  if (!existing) throw notFound("Banner");
  const banner = await prisma.banner.update({ where: { id: existing.id }, data: req.valid.body });
  if (existing.imageUrl !== banner.imageUrl) await removeUploadedFile(existing.imageUrl);
  res.json(banner);
}

async function deleteBanner(req, res) {
  const existing = await prisma.banner.findUnique({ where: { id: req.valid.params.id } });
  if (!existing) throw notFound("Banner");
  await prisma.banner.delete({ where: { id: existing.id } });
  await removeUploadedFile(existing.imageUrl);
  res.json({ message: "Banner deleted" });
}

// ---- Settings -----------------------------------------------------------------

const getAllSettings = async (req, res) => res.json(await getSettings());
const updateSettings = async (req, res) => res.json(await saveSettings(req.valid.body));

// ---- Pages --------------------------------------------------------------------

async function listPages(req, res) {
  res.json(
    await prisma.page.findMany({
      orderBy: { title: "asc" },
      select: { id: true, slug: true, title: true, isPublished: true, updatedAt: true },
    }),
  );
}

async function getPage(req, res) {
  const page = await prisma.page.findUnique({ where: { slug: req.valid.params.slug } });
  if (!page) throw notFound("Page");
  res.json(page);
}

// PUT /api/admin/pages/:slug — create or update
async function savePage(req, res) {
  const { slug } = req.valid.params;
  const body = { ...req.valid.body, content: sanitizeHtml(req.valid.body.content) };
  const page = await prisma.page.upsert({
    where: { slug },
    create: { slug, ...body },
    update: body,
  });
  res.json(page);
}

async function deletePage(req, res) {
  const existing = await prisma.page.findUnique({ where: { slug: req.valid.params.slug } });
  if (!existing) throw notFound("Page");
  await prisma.page.delete({ where: { slug: existing.slug } });
  res.json({ message: "Page deleted" });
}

// ---- Admin users (SUPER_ADMIN only) ---------------------------------------------

const adminSelect = { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true };

async function listAdmins(req, res) {
  res.json(await prisma.admin.findMany({ orderBy: { createdAt: "asc" }, select: adminSelect }));
}

async function createAdmin(req, res) {
  const { password, ...rest } = req.valid.body;
  const problem = passwordProblem(password, rest);
  if (problem) throw badRequest(problem, [{ path: "password", message: problem }]);
  const admin = await prisma.admin.create({
    data: { ...rest, password: await bcrypt.hash(password, 12) },
    select: adminSelect,
  });
  res.status(201).json(admin);
}

async function updateAdmin(req, res) {
  const id = req.valid.params.id;
  const { password, ...rest } = req.valid.body;

  if (id === req.admin.id && (rest.isActive === false || (rest.role && rest.role !== "SUPER_ADMIN"))) {
    throw badRequest("You cannot deactivate or demote your own account");
  }

  const existing = await prisma.admin.findUnique({ where: { id }, select: { email: true, name: true, role: true, isActive: true } });
  if (!existing) throw notFound("Admin");

  const data = { ...rest };
  if (password) {
    const problem = passwordProblem(password, { ...existing, ...rest });
    if (problem) throw badRequest(problem, [{ path: "password", message: problem }]);
    data.password = await bcrypt.hash(password, 12);
  }
  // a new password, a role change or blocking the account signs that admin out everywhere
  if (password || (rest.role && rest.role !== existing.role) || rest.isActive === false) {
    data.tokenVersion = { increment: 1 };
  }
  // unblocking also clears any sign-in lock
  if (rest.isActive === true) Object.assign(data, { failedLogins: 0, lockedUntil: null });

  const admin = await prisma.admin.update({ where: { id }, data, select: adminSelect });
  res.json(admin);
}

async function deleteAdmin(req, res) {
  const id = req.valid.params.id;
  if (id === req.admin.id) throw badRequest("You cannot delete your own account");
  await prisma.admin.delete({ where: { id } });
  res.json({ message: "Admin deleted" });
}

module.exports = {
  uploadImage,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllSettings,
  updateSettings,
  listPages,
  getPage,
  savePage,
  deletePage,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};
