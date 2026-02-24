const express = require('express');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// List audit logs with optional filters: action, userId, resource
router.get('/', async (req, res) => {
  const { action, userId, resource, limit = 100, skip = 0 } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (userId) filter.userId = userId;
  if (resource) filter.resource = resource;
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Math.min(Number(limit), 1000)).lean();
  res.json(logs);
});

// Get single audit
router.get('/:id', async (req, res) => {
  const a = await AuditLog.findById(req.params.id).lean();
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json(a);
});

module.exports = router;
