const mongoose = require('mongoose');

const PremiumMaterialSchema = new mongoose.Schema({
  title: String,
  description: String,
  fileUrl: String
});

module.exports =
  mongoose.models.PremiumMaterial ||
  mongoose.model('PremiumMaterial', PremiumMaterialSchema);
