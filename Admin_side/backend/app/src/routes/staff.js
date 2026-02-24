const express = require('express');
const Staff = require('../models/Staff');
const { auditMiddleware } = require('../middleware/auditLogger');

const router = express.Router();

// List staff
router.get('/', async (req, res) => {
  const staff = await Staff.find().select('-passwordHash').lean();
  res.json(staff);
});

// Get staff by id
router.get('/:id', async (req, res) => {
  const s = await Staff.findById(req.params.id).select('-passwordHash').lean();
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});

// Create staff
router.post('/', auditMiddleware(req => ({ action: 'create_staff', resource: 'staff', resourceId: null, userId: req.headers['x-user-id'] || null, userName: req.headers['x-user-name'] || null, details: { email: req.body.email } })), async (req, res) => {
  const { name, email, role, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  const exists = await Staff.findOne({ email });
  if (exists) return res.status(409).json({ error: 'email already exists' });
  const passwordHash = await Staff.hashPassword(password);
  const created = await Staff.create({ name, email, role: role || 'staff', passwordHash });
  const out = created.toObject();
  delete out.passwordHash;
  res.status(201).json(out);
});

// Update staff
router.put('/:id', auditMiddleware(req => ({ action: 'update_staff', resource: 'staff', resourceId: req.params.id, userId: req.headers['x-user-id'] || null, userName: req.headers['x-user-name'] || null, details: { id: req.params.id } })), async (req, res) => {
  const { name, role, active, password } = req.body;
  const update = { name, role, active };
  if (password) update.passwordHash = await Staff.hashPassword(password);
  const updated = await Staff.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Delete staff
router.delete('/:id', auditMiddleware(req => ({ action: 'delete_staff', resource: 'staff', resourceId: req.params.id, userId: req.headers['x-user-id'] || null, userName: req.headers['x-user-name'] || null })), async (req, res) => {
  const removed = await Staff.findByIdAndDelete(req.params.id).select('-passwordHash');
  if (!removed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
