const express = require('express');
const Setting = require('../models/Setting');
const { auditMiddleware } = require('../middleware/auditLogger');

const router = express.Router();

// List all settings
router.get('/', async (req, res) => {
  const settings = await Setting.find().lean();
  res.json(settings);
});

// Get specific setting by key
router.get('/:key', async (req, res) => {
  const setting = await Setting.findOne({ key: req.params.key }).lean();
  if (!setting) return res.status(404).json({ error: 'Not found' });
  res.json(setting);
});

// Create or update a setting (upsert)
router.post('/', auditMiddleware(req => ({ action: 'update_setting', resource: 'setting', resourceId: req.body.key, userId: req.headers['x-user-id'] || null, userName: req.headers['x-user-name'] || null, details: { key: req.body.key } })), async (req, res) => {
  const { key, value, description } = req.body;
  if (!key) return res.status(400).json({ error: 'key is required' });
  const updated = await Setting.findOneAndUpdate({ key }, { value, description, updatedBy: req.headers['x-user-name'] || null }, { upsert: true, new: true });
  res.json(updated);
});

module.exports = router;
