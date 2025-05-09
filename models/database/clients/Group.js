// models\database\clients\Group.js

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

const GroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  
  // Updated contact information using structured arrays with primary flags
  groupEmails: [EmailSchema],
  groupPhoneNumbers: [PhoneNumberSchema],
  
  groupWebsite: { type: String },
  groupImage: { type: String }, // URL for a 200x200 image
  
  // Address fields for Group
  groupAddressNameNumber: { type: String },
  groupAddressLine1: { type: String },
  groupAddressLine2: { type: String },
  groupTown: { type: String },
  groupCounty: { type: String },
  groupCountry: { type: String },
  groupPostCode: { type: String },
  
  // References to related entities (already arrays, so no changes needed)
  chains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chain' }],
  sites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  
  // Primary contact for this group
  primaryContact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  
  // New fields for primary relationship tracking
  // Flag indicating if this group is primary for any sites
  isPrimaryForSite: { type: Boolean, default: false }
});

// Middleware to ensure only one primary phone number and one primary email
GroupSchema.pre('save', function(next) {
  // Check phone numbers - ensure only one primary
  const primaryPhones = this.groupPhoneNumbers.filter(phone => phone.isPrimary);
  if (primaryPhones.length > 1) {
    return next(new Error('Only one phone number can be marked as primary'));
  }
  
  // Check emails - ensure only one primary
  const primaryEmails = this.groupEmails.filter(email => email.isPrimary);
  if (primaryEmails.length > 1) {
    return next(new Error('Only one email can be marked as primary'));
  }
  
  next();
});

// Virtual to find all sites where this group is the primary
GroupSchema.virtual('primaryForSites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'primaryGroup',
  justOne: false
});

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);