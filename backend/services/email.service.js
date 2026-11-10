const nodemailer = require("nodemailer");
const env = require("../config/env");
const { escapeHtml, formatMoney } = require("../utils/format");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { host, port, secure, user, pass } = env.email.smtp;
  if (!host) return null;
  transporter = nodemailer.createTransport({ host, port, secure, auth: user ? { user, pass } : undefined });
  return transporter;
}

/**
 * Sends an email, or logs it when EMAIL_ENABLED=false / SMTP is not configured.
 * Never throws: email problems must not break orders.
 */
async function sendMail({ to, subject, html, text, replyTo }) {
  if (!to) return { skipped: true };

  const transport = env.email.enabled ? getTransporter() : null;
  if (!transport) {
    console.info(`[email disabled] to=${to} subject="${subject}"`);
    return { skipped: true };
  }

  try {
    const info = await transport.sendMail({ from: env.email.from, to, subject, html, text, replyTo });
    return { sent: true, id: info.messageId };
  } catch (error) {
    console.error(`[email failed] to=${to} subject="${subject}":`, error.message);
    return { sent: false, error: error.message };
  }
}

function itemsTable(inquiry, currency) {
  const rows = inquiry.items
    .map(
      (item) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.productName)}${item.sku ? `<br><small style="color:#777">Code: ${escapeHtml(item.sku)}</small>` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(item.unitPrice, currency)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(item.lineTotal, currency)}</td>
      </tr>`,
    )
    .join("");

  return `<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px">
    <thead><tr style="background:#f6f1e3">
      <th style="padding:8px;text-align:left">Product</th><th style="padding:8px">Qty</th>
      <th style="padding:8px;text-align:right">Price</th><th style="padding:8px;text-align:right">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3" style="padding:8px;text-align:right"><strong>Estimated total</strong></td>
      <td style="padding:8px;text-align:right"><strong>${formatMoney(inquiry.estimatedTotal, currency)}</strong></td></tr></tfoot>
  </table>`;
}

/** New order/inquiry: notify the business (proposal §10) and confirm to the customer. */
async function sendInquiryEmails(inquiry, settings) {
  const currency = settings.currency;
  const businessEmail = env.email.adminNotify || settings.email;

  const customerBlock = `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
    <strong>Name:</strong> ${escapeHtml(inquiry.name)}<br>
    <strong>Mobile:</strong> ${escapeHtml(inquiry.phone)}<br>
    <strong>Email:</strong> ${escapeHtml(inquiry.email || "—")}<br>
    <strong>Address:</strong> ${escapeHtml(inquiry.address)}${inquiry.city ? `, ${escapeHtml(inquiry.city)}` : ""}<br>
    <strong>Sent via:</strong> ${escapeHtml(inquiry.channel)}<br>
    ${inquiry.notes ? `<strong>Message:</strong> ${escapeHtml(inquiry.notes)}` : ""}
  </p>`;

  const tasks = [];

  if (businessEmail) {
    tasks.push(
      sendMail({
        to: businessEmail,
        replyTo: inquiry.email || undefined,
        subject: `New order ${inquiry.inquiryNumber} — ${inquiry.name}`,
        html: `<h2 style="font-family:Georgia,serif">New order / inquiry ${escapeHtml(inquiry.inquiryNumber)}</h2>
          ${customerBlock}${itemsTable(inquiry, currency)}`,
      }),
    );
  }

  if (inquiry.email) {
    tasks.push(
      sendMail({
        to: inquiry.email,
        replyTo: businessEmail || undefined,
        subject: `We received your order ${inquiry.inquiryNumber} — ${settings.storeName}`,
        html: `<h2 style="font-family:Georgia,serif">Thank you, ${escapeHtml(inquiry.name)}!</h2>
          <p style="font-family:Arial,sans-serif;font-size:14px">Your order <strong>${escapeHtml(inquiry.inquiryNumber)}</strong>
          has reached ${escapeHtml(settings.storeName)}. We will contact you shortly to confirm availability and delivery.
          Payment is cash on delivery.</p>
          ${itemsTable(inquiry, currency)}
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#666">Track your order any time with your order number and mobile number.</p>`,
      }),
    );
  }

  return Promise.all(tasks);
}

module.exports = { sendMail, sendInquiryEmails };
