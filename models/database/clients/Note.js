// models\database\clients\Note.js

import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    entry: { type: mongoose.Schema.Types.ObjectId, ref: "Entry", required: true },
    date: { type: Date, default: Date.now },
    title: { type: String }, // Previously "text"
    note: { type: String },  // Previously "details"
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);
