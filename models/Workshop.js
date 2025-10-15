const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  strikePrice: { type: Number, default: 0 },
  // if admin has not set date/time, keep it null and UI should show "Coming soon"
  dateTime: { type: Date, default: null },
}, { timestamps: true });

workshopSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Workshop', workshopSchema);
