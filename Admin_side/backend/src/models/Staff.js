const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const StaffSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true, default: 'staff' },
  passwordHash: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

StaffSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

StaffSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = model('Staff', StaffSchema);
