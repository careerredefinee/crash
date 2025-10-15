// Express route to get a single premium material by ID (for PDF viewer)
const express = require('express');
const router = express.Router();
const PremiumMaterial = require('../models/PremiumMaterial');

// GET /api/premium/materials/:id
router.get('/:id', async (req, res) => {
  try {
    const material = await PremiumMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json({
      title: material.title,
      fileUrl: material.fileUrl || material.url || material.cloudinaryUrl,
      description: material.description,
      category: material.category,
      fileSize: material.fileSize
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

module.exports = router;
