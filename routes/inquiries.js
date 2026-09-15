const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');

// Create a buyer inquiry
router.post('/create', async (req, res) => {
  try {
    const newInquiry = new Inquiry(req.body);
    await newInquiry.save();
    res.status(201).json({ success: true, inquiry: newInquiry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record inquiry' });
  }
});

// Fetch inquiries for artisan dashboard
router.get('/artisan/:artisanId', async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ artisanId: req.params.artisanId }).populate('productId');
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

module.exports = router;