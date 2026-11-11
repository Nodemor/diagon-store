const { formatMoney } = require("./format");

// Customer-facing wording for each order status (used in the shop → customer message)
const STATUS_LINES = {
  NEW: "We have received your order and will confirm it shortly.",
  CONTACTED: "We are checking your order and will confirm the details with you.",
  CONFIRMED: "Your order is confirmed.",
  PROCESSING: "Your order is being packed for delivery.",
  COMPLETED: "Your order has been delivered. Thank you for shopping with us!",
  CANCELLED: "Your order has been cancelled. Reply here if you have any questions.",
};

/**
 * Builds the pre-filled WhatsApp message for an order/inquiry (proposal §9).
 * `inquiry` is a serialized inquiry with items. `orderUrl` is its share link: WhatsApp shows the
 * first link in a message as a preview (order number, total, product photo).
 */
function buildInquiryMessage(inquiry, settings, orderUrl) {
  const currency = settings.currency;
  const lines = [
    `Hello ${settings.storeName},`,
    `I would like to order the following product${inquiry.items.length > 1 ? "s" : ""}:`,
    "",
    `Order No: ${inquiry.inquiryNumber}`,
  ];
  if (orderUrl) lines.push(`Order link: ${orderUrl}`);
  lines.push("");

  inquiry.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.productName}`);
    if (item.sku) lines.push(`   Product Code: ${item.sku}`);
    lines.push(`   Quantity: ${item.quantity}`);
    lines.push(`   Price: ${formatMoney(item.unitPrice, currency)}`);
    lines.push("");
  });

  lines.push(`Estimated Total: ${formatMoney(inquiry.estimatedTotal, currency)}`);
  lines.push("");
  lines.push(`Name: ${inquiry.name}`);
  lines.push(`Mobile: ${inquiry.phone}`);
  lines.push(`Address: ${inquiry.address}${inquiry.city ? `, ${inquiry.city}` : ""}`);
  if (inquiry.notes) lines.push(`Note: ${inquiry.notes}`);
  lines.push("");
  lines.push("Please confirm availability and delivery details.");

  return lines.join("\n");
}

/** Message the shop sends the customer from the back office, with the order link (and its preview). */
function buildCustomerMessage(inquiry, settings, orderUrl) {
  const lines = [
    `Hello ${inquiry.name.split(" ")[0]},`,
    "",
    `This is ${settings.storeName} about your order ${inquiry.inquiryNumber}.`,
    STATUS_LINES[inquiry.status] || "",
  ];
  if (!["COMPLETED", "CANCELLED"].includes(inquiry.status)) {
    lines.push(`Total to pay on delivery: ${formatMoney(inquiry.estimatedTotal, settings.currency)}`);
  }
  if (orderUrl) lines.push("", `Your order: ${orderUrl}`);
  return lines.filter((line, i, all) => line !== "" || all[i - 1] !== "").join("\n");
}

/** https://wa.me/<number>?text=<message>, or null when no WhatsApp number is configured */
function whatsappLink(number, message) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

module.exports = { buildInquiryMessage, buildCustomerMessage, whatsappLink, STATUS_LINES };
