// Public order/inquiry endpoints
const inquiryService = require("../services/inquiry.service");

// POST /api/inquiries — customer submits the order/inquiry form
async function create(req, res) {
  res.status(201).json(await inquiryService.createInquiry(req.valid.body));
}

// GET /api/inquiries/track?number=DS-2026-000001&phone=0771234567
async function track(req, res) {
  const { number, phone } = req.valid.query;
  res.json(await inquiryService.track(number, phone));
}

module.exports = { create, track };
