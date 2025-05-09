// models\database\clients\Chain.js

import mongoose from 'mongoose';

// Define a sub-schema for phone numbers with primary flag
const PhoneNumberSchema = new mongoose.Schema({
  location: { type: String },
  phoneNumber: { type: String },
  extension: { type: String },
  isPrimary: { type: Boolean, default: false }
});

// Email schema with primary flag
const EmailSchema = new mongoose.Schema({
  email: { type: String },
  location: { type: String },
  isPrimary: { type: Boolean, default: false }
});

const ChainSchema = new mongoose.Schema({
  chainName: { type: String, required: true },
  
  // Updated contact information using structured arrays with primary flags
  chainEmails: [EmailSchema],
  chainPhoneNumbers: [PhoneNumberSchema],
  
  chainWebsite: { type: String },
  chainImage: { type: String },
  
  // Address fields for Chain
  chainAddressNameNumber: { type: String },
  chainAddressLine1: { type: String },
  chainAddressLine2: { type: String },
  chainTown: { type: String },
  chainCounty: { type: String },
  chainCountry: { type: String },
  chainPostCode: { type: String },
  
  // Updated to support many-to-many relationships
  // Each chain can belong to multiple groups
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  
  // Related sites and contacts
  sites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  
  // Primary entities for this chain
  primaryGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  primaryContact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  
  // Legacy support
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  
  // New fields for primary relationship tracking
  // Flag indicating if this chain is primary for any sites
  isPrimaryForSite: { type: Boolean, default: false }
});

// Middleware to ensure only one primary phone number and one primary email
ChainSchema.pre('save', function(next) {
  // Check phone numbers - ensure only one primary
  const primaryPhones = this.chainPhoneNumbers.filter(phone => phone.isPrimary);
  if (primaryPhones.length > 1) {
    return next(new Error('Only one phone number can be marked as primary'));
  }
  
  // Check emails - ensure only one primary
  const primaryEmails = this.chainEmails.filter(email => email.isPrimary);
  if (primaryEmails.length > 1) {
    return next(new Error('Only one email can be marked as primary'));
  }
  
  next();
});

// Virtual to find all sites where this chain is the primary
ChainSchema.virtual('primaryForSites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'primaryChain',
  justOne: false
});

export default mongoose.models.Chain || mongoose.model('Chain', ChainSchema);