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
 * Helper function to generate folder path for survey PDFs
 * @param {string} siteName - Site name for categorization
 * @param {string} surveyRef - Survey reference number/ID
 * @returns {string} Folder path for Cloudinary
 */
export const getSurveyPdfFolder = (siteName, surveyRef) => {
  // Clean values to avoid issues with special characters
  const cleanSiteName = siteName ? siteName.replace(/[:/\\?*"|<>]/g, '-') : 'unknown-site';
  const cleanRef = surveyRef ? surveyRef.replace(/[:/\\?*"|<>]/g, '-') : 'unknown';
  return `surveys/${cleanSiteName}/${cleanRef}`;
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
 * Generates a properly formatted Cloudinary URL for PDF documents
 * @param {string} publicId - The Cloudinary public ID of the PDF
 * @returns {string} Full Cloudinary URL for the PDF
 */
export const getCloudinaryPdfUrl = (publicId) => {
  if (!publicId) return null;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnu5hunya";
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
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

/**
 * Upload a PDF to Cloudinary
 * @param {string} pdfDataUrl - Base64 data URL of the PDF
 * @param {string} fileName - Name for the file
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<Object>} Upload result with publicId and URL
 */
export const uploadPdfToCloudinary = async (pdfDataUrl, fileName, folder) => {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    
    // Convert data URL to blob properly
    const base64Data = pdfDataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    // Process in chunks to avoid memory issues
    const sliceSize = 512;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    const file = new File([blob], fileName, { type: 'application/pdf' });
    
    // Add to form data
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('resource_type', 'raw'); // Important for PDFs
    
    // Use our API endpoint for upload
    const uploadRes = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error('Upload response error:', uploadRes.status, errorText);
      throw new Error(`Upload failed with status ${uploadRes.status}: ${errorText.slice(0, 200)}`);
    }
    
    return await uploadRes.json();
  } catch (error) {
    console.error('Error uploading PDF to Cloudinary:', error);
    throw error;
  }
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