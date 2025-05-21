// app/api/cloudinary/upload/route.js
import { NextResponse } from 'next/server';
import { getCloudinaryConfig } from '@/lib/cloudinary';

/**
 * API route to handle server-side Cloudinary uploads
 * This provides more control and security than client-side uploads
 * Supports both images and PDF documents with optimizations
 */
export async function POST(request) {
  try {
    // Get the cloudinary instance with proper configuration
    const cloudinary = await getCloudinaryConfig();
    
    // Process form data
    const formData = await request.formData();
    
    const file = formData.get('file');
    const folder = formData.get('folder') || 'surveys/uploads';
    const resourceType = formData.get('resource_type') || 'auto';
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Determine if this is a PDF from the file type or name
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    // Create buffer from file
    let buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch (bufferError) {
      return NextResponse.json(
        { success: false, message: 'Error processing file buffer', error: bufferError.message },
        { status: 500 }
      );
    }
    
    // Check if we should preserve the original filename
    const preserveFilename = formData.get('preserveFilename') === 'true';
    
    // Process the filename
    const originalName = file.name;
    let finalFilename;
    
    if (preserveFilename) {
      // Clean the filename without adding timestamp
      finalFilename = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    } else {
      // Add timestamp prefix for uniqueness
      const timestamp = new Date().getTime();
      finalFilename = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    }
    
    // Basic upload config
    const uploadConfig = {
      folder,
      // Public ID set differently for PDFs vs other file types
      resource_type: resourceType,
      upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    };
    
    // PDF-specific optimizations
    if (isPdf) {
      // For PDFs, keep the .pdf extension in the public_id if not already present
      uploadConfig.public_id = finalFilename.endsWith('.pdf') ? 
        finalFilename : 
        `${finalFilename}.pdf`;
      
      // Ensure PDF uploads use 'raw' resource type
      uploadConfig.resource_type = 'raw';
      
      // PDF-specific configurations
      if (!uploadConfig.upload_preset) {
        // Add these only if an upload preset isn't specified
        
        // Add tags for better organization
        uploadConfig.tags = ['pdf', 'quote', 'kitchen_survey'];
        
        // Add optimization flags for PDFs
        uploadConfig.use_filename = true;
        uploadConfig.unique_filename = true;
        uploadConfig.overwrite = false;
      }
    } else {
      // For non-PDFs, we can remove the extension as before
      uploadConfig.public_id = finalFilename.replace(/\.[^/.]+$/, "");
    }
    
    // Upload to Cloudinary using upload_stream
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        // Create upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadConfig,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        // Pass buffer to stream
        uploadStream.end(buffer);
      });
      
      // For PDFs, ensure we're returning the correct URL format
      if (isPdf) {
        // Make sure URL ends with .pdf extension for proper download
        if (uploadResult.secure_url && !uploadResult.secure_url.endsWith('.pdf')) {
          uploadResult.secure_url = `${uploadResult.secure_url}.pdf`;
        }
        
        // Sometimes Cloudinary returns a different URL format for RAW files
        if (uploadResult.secure_url && !uploadResult.secure_url.includes('/raw/upload/')) {
          // Fix URL format if needed
          const correctUrl = uploadResult.secure_url.replace('/upload/', '/raw/upload/');
          uploadResult.secure_url = correctUrl.endsWith('.pdf') ? correctUrl : `${correctUrl}.pdf`;
        }
      }
      
      // Return successful response with upload details
      return NextResponse.json(
        { 
          success: true, 
          data: uploadResult,
          message: 'File uploaded successfully' 
        },
        { status: 200 }
      );
    } catch (uploadError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Error during Cloudinary upload',
          error: uploadError.message,
          details: uploadError.details || 'No additional details available'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error uploading to Cloudinary',
        error: error.message
      },
      { status: 500 }
    );
  }
}