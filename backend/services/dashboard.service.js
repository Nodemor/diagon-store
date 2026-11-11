const prisma = require("../prisma");
const { serializeInquiry, serializeProduct } = require("../utils/serialize");

/** Admin dashboard statistics (proposal §13). */
async function getDashboard() {
  const outOfStockWhere = { OR: [{ stock: { lte: 0 } }, { status: "OUT_OF_STOCK" }] };
  const lowStockWhere = { status: "ACTIVE", stock: { gt: 0, lte: prisma.product.fields.lowStockThreshold } };

  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockProducts,
    draftProducts,
    totalCategories,
    statusGroups,
    totalCustomers,
    recentInquiries,
    lowStockList,
    unreadMessages,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: outOfStockWhere }),
    prisma.product.count({ where: lowStockWhere }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.category.count(),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.customer.count(),
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.product.findMany({
      where: { OR: [lowStockWhere, outOfStockWhere] },
      orderBy: { stock: "asc" },
      take: 6,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  const byStatus = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
  const count = (status) => byStatus[status] || 0;

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      outOfStock: outOfStockProducts,
      lowStock: lowStockProducts,
      draft: draftProducts,
    },
    totalCategories,
    totalCustomers,
    unreadMessages,
    inquiries: {
      new: count("NEW"),
      pending: count("CONTACTED"),
      confirmed: count("CONFIRMED") + count("PROCESSING"),
      completed: count("COMPLETED"),
      cancelled: count("CANCELLED"),
      byStatus,
    },
    recentInquiries: recentInquiries.map(serializeInquiry),
    stockAlerts: lowStockList.map(serializeProduct),
  };
}

module.exports = { getDashboard };
