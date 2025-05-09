// models\database\schematicParts\parts.js

import mongoose from "mongoose";

const PartSchema = new mongoose.Schema({
  // The category of the part (e.g., Equipment, Structure)
  category: {
    type: String,
    required: true,
  },
  // The subcategory of the part.
  subcategory: {
    type: String,
    required: true,
  },
  // The item (or type) for this part.
  item: {
    type: String,
    required: true,
  },
  // Field to store the SVG path (e.g., "/svgs/part1.svg")
  svgPath: {
    type: String,
  },
  // NEW: Indicates if multiple placements of this part should aggregate into one entry.
  aggregateEntry: {
    type: Boolean,
    default: false,
  },
  // NEW: Indicates if dimensions (length, width, height) are required for price calculations.
  requiresDimensions: {
    type: Boolean,
    default: false,
  },
});

export const Part =
  mongoose.models.Part || mongoose.model("Part", PartSchema);
