// models\database\clients\Supplier.js

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

const SupplierSchema = new mongoose.Schema({
  // Supplier name
  supplierName: {
    type: String,
    required: true,
  },

  // Updated contact information using structured arrays with primary flags
  supplierEmails: [EmailSchema],
  supplierPhoneNumbers: [PhoneNumberSchema],

  // Supplier website
  supplierWebsite: {
    type: String,
  },

  // Address details
  addressNameNumber: {
    type: String,
  },
  addressLine1: {
    type: String,
  },
  addressLine2: {
    type: String,
  },
  town: {
    type: String,
  },
  county: {
    type: String,
  },
  country: {
    type: String,
  },
  postCode: {
    type: String,
  },

  // Contacts array referencing "Contact" model
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
  ],
  
  // Primary contact for this supplier
  primaryContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
  },

  // A field to store a supplier logo URL or path
  supplierLogo: {
    type: String,
  },

  // Removed explicit products field. We'll use virtual populate.
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

// Middleware to ensure only one primary phone number and one primary email
SupplierSchema.pre('save', function(next) {
  // Check phone numbers - ensure only one primary
  const primaryPhones = this.supplierPhoneNumbers.filter(phone => phone.isPrimary);
  if (primaryPhones.length > 1) {
    return next(new Error('Only one phone number can be marked as primary'));
  }
  
  // Check emails - ensure only one primary
  const primaryEmails = this.supplierEmails.filter(email => email.isPrimary);
  if (primaryEmails.length > 1) {
    return next(new Error('Only one email can be marked as primary'));
  }
  
  next();
});

// Virtual populate for products (AccessDoors records)
SupplierSchema.virtual('products', {
  ref: 'AccessDoors',
  localField: '_id',
  foreignField: 'supplier',
  justOne: false,
});

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);