// models\database\clients\Site.js

import mongoose from 'mongoose';

// Define a sub-schema for addresses.
const AddressSchema = new mongoose.Schema({
  addressNameNumber: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  town: { type: String },
  county: { type: String },
  country: { type: String },
  postCode: { type: String }
});

// Phone number schema with primary flag
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

const SiteSchema = new mongoose.Schema({
  siteName: { type: String, required: true },
  siteWebsite: { type: String },
  siteImage: { type: String }, // URL for a 200x200 image
  
  // New schemas for contact information
  sitePhoneNumbers: [PhoneNumberSchema],
  siteEmails: [EmailSchema],
  
  // Instead of individual address fields, store an array of addresses.
  addresses: [AddressSchema],
  
  // Updated to support many-to-many relationships
  // Each site can belong to multiple groups and chains
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  chains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chain' }],
  
  // Contacts associated with this site
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  
  // Primary relationship designations - only ONE of each type can be primary
  primaryGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  primaryChain: { type: mongoose.Schema.Types.ObjectId, ref: 'Chain' },
  primaryContact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  
  // Walk around contact designation - separate from primary contact
  walkAroundContact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  
  // Legacy fields for backward compatibility (these will be deprecated over time)
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  chain: { type: mongoose.Schema.Types.ObjectId, ref: 'Chain' },
  
  siteType: { type: String },
  clientType: { type: String }
});

// Middleware to ensure only one primary phone number and one primary email
SiteSchema.pre('save', function(next) {
  // Check phone numbers - ensure only one primary
  const primaryPhones = this.sitePhoneNumbers.filter(phone => phone.isPrimary);
  if (primaryPhones.length > 1) {
    return next(new Error('Only one phone number can be marked as primary'));
  }
  
  // Check emails - ensure only one primary
  const primaryEmails = this.siteEmails.filter(email => email.isPrimary);
  if (primaryEmails.length > 1) {
    return next(new Error('Only one email can be marked as primary'));
  }
  
  next();
});

export default mongoose.models.Site || mongoose.model('Site', SiteSchema);