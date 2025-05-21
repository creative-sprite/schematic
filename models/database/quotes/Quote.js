const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for the quote'],
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    // Reference to the original survey
    surveyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KitchenSurvey',
        required: [true, 'Survey ID is required']
    },
    // Cloudinary storage for PDF document
    cloudinary: {
        publicId: {
            type: String,
            required: [true, 'Cloudinary public ID is required']
        },
        url: {
            type: String,
            required: [true, 'Cloudinary URL is required']
        }
    },
    // Essential reference data for display
    refValue: {
        type: String,
        required: false
    },
    // Financial information - only store total price, not all breakdowns
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    // Creation date
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // Legacy fields - kept for backwards compatibility but marked as deprecated
    pdfData: {
        type: String,
        required: false,
        deprecated: true
    },
    schematicImg: {
        type: String,
        required: false,
        deprecated: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        deprecated: true
    }
});

// Add indexes for better query performance
QuoteSchema.index({ surveyId: 1 });
QuoteSchema.index({ createdAt: -1 });
QuoteSchema.index({ 'cloudinary.publicId': 1 });
QuoteSchema.index({ refValue: 1 });
QuoteSchema.index({ totalPrice: 1 });

/**
 * Get URL for the PDF
 * @returns {string} The Cloudinary URL or legacy pdfData
 */
QuoteSchema.methods.getPdfUrl = function() {
    return this.cloudinary?.url || this.pdfData || null;
};

/**
 * Check if this quote's survey still exists
 * @param {Function} callback Optional callback function
 * @returns {Promise<boolean>} True if the survey exists
 */
QuoteSchema.methods.checkSurveyExists = async function(callback) {
    try {
        const KitchenSurvey = mongoose.model('KitchenSurvey');
        const exists = await KitchenSurvey.exists({ _id: this.surveyId });
        
        if (callback && typeof callback === 'function') {
            callback(null, !!exists);
        }
        
        return !!exists;
    } catch (error) {
        if (callback && typeof callback === 'function') {
            callback(error, false);
        }
        return false;
    }
};

module.exports = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema);