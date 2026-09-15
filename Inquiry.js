const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  artisanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName: { type: String, required: true },
  buyerContact: { type: String, required: true },
  targetSegment: { type: String, required: true }, // e.g., 'Corporate Gifting', 'Wedding'
  quantityRequested: { type: Number, default: 1 },
  customNotes: String,
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inquiry', InquirySchema);