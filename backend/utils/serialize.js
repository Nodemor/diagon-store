// Converts Prisma records into API-friendly JSON:
// Decimal -> number, tags -> array, plus computed price/stock fields.

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

function stockStatusOf(product) {
  if (product.status === "OUT_OF_STOCK" || product.stock <= 0) return "OUT_OF_STOCK";
  if (product.stock <= (product.lowStockThreshold ?? 5)) return "LOW_STOCK";
  return "IN_STOCK";
}

function serializeProduct(product) {
  if (!product) return product;

  const price = toNumber(product.price);
  const salePrice = toNumber(product.salePrice);
  const onSale = salePrice !== null && salePrice < price;
  const stockStatus = stockStatusOf(product);

  const { relatedTo, relatedFrom, ...rest } = product;

  return {
    ...rest,
    price,
    salePrice,
    finalPrice: onSale ? salePrice : price,
    onSale,
    discountPercent: onSale && price > 0 ? Math.round((1 - salePrice / price) * 100) : 0,
    stockStatus,
    inStock: stockStatus !== "OUT_OF_STOCK",
    tags: product.tags ? product.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
    ...(relatedTo ? { relatedProducts: relatedTo.map(serializeProduct) } : {}),
  };
}

function serializeInquiry(inquiry) {
  if (!inquiry) return inquiry;
  return {
    ...inquiry,
    estimatedTotal: toNumber(inquiry.estimatedTotal),
    ...(inquiry.items
      ? {
          items: inquiry.items.map((item) => ({
            ...item,
            unitPrice: toNumber(item.unitPrice),
            lineTotal: toNumber(item.lineTotal),
          })),
        }
      : {}),
  };
}

/** Normalises tags input (array or comma string) to a stored comma string. */
function tagsToString(tags) {
  if (tags === undefined) return undefined;
  if (tags === null) return null;
  const list = (Array.isArray(tags) ? tags : String(tags).split(","))
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean);
  return list.length ? [...new Set(list)].join(",").slice(0, 500) : null;
}

function paginate(query, { defaultLimit = 12, maxLimit = 60 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

const pageResult = (items, total, { page, limit }) => ({
  items,
  total,
  page,
  limit,
  pages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { toNumber, serializeProduct, serializeInquiry, tagsToString, paginate, pageResult, stockStatusOf };
