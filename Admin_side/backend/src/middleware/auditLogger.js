const AuditLog = require('../models/AuditLog');

async function logAudit({ action, resource, resourceId, userId, userName, details, ip }) {
  try {
    await AuditLog.create({ action, resource, resourceId, userId, userName, details, ip });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

// Express middleware generator to record an audit after the handler runs
function auditMiddleware(actionFn) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      try {
        const info = actionFn(req, res);
        await logAudit({ ...info, ip: req.ip });
      } catch (err) {
        console.error('audit middleware error', err);
      }
    });
    next();
  };
}

module.exports = { logAudit, auditMiddleware };
