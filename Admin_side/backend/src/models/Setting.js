const { Schema, model } = require('mongoose');

const SettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String },
  updatedBy: { type: String },
}, { timestamps: true });

module.exports = model('Setting', SettingSchema);
