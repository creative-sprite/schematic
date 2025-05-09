// models\database\products\products.js

import mongoose from 'mongoose';

// Custom Field Schema
const CustomFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { type: String, required: true, enum: ['text', 'number', 'dropdown', 'radio', 'checkbox', 'date', 'file', 'url'] },
  options: { type: [String], default: [] }, // applicable for dropdown, radio, checkboxes
  order: { type: Number, default: 0 },
  // Additional properties for number fields
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" }
});

// Form Schema
const FormSchema = new mongoose.Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
  customFields: [CustomFieldSchema],
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const ProductSchema = new mongoose.Schema({
  form: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  // Core fields
  category: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
  // Enhanced customData to include field metadata
  customData: [{
    fieldId: { type: mongoose.Schema.Types.ObjectId },
    fieldName: { type: String }, // Store the field name/label
    fieldType: { type: String }, // Store the field type
    prefix: { type: String, default: "" }, // Store prefix if applicable
    suffix: { type: String, default: "" }, // Store suffix if applicable
    value: { type: mongoose.Schema.Types.Mixed }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const Form = mongoose.models.Form || mongoose.model('Form', FormSchema);
export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);