// models\database\products\customField.js

import mongoose from 'mongoose';

const CustomFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { 
    type: String, 
    required: true, 
    enum: ['text', 'number', 'dropdown', 'radio', 'checkbox', 'select', 'date', 'file', 'url'] 
  },
  options: { type: [String], default: [] }, // Array of options for dropdown, radio, checkbox, and select
  order: { type: Number, default: 0 },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" }
});

export default mongoose.models.CustomField || mongoose.model('CustomField', CustomFieldSchema);