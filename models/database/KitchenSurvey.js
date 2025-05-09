// models\database\KitchenSurvey.js

import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Sub-schema for dimensions
const DimensionsSchema = new Schema({
  length: { type: Number },
  width: { type: Number },
  height: { type: Number },
});

// Sub-schema for placed items on the schematic
const PlacedItemSchema = new Schema({
  id: { type: String },
  originalId: { type: String },
  type: { type: String }, // piece, panel, fixture, connectors, label, measurement
  category: { type: String },
  name: { type: String },
  image: { type: String },
  prices: { type: Schema.Types.Mixed },
  aggregateEntry: { type: Boolean },
  requiresDimensions: { type: Boolean },
  calculationType: { type: String },
  cellX: { type: Number },
  cellY: { type: Number },
  length: { type: String },
  width: { type: String },
  height: { type: String },
  selectedDoorId: { type: String },
  selectedDoorType: { type: String },
  selectedDoorName: { type: String },
  depth: { type: String },
  diameter: { type: String },
  price: { type: Number },
  borderColor: { type: String },
  textColor: { type: String },
  pairNumber: { type: Number },
  labelText: { type: String },
});

// Sub-schema for special items (measurements, labels)
const SpecialItemSchema = new Schema({
  id: { type: String },
  type: { type: String },
  startCellX: { type: Number },
  startCellY: { type: Number },
  endCellX: { type: Number },
  endCellY: { type: Number },
  numericValue: { type: String },
  rotation: { type: Number },
  startImage: { type: String },
  endImage: { type: String },
  name: { type: String },
  labelText: { type: String },
  cellX: { type: Number },
  cellY: { type: Number },
});

// Sub-schema for ventilation products for Flexi-Duct/Hose
const VentilationProductSchema = new Schema({
  id: { type: String },
  productId: { type: String },
  name: { type: String },
  diameter: { type: String },
  price: { type: Number },
  quantity: { type: Number },
});

// Sub-schema for equipment entries
const EquipmentEntrySchema = new Schema({
  id: { type: String },
  item: { type: String },
  grade: { type: String },
  subcategory: { type: String },
  number: { type: Number },
  length: { type: String },
  width: { type: String },
  height: { type: String },
});

// Sub-schema for specialist equipment entries
const SpecialistEquipmentEntrySchema = new Schema({
  id: { type: String },
  productId: { type: String },
  category: { type: String },
  name: { type: String },
  item: { type: String },
  number: { type: Number },
  length: { type: String },
  width: { type: String },
  height: { type: String },
  price: { type: Number },
  customData: [{ type: Schema.Types.Mixed }],
});

// Sub-schema for canopy entry
const CanopyEntrySchema = new Schema({
  id: { type: String },
  canopy: {
    type: { type: String },
    item: { type: String },
    grade: { type: String },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  filter: {
    type: { type: String },
    item: { type: String },
    grade: { type: String },
    number: { type: Number },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  canopyTotal: { type: Number },
});

// Sub-schema for ventilation information
const VentilationInfoSchema = new Schema({
  obstructionsToggle: { type: String },
  obstructionsText: { type: String },
  obstructionsManualText: { type: String },
  obstructionsOptions: [{ type: String }],
  damageToggle: { type: String },
  damageText: { type: String },
  damageManualText: { type: String },
  damageOptions: [{ type: String }],
  inaccessibleAreasToggle: { type: String },
  inaccessibleAreasText: { type: String },
  inaccessibleAreasManualText: { type: String },
  inaccessibleAreasOptions: [{ type: String }],
  clientActionsToggle: { type: String },
  clientActionsText: { type: String },
  clientActionsManualText: { type: String },
  clientActionsOptions: [{ type: String }],
  description: { type: String },
  accessLocations: [{ type: String }],
});

// Sub-schema for access requirements
const AccessRequirementsSchema = new Schema({
  inductionNeeded: { type: String },
  inductionDetails: { type: String },
  maintenanceEngineer: { type: String },
  maintenanceContact: { type: String },
  mechanicalEngineer: { type: String },
  mechanicalEngineerDetails: { type: String },
  electricalEngineer: { type: String },
  electricalContact: { type: String },
  systemIsolated: { type: String },
  roofAccess: { type: String },
  roofAccessDetails: { type: String },
  wasteTankToggle: { type: String },
  wasteTankSelection: { type: String },
  wasteTankDetails: { type: String },
  keysrequired: { type: String },
  keysContact: { type: String },
  permitToWork: { type: String },
  ppeToggle: { type: String },
  ppeMulti: [{ type: String }],
  ppeDetails: { type: String },
  frequencyOfService: { type: String },
  manning: { type: String },
  wasteManagementRequired: { type: String },
  wasteManagementDetails: { type: String },
  otherComments: { type: String },
  dbs: { type: String },
  permit: { type: String },
});

// Sub-schema for specialist equipment information
const SpecialistEquipmentInfoSchema = new Schema({
  acroPropsToggle: { type: String },
  acroPropsDropdown: { type: String },
  acroPropsInput: { type: String },
  loftBoardsToggle: { type: String },
  loftBoardsNumber: { type: String },
  loftBoardsDropdown: { type: String },
  scaffBoardsToggle: { type: String },
  scaffBoardsNumber: { type: String },
  scaffBoardsDropdown: { type: String },
  laddersToggle: { type: String },
  laddersNumber: { type: String },
  laddersDropdown: { type: String },
  laddersText: { type: String },
  mobileScaffoldTower: { type: String },
  flexiHose: { type: String },
  flexiHoseCircumference: { type: String },
  flexiHoseLength: { type: String },
  mewp: { type: String },
  notes: { type: String }, // Added field for specialist equipment notes
  categoryComments: { type: Schema.Types.Mixed }, // Store category-specific comments as a key-value object
});

// Sub-schema for site operations
const SiteOperationsSchema = new Schema({
  patronDisruption: { type: String },
  patronDisruptionDetails: { type: String },
  operationalHours: {
    weekdays: { 
      start: { type: String }, // Store as simple "HH:MM" string
      end: { type: String }    // Store as simple "HH:MM" string
    },
    weekend: { 
      start: { type: String }, // Store as simple "HH:MM" string
      end: { type: String }    // Store as simple "HH:MM" string
    }
  },
  typeOfCooking: { type: String },
  coversPerDay: { type: String },
  bestServiceTime: { type: String },
  bestServiceDay: { type: String },
  eightHoursAvailable: { type: String },
  eightHoursAvailableDetails: { type: String },
  serviceDue: { type: Date },
  approxServiceDue: { type: Boolean },
});

// Sub-schema for structure section
const StructureSchema = new Schema({
  structureId: { type: String },
  structureTotal: { type: Number },
  selectionData: [{
    type: { type: String },
    item: { type: String },
    grade: { type: String },
  }],
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
  },
  structureComments: { type: String },
});

// Sub-schema for schematic section
const SchematicSchema = new Schema({
  gridSpaces: { type: Number },
  cellSize: { type: Number },
  placedItems: [PlacedItemSchema],
  specialItems: [SpecialItemSchema],
  selectedGroupId: { type: String },
  accessDoorPrice: { type: Number },
  ventilationPrice: { type: Number },
  airPrice: { type: Number },
  fanPartsPrice: { type: Number },
  airInExTotal: { type: Number },
  schematicItemsTotal: { type: Number },
  flexiDuctSelections: { type: Schema.Types.Mixed }, // Map of item IDs to ventilation selections
  accessDoorSelections: { type: Schema.Types.Mixed }, // Map of item IDs to door selections
});

// Sub-schema for duplicated area
const DuplicatedAreaSchema = new Schema({
  id: { type: String },
  structureTotal: { type: Number },
  equipmentTotal: { type: Number },
  canopyTotal: { type: Number },
  accessDoorPrice: { type: Number },
  ventilationPrice: { type: Number },
  airPrice: { type: Number },
  fanPartsPrice: { type: Number },
  airInExTotal: { type: Number },
  schematicItemsTotal: { type: Number },
  specialistEquipmentData: [SpecialistEquipmentEntrySchema],
  groupingId: { type: String },
  structure: StructureSchema,
  equipment: [EquipmentEntrySchema],
  canopy: [CanopyEntrySchema],
  schematic: SchematicSchema,
  ventilation: VentilationInfoSchema,
});

// Main KitchenSurvey schema
const KitchenSurveySchema = new Schema(
  {
    // Basic Survey Information
    refValue: { type: String },
    surveyDate: { type: Date, default: Date.now },

    // Link to the selected Site document
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true },

    // Primary Contact Details
    primaryContact: {
      title: { type: String },
      name: { type: String },
      position: { type: String },
      number: { type: String },
      email: { type: String },
    },

    // Additional Contacts
    contacts: [
      {
        _id: { type: String },
        contactFirstName: { type: String },
        contactLastName: { type: String },
        position: { type: String },
        number: { type: String },
        email: { type: String },
        isPrimaryContact: { type: Boolean },
        isWalkAroundContact: { type: Boolean }
      },
    ],

    // General Information
    general: {
      surveyType: { type: String },
      parking: { type: String },
      dbs: { type: String },
      permit: { type: String },
    },

    // Site Operations Section
    operations: SiteOperationsSchema,

    // Access Requirements Section
    access: AccessRequirementsSchema,

    // Specialist Equipment Section
    specialistEquipment: SpecialistEquipmentInfoSchema,

    // Notes Section
    notes: {
      obstructions: [{ type: String }], // Changed from String to [String] array
      comments: { type: String },
      previousIssues: { type: String },
      damage: { type: String },
      inaccessibleAreas: { type: String },
      clientActions: { type: String },
      accessLocations: { type: String },
      clientNeedsDocument: { type: String },
      documentDetails: { type: String },
    },

    // Dedicated top-level field for storing Cloudinary image data
    // This standardizes image storage in one consistent location
    images: {
      Structure: [{ type: Schema.Types.Mixed }],
      Equipment: [{ type: Schema.Types.Mixed }],
      Canopy: [{ type: Schema.Types.Mixed }],
      Ventilation: [{ type: Schema.Types.Mixed }]
    },

    // Structure Section
    structure: StructureSchema,

    // Equipment Section - MODIFIED: Added subcategoryComments and notes fields
    equipmentSurvey: {
      entries: [EquipmentEntrySchema],
      subcategoryComments: { type: Schema.Types.Mixed }, // Store subcategory-specific comments as a key-value object
      notes: { type: String } // Added notes field for equipment section
    },

    // Specialist Equipment Survey - MODIFIED: Added categoryComments and notes fields
    specialistEquipmentSurvey: {
      entries: [SpecialistEquipmentEntrySchema],
      categoryComments: { type: Schema.Types.Mixed }, // Store category-specific comments as a key-value object
      notes: { type: String } // Added notes field for better organization
    },

    // Canopy Section
    canopySurvey: {
      entries: [CanopyEntrySchema],
    },

    // Schematic Section
    schematic: SchematicSchema,

    // Ventilation Information
    ventilationInfo: VentilationInfoSchema,

    // Duplicated Areas
    duplicatedAreas: [DuplicatedAreaSchema],

    // Totals section
    totals: {
      mainArea: {
        structureTotal: { type: Number },
        equipmentTotal: { type: Number },
        canopyTotal: { type: Number },
        accessDoorPrice: { type: Number },
        ventilationPrice: { type: Number },
        airPrice: { type: Number },
        fanPartsPrice: { type: Number },
        airInExTotal: { type: Number },
        schematicItemsTotal: { type: Number },
        modify: { type: Number },
        groupingId: { type: String },
      },
      duplicatedAreas: [{ type: Schema.Types.Mixed }],
      grandTotal: {
        structureTotal: { type: Number },
        equipmentTotal: { type: Number },
        canopyTotal: { type: Number },
        accessDoorPrice: { type: Number },
        ventilationPrice: { type: Number },
        airPrice: { type: Number },
        fanPartsPrice: { type: Number },
        airInExTotal: { type: Number },
        schematicItemsTotal: { type: Number },
      },
      modify: { type: Number, default: 0 },
    },

    // Any other raw survey data for debugging or future use
    rawSurveyData: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.models.KitchenSurvey ||
  mongoose.model("KitchenSurvey", KitchenSurveySchema);