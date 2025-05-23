// components/kitchenSurvey/save/savePDF/sections/imageSection.js

/**
 * Convert a File object to base64 using FileReader
 * @param {File} file - File object from form upload
 * @returns {Promise<string>} Base64 data URL
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Helper function to get image URL - converts File objects to base64
 * @param {Object} image - Image object
 * @returns {Promise<string|null>} Image URL or base64
 */
const getImageSrc = async (image) => {
  // If we have a File object, convert to base64 for PDF
  if (image.file && image.file instanceof File) {
    try {
      const base64 = await fileToBase64(image.file);
      console.log(`Converted ${image.fileName} to base64 for PDF preview`);
      return base64;
    } catch (error) {
      console.error('Error converting file to base64:', error);
      return null;
    }
  }
  
  // Use Cloudinary URL if available (uploaded images)
  if (image.url && image.url.includes('cloudinary.com')) {
    console.log('Using Cloudinary URL for PDF:', image.fileName);
    return image.url;
  }
  
  // Construct Cloudinary URL from publicId (uploaded images)
  if (image.publicId) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dnu5hunya';
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${image.publicId}`;
    console.log('Constructed Cloudinary URL for PDF:', image.fileName);
    return cloudinaryUrl;
  }
  
  // Skip blob URLs - they don't work in server-side PDF
  if (image.url && image.url.startsWith('blob:')) {
    console.log('Skipping blob URL for PDF:', image.fileName);
    return null;
  }
  
  console.log('No valid source found for PDF:', image.fileName);
  return null;
};

/**
 * Generates the survey images section of the PDF (ASYNC for base64 conversion)
 * @param {Object} data - Survey data
 * @returns {Promise<String>} HTML for the survey images section
 */
export const generateImageSection = async (data) => {
  const { images = {}, surveyImages = {} } = data || {};
  
  // Use whichever images object has data
  const imageData = Object.keys(images).length > 0 ? images : surveyImages;
  
  console.log('Starting image section generation for PDF...');
  console.log('Available image categories:', Object.keys(imageData));
  
  // Categories to display
  const categories = ['Structure', 'Equipment', 'Canopy', 'Ventilation'];
  
  // Check if any categories have images
  const categoriesWithImages = categories.filter(category => {
    const categoryImages = imageData[category];
    const hasImages = categoryImages && Array.isArray(categoryImages) && categoryImages.length > 0;
    console.log(`Category ${category}: ${hasImages ? categoryImages.length : 0} images`);
    return hasImages;
  });
  
  // If no images in any category, return empty string
  if (categoriesWithImages.length === 0) {
    console.log('No images found for PDF generation');
    return '';
  }
  
  console.log(`Processing images for PDF: ${categoriesWithImages.join(', ')}`);
  
  // Process each category
  const categorySections = [];
  
  for (const category of categoriesWithImages) {
    const categoryImages = imageData[category] || [];
    
    console.log(`\nProcessing category: ${category}`);
    console.log(`Raw images count: ${categoryImages.length}`);
    
    // Filter and process valid images - convert File objects to base64
    const validImages = [];
    
    for (let i = 0; i < categoryImages.length; i++) {
      const img = categoryImages[i];
      console.log(`Image ${i + 1}:`, {
        fileName: img.fileName,
        hasUrl: !!img.url,
        hasPublicId: !!img.publicId,
        hasFile: !!img.file,
        uploaded: img.uploaded,
        fileType: img.file ? 'File object' : 'none'
      });
      
      if (img && (img.file || img.url || img.publicId)) {
        const src = await getImageSrc(img);
        if (src) {
          validImages.push({
            ...img,
            src: src
          });
          console.log(`✓ Added image: ${img.fileName}`);
        } else {
          console.log(`✗ Skipped image: ${img.fileName} (no valid src)`);
        }
      } else {
        console.log(`✗ Skipped image: ${img.fileName || 'unnamed'} (no file, url, or publicId)`);
      }
    }
    
    console.log(`Valid images for ${category}: ${validImages.length}`);
    
    if (validImages.length === 0) {
      console.log(`No valid images found for category: ${category}`);
      continue;
    }
    
    // Calculate columns
    let columnsPerRow = 3;
    if (validImages.length === 1) columnsPerRow = 1;
    else if (validImages.length === 2) columnsPerRow = 2;
    else if (validImages.length <= 4) columnsPerRow = 2;
    
    const categoryHtml = `
      <div style="margin-bottom: 40px; page-break-inside: avoid;">
        <h3 style="
          margin-bottom: 20px; 
          
          border-bottom: 3px solid #F9C400; 
          padding-bottom: 8px;
          font-size: 18px;
          font-weight: bold;
        ">
          ${category} Images (${validImages.length})
        </h3>
        
        <div style="
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: flex-start;
          align-items: flex-start;
        ">
          ${validImages.map((image, index) => `
            <div style="
              flex: 0 0 calc(${100/columnsPerRow}% - ${(columnsPerRow-1)*15/columnsPerRow}px);
              max-width: calc(${100/columnsPerRow}% - ${(columnsPerRow-1)*15/columnsPerRow}px);
              min-width: 368px;
               
              border-radius: 8px; 
              overflow: hidden; 
              background: #ffffff;
              page-break-inside: avoid;
              
            ">
              <div style="
                width: 100%; 
                height: 180px; 
                overflow: hidden; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                background: #ffff;
              ">
                <img 
                  src="${image.src}" 
                  alt="${image.fileName || image.alt || `${category} image ${index + 1}`}"
                  style="
                    max-width: 100%; 
                    max-height: 100%; 
                    object-fit: contain;
                    display: block;
                  "
                />
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    categorySections.push(categoryHtml);
    console.log(`✓ Generated HTML for ${category} with ${validImages.length} images`);
  }
  
  if (categorySections.length === 0) {
    console.log('No valid image sections generated');
    return '';
  }
  
  console.log(`Successfully generated ${categorySections.length} image sections for PDF`);
  
  return `
    <div class="p-card" style="margin-bottom: 30px;">
        <div class="p-card-body">
            <div class="p-card-title" style="
              font-size: 24px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 25px;
              padding-bottom: 10px;
              border-bottom: 4px solid #F9C400;
            ">
              Survey Images
            </div>
            <div class="p-card-content">
                ${categorySections.join('')}
            </div>
        </div>
    </div>
  `;
};

export default generateImageSection;