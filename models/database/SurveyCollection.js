// models\database\SurveyCollection.js
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const SurveyCollectionSchema = new Schema(
  {
    // Unique reference for the collection (master REF)
    collectionRef: { 
      type: String, 
      required: true,
      unique: true
    },
    // Name for the collection (optional)
    name: { 
      type: String,
      default: "Survey Collection"
    },
    // Site reference
    site: { 
      type: Schema.Types.ObjectId, 
      ref: "Site", 
      required: true 
    },
    // Array of survey IDs belonging to this collection
    surveys: [{ 
      type: Schema.Types.ObjectId, 
      ref: "KitchenSurvey" 
    }],
    // Total number of areas in this collection
    totalAreas: {
      type: Number,
      default: 0
    },
    // Creation and update timestamps
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

export default mongoose.models.SurveyCollection || 
  mongoose.model("SurveyCollection", SurveyCollectionSchema);