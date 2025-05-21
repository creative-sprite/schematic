// app/api/quotes/generate/route.js
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
// UPDATED: Import the standard functions from cloudinary.js
import { getCloudinaryConfig, getSurveyPdfFolder, getCloudinaryPdfUrl } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    // Parse request body
    const { html, fileName, options, folder } = await request.json();

    if (!html) {
      return NextResponse.json(
        { success: false, message: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Get Cloudinary configuration
    const cloudinary = await getCloudinaryConfig();

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    try {
      const page = await browser.newPage();

      // Set content and wait for rendering to complete
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF with options
      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        printBackground: options?.printBackground !== false,
        margin: options?.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
        displayHeaderFooter: options?.displayHeaderFooter || false,
        headerTemplate: options?.headerTemplate || '',
        footerTemplate: options?.footerTemplate || '',
      });

      // UPDATED: Extract site name and ref from provided folder path
      let siteName = 'unknown-site';
      let refValue = 'unknown';
      
      if (folder) {
        // Parse the folder to extract site name and ref
        const parts = folder.split('/');
        
        // Standard path is "surveys/siteName/refValue"
        if (parts.length >= 2 && parts[0] === 'surveys') {
          siteName = parts[1] || siteName;
          
          if (parts.length >= 3) {
            refValue = parts[2] || refValue;
          }
        }
      }
      
      // UPDATED: Use the standard function to create a consistent folder path
      const uploadFolder = getSurveyPdfFolder(siteName, refValue);
      
      console.log("Uploading quote PDF to folder:", uploadFolder);
      
      // IMPROVED: Prepare filename - ensure it's clean and doesn't already have .pdf extension
      const cleanFileName = fileName.replace(/\.[^/.]+$/, ''); // Remove any existing extension
      const pdfFileName = `${cleanFileName}.pdf`;
      
      // Upload to Cloudinary with PDF-specific settings
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw', // PDFs must use 'raw' type
            public_id: cleanFileName, // Use clean filename without extension
            folder: uploadFolder,
            format: 'pdf',
            tags: ['pdf', 'quote', 'kitchen_survey']
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(pdfBuffer);
      });

      await browser.close();

      // IMPROVED: Store publicId as-is, without adding .pdf extension
      // (will be added by getCloudinaryPdfUrl function when needed)
      const pdfPublicId = uploadResult.public_id;
      
      // UPDATED: Use the standard PDF URL construction function for consistency
      const pdfUrl = getCloudinaryPdfUrl(pdfPublicId);
      
      console.log("Generated PDF URL:", pdfUrl);
      console.log("Public ID:", pdfPublicId);
      console.log("Original Cloudinary URL:", uploadResult.secure_url);

      return NextResponse.json({
        success: true,
        pdfUrl: pdfUrl,
        publicId: pdfPublicId,
        message: 'PDF generated and uploaded successfully',
      });
      
    } catch (error) {
      await browser.close();
      throw error;
    }
    
  } catch (error) {
    console.error('PDF generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `PDF generation failed: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}