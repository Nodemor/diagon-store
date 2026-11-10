const { formatMoney } = require("./format");

/**
 * Builds the pre-filled WhatsApp message for an order/inquiry (proposal §9).
 * `inquiry` is a serialized inquiry with items.
 */
function buildInquiryMessage(inquiry, settings) {
  const currency = settings.currency;
  const lines = [
    `Hello ${settings.storeName},`,
    `I would like to order the following product${inquiry.items.length > 1 ? "s" : ""}:`,
    "",
    `Order No: ${inquiry.inquiryNumber}`,
    "",
  ];

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

/** https://wa.me/<number>?text=<message>, or null when no WhatsApp number is configured */
function whatsappLink(number, message) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

module.exports = { buildInquiryMessage, whatsappLink };
