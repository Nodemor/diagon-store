const crypto = require("crypto");
const prisma = require("../prisma");
const { serializeInquiry, serializeProduct, paginate, pageResult } = require("../utils/serialize");
const { normalizePhone } = require("../utils/phone");
const { round2, formatOrderNumber } = require("../utils/format");
const { buildInquiryMessage, whatsappLink } = require("../utils/whatsapp");
const { badRequest, notFound } = require("../utils/httpError");
const { VISIBLE } = require("./product.service");
const { getSettings } = require("./settings.service");
const { sendInquiryEmails } = require("./email.service");

/**
 * Customer places an order/inquiry (proposal §8–§11, COD).
 * Prices are always taken from the database, never from the browser.
 * Returns the saved order + the pre-filled WhatsApp link.
 */
async function createInquiry(input) {
  if (input.website) throw badRequest("Invalid submission");

  const phone = normalizePhone(input.phone);
  if (!phone) throw badRequest("Please enter a valid mobile number", [{ path: "phone", message: "Invalid mobile number" }]);

  // merge duplicate lines
  const quantities = new Map();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);

  const products = await prisma.product.findMany({
    where: { AND: [VISIBLE, { id: { in: [...quantities.keys()] } }] },
    select: { id: true, name: true, sku: true, price: true, salePrice: true, stock: true, status: true, lowStockThreshold: true },
  });

  const missing = [...quantities.keys()].filter((id) => !products.some((p) => p.id === id));
  if (missing.length) {
    throw badRequest("Some items in your cart are no longer available. Please review your cart.", [
      { path: "items", message: "Unavailable products", productIds: missing },
    ]);
  }

  const problems = [];
  const lines = products.map((product) => {
    const p = serializeProduct(product);
    const quantity = quantities.get(product.id);
    if (!p.inStock) problems.push(`${p.name} is out of stock`);
    else if (quantity > p.stock) problems.push(`Only ${p.stock} × ${p.name} available`);
    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      unitPrice: p.finalPrice,
      quantity,
      lineTotal: round2(p.finalPrice * quantity),
    };
  });
  if (problems.length) throw badRequest(problems.join(". "), [{ path: "items", message: problems.join(". ") }]);

  const estimatedTotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const saved = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone },
      create: { name: input.name, phone, email: input.email || null, address: input.address },
      update: { name: input.name, address: input.address, ...(input.email ? { email: input.email } : {}) },
    });

    const inquiry = await tx.inquiry.create({
      data: {
        inquiryNumber: `TMP-${crypto.randomUUID()}`,
        customerId: customer.id,
        name: input.name,
        phone,
        email: input.email || null,
        address: input.address,
        city: input.city || null,
        notes: input.notes || null,
        channel: input.channel,
        itemCount,
        estimatedTotal,
        items: { create: lines },
        history: { create: { status: "NEW", note: `Order placed on the website (${input.channel.toLowerCase()})` } },
      },
    });

    return tx.inquiry.update({
      where: { id: inquiry.id },
      data: { inquiryNumber: formatOrderNumber(inquiry.id, inquiry.createdAt) },
      include: { items: true },
    });
  });

  const inquiry = serializeInquiry(saved);
  const settings = await getSettings();
  const whatsappMessage = buildInquiryMessage(inquiry, settings);

  // fire-and-forget: email problems must never fail an order
  sendInquiryEmails(inquiry, settings).catch((error) => console.error("Inquiry email error:", error));

  return {
    inquiryNumber: inquiry.inquiryNumber,
    status: inquiry.status,
    channel: inquiry.channel,
    estimatedTotal: inquiry.estimatedTotal,
    itemCount: inquiry.itemCount,
    items: inquiry.items.map(({ productName, sku, quantity, unitPrice, lineTotal }) => ({ productName, sku, quantity, unitPrice, lineTotal })),
    createdAt: inquiry.createdAt,
    whatsappMessage,
    whatsappUrl: whatsappLink(settings.whatsappNumber, whatsappMessage),
    email: settings.email || null,
  };
}

/** Public order tracking: needs the order number AND the phone it was placed with. */
async function track(number, phoneInput) {
  const phone = normalizePhone(phoneInput);
  const inquiry = await prisma.inquiry.findUnique({
    where: { inquiryNumber: number.toUpperCase() },
    include: {
      items: { include: { product: { select: { slug: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } },
      history: { orderBy: { createdAt: "asc" }, select: { status: true, createdAt: true } },
    },
  });

  // same response for "wrong number" and "wrong phone" so numbers can't be probed
  if (!inquiry || !phone || inquiry.phone !== phone) throw notFound("Order");

  const s = serializeInquiry(inquiry);
  return {
    inquiryNumber: s.inquiryNumber,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    name: s.name.split(" ")[0],
    city: s.city,
    itemCount: s.itemCount,
    estimatedTotal: s.estimatedTotal,
    items: s.items.map((item) => ({
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      slug: item.product?.slug || null,
      imageUrl: item.product?.images?.[0]?.url || null,
    })),
    history: s.history,
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const adminInclude = {
  items: { include: { product: { select: { id: true, slug: true, stock: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } },
  history: { orderBy: { createdAt: "asc" }, include: { admin: { select: { id: true, name: true } } } },
  customer: { select: { id: true, name: true, phone: true, email: true, _count: { select: { inquiries: true } } } },
};

async function listAdmin(query) {
  const AND = [];
  if (query.status) AND.push({ status: query.status });
  if (query.from) AND.push({ createdAt: { gte: query.from } });
  if (query.to) AND.push({ createdAt: { lte: query.to } });
  if (query.search) {
    const term = query.search;
    const phone = normalizePhone(term);
    AND.push({
      OR: [
        { inquiryNumber: { contains: term } },
        { name: { contains: term } },
        { email: { contains: term } },
        { phone: { contains: phone || term } },
      ],
    });
  }

  const where = { AND };
  const pagination = paginate(query, { defaultLimit: 20, maxLimit: 100 });
  const [items, total] = await Promise.all([
    prisma.inquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.limit }),
    prisma.inquiry.count({ where }),
  ]);

  return pageResult(items.map(serializeInquiry), total, pagination);
}

async function getAdmin(id) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id }, include: adminInclude });
  if (!inquiry) throw notFound("Order");
  const settings = await getSettings();
  const serialized = serializeInquiry(inquiry);
  // link for the admin to message the customer directly
  return { ...serialized, customerWhatsappUrl: whatsappLink(inquiry.phone, `Hello ${inquiry.name}, this is ${settings.storeName} regarding your order ${inquiry.inquiryNumber}.`) };
}

async function updateStatus(id, { status, note }, adminId) {
  const existing = await prisma.inquiry.findUnique({ where: { id }, select: { status: true } });
  if (!existing) throw notFound("Order");

  await prisma.$transaction([
    prisma.inquiry.update({ where: { id }, data: { status } }),
    prisma.inquiryStatusHistory.create({ data: { inquiryId: id, status, note: note || null, adminId } }),
  ]);

  return getAdmin(id);
}

async function updateNotes(id, { adminNotes }) {
  const existing = await prisma.inquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Order");
  await prisma.inquiry.update({ where: { id }, data: { adminNotes: adminNotes ?? null } });
  return getAdmin(id);
}

async function remove(id) {
  const existing = await prisma.inquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Order");
  await prisma.inquiry.delete({ where: { id } });
}

module.exports = { createInquiry, track, listAdmin, getAdmin, updateStatus, updateNotes, remove };
