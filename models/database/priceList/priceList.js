// models\database\priceList\priceList.js

import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  prices: {
    A: { type: Number, required: true },
    B: { type: Number, required: true },
    C: { type: Number, required: true },
    D: { type: Number, required: true },
    E: { type: Number, required: true },
  },
  svgPath: { type: String },
  // New field: When true, multiple placements on the canvas are aggregated into one list entry.
  aggregateEntry: { type: Boolean, default: false },
  // New field: When true, this item requires dimensions (length, width, and possibly height)
  // for price calculation.
  requiresDimensions: { type: Boolean, default: false }, // New field: When true, multiple placements on the canvas are aggregated into one list entry.
  // New field: Indicates which pricing calculation method to use.
  // For example: "none" (default), "squareDuct", or "custom". 
  // Your pricing calculation logic will read this field to decide which formula to apply.
  calculationType: { type: String, default: "none" },
});

export const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);
