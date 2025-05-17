const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for the quote'],
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    pdfData: {
        type: String,
        required: false // Changed from required to optional
    },
    // New fields for Cloudinary storage
    cloudinary: {
        publicId: {
            type: String,
            required: false
        },
        url: {
            type: String,
            required: false
        }
    },
    schematicImg: {
        type: String,
        required: false
    },
    surveyData: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    siteDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    refValue: {
        type: String,
        required: false
    },
    surveyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KitchenSurvey',
        required: [true, 'Survey ID is required']
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add an index on surveyId for faster lookup
QuoteSchema.index({ surveyId: 1 });

module.exports = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);