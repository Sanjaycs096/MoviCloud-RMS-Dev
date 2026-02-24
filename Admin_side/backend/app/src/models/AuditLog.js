const { Schema, model } = require('mongoose');

const AuditLogSchema = new Schema({
  action: { type: String, required: true },
  resource: { type: String },
  resourceId: { type: String },
  userId: { type: String },
  userName: { type: String },
  details: { type: Schema.Types.Mixed },
  ip: { type: String }
}, { timestamps: { createdAt: 'createdAt' } });

module.exports = model('AuditLog', AuditLogSchema);
