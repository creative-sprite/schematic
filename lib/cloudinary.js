// lib/cloudinary.js
// Client-safe version of Cloudinary helpers

/**
 * Helper function to generate folder path for survey images
 * @param {string} siteName - Site name for categorization (optional)
 * @param {string} surveyRef - Survey reference number/ID
 * @param {string} category - Image category (Structure, Equipment, Canopy, Ventilation)
 * @returns {string} Folder path for Cloudinary
 */
export const getSurveyImageFolder = (siteName, surveyRef, category) => {
  // Clean values to avoid issues with special characters
  const cleanSiteName = siteName ? siteName.replace(/[:/\\?*"|<>]/g, '-') : 'unknown-site';
  const cleanRef = surveyRef ? surveyRef.replace(/[:/\\?*"|<>]/g, '-') : 'unknown';
  return `surveys/${cleanSiteName}/${cleanRef}/${category.toLowerCase()}`;
};

/**
 * Generates a properly formatted Cloudinary URL from a public ID
 * @param {string} publicId - The Cloudinary public ID of the image
 * @returns {string} Full Cloudinary URL
 */
export const getCloudinaryUrl = (publicId) => {
  if (!publicId) return null;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnu5hunya";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
};

/**
 * Helper to create a client-side upload signature
 * Used for secure client-side uploads
 */
export const getUploadSignature = () => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  // This would normally be handled by a server endpoint for security
  // For client-side uploads with preset, we don't need a signature
  return { timestamp };
};

// Export Cloudinary configuration for server components
export async function getCloudinaryConfig() {
  // Dynamic import for server-side only
  const { v2: cloudinary } = await import('cloudinary');
  
  // Configure with environment variables
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return cloudinary;
}