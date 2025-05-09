// models\database\clients\Contact.js

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

const ContactSchema = new mongoose.Schema({
  contactFirstName: { type: String, required: true },
  contactLastName: { type: String, required: true },
  
  // Updated contact information using structured arrays with primary flags
  contactEmails: [EmailSchema],
  contactPhoneNumbers: [PhoneNumberSchema],
  
  position: { type: String },
  
  // Updated to support many-to-many relationships
  // Each contact can belong to multiple groups, chains, and sites
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  chains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chain' }],
  sites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
  
  // Legacy reference for backward compatibility
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  
  // Roles - these are being deprecated in favor of the new primary relationship system
  // Kept for backward compatibility but will be phased out
  isPrimaryContact: { type: Boolean, default: false },
  isWalkAroundContact: { type: Boolean, default: false },
  
  // New fields for primary relationship tracking
  // Flag indicating if this contact is primary for any sites
  isPrimaryForSite: { type: Boolean, default: false },
  isPrimaryForGroup: { type: Boolean, default: false },
  isPrimaryForChain: { type: Boolean, default: false },
  isPrimaryForSupplier: { type: Boolean, default: false },
  
  // Flag for walk around contact designation at the site level
  isWalkAroundForSite: { type: Boolean, default: false },
  
  contactImage: { type: String } // URL for a 200x200 image
});

// Middleware to ensure only one primary phone number and one primary email
ContactSchema.pre('save', function(next) {
  // Check phone numbers - ensure only one primary
  const primaryPhones = this.contactPhoneNumbers.filter(phone => phone.isPrimary);
  if (primaryPhones.length > 1) {
    return next(new Error('Only one phone number can be marked as primary'));
  }
  
  // Check emails - ensure only one primary
  const primaryEmails = this.contactEmails.filter(email => email.isPrimary);
  if (primaryEmails.length > 1) {
    return next(new Error('Only one email can be marked as primary'));
  }
  
  next();
});

// Virtual to find all sites where this contact is the primary
ContactSchema.virtual('primaryForSites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'primaryContact',
  justOne: false
});

// Virtual to find all groups where this contact is the primary
ContactSchema.virtual('primaryForGroups', {
  ref: 'Group',
  localField: '_id',
  foreignField: 'primaryContact',
  justOne: false
});

// Virtual to find all chains where this contact is the primary
ContactSchema.virtual('primaryForChains', {
  ref: 'Chain',
  localField: '_id',
  foreignField: 'primaryContact',
  justOne: false
});

// Virtual to find all suppliers where this contact is the primary
ContactSchema.virtual('primaryForSuppliers', {
  ref: 'Supplier',
  localField: '_id',
  foreignField: 'primaryContact',
  justOne: false
});

// Virtual to find all sites where this contact is the walk around contact
ContactSchema.virtual('walkAroundForSites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'walkAroundContact',
  justOne: false
});

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);