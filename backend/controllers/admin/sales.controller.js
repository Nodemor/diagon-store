// Admin: dashboard, orders/inquiries, customers
const prisma = require("../../prisma");
const inquiryService = require("../../services/inquiry.service");
const { getDashboard } = require("../../services/dashboard.service");
const { serializeInquiry, paginate, pageResult } = require("../../utils/serialize");
const { notFound } = require("../../utils/httpError");

const dashboard = async (req, res) => res.json(await getDashboard());

// ---- Orders / inquiries ----------------------------------------------------

const listInquiries = async (req, res) => res.json(await inquiryService.listAdmin(req.valid.query));
const getInquiry = async (req, res) => res.json(await inquiryService.getAdmin(req.valid.params.id));
const updateInquiryStatus = async (req, res) =>
  res.json(await inquiryService.updateStatus(req.valid.params.id, req.valid.body, req.admin.id));
const updateInquiryNotes = async (req, res) =>
  res.json(await inquiryService.updateNotes(req.valid.params.id, req.valid.body));

async function deleteInquiry(req, res) {
  await inquiryService.remove(req.valid.params.id);
  res.json({ message: "Order deleted" });
}

// ---- Customers --------------------------------------------------------------

async function listCustomers(req, res) {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const where = search
    ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }, { email: { contains: search } }] }
    : {};
  const pagination = paginate(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        _count: { select: { inquiries: true } },
        inquiries: { orderBy: { createdAt: "desc" }, take: 1, select: { inquiryNumber: true, status: true, createdAt: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  res.json(
    pageResult(
      items.map(({ _count, inquiries, ...customer }) => ({
        ...customer,
        inquiryCount: _count.inquiries,
        lastInquiry: inquiries[0] || null,
      })),
      total,
      pagination,
    ),
  );
}

async function getCustomer(req, res) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.valid.params.id },
    include: { inquiries: { orderBy: { createdAt: "desc" }, include: { items: true } } },
  });
  if (!customer) throw notFound("Customer");
  res.json({ ...customer, inquiries: customer.inquiries.map(serializeInquiry) });
}

module.exports = {
  dashboard,
  listInquiries,
  getInquiry,
  updateInquiryStatus,
  updateInquiryNotes,
  deleteInquiry,
  listCustomers,
  getCustomer,
};
