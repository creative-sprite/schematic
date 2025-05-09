// app/api/cloudinary/upload/route.js
import { NextResponse } from 'next/server';
import { getCloudinaryConfig } from '@/lib/cloudinary';

/**
 * API route to handle server-side Cloudinary uploads
 * This provides more control and security than client-side uploads
 */
export async function POST(request) {
  console.log('[CloudinaryAPI] Upload request received');
  console.log('[CloudinaryAPI] Request method:', request.method);
  console.log('[CloudinaryAPI] Request headers:', Object.fromEntries([...request.headers]));
  
  try {
    // Log environment variables (without sensitive values)
    console.log('[CloudinaryAPI] Environment check:', {
      CLOUD_NAME_SET: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      API_KEY_SET: !!process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      API_SECRET_SET: !!process.env.CLOUDINARY_API_SECRET,
      UPLOAD_PRESET_SET: !!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    });
    
    // Get the cloudinary instance with proper configuration
    const cloudinary = await getCloudinaryConfig();
    console.log('[CloudinaryAPI] Got cloudinary config');
    
    // Process form data
    const formData = await request.formData();
    console.log('[CloudinaryAPI] Form data keys:', Array.from(formData.keys()));
    
    const file = formData.get('file');
    const folder = formData.get('folder') || 'surveys/uploads';
    
    console.log('[CloudinaryAPI] Folder:', folder);
    
    if (!file) {
      console.error('[CloudinaryAPI] No file provided in form data');
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('[CloudinaryAPI] File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Convert file to buffer for Cloudinary upload
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('[CloudinaryAPI] Converted file to buffer, size:', buffer.length);
    
    // Check if we should preserve the original filename or add timestamp
    const preserveFilename = formData.get('preserveFilename') === 'true';
    
    // Process the filename - either keep original or add timestamp for uniqueness
    const originalName = file.name;
    let finalFilename;
    
    if (preserveFilename) {
      // Just clean the filename without adding timestamp
      finalFilename = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
      console.log('[CloudinaryAPI] Preserving original filename (cleaned):', finalFilename);
    } else {
      // Add timestamp prefix for uniqueness (default behavior)
      const timestamp = new Date().getTime();
      finalFilename = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      console.log('[CloudinaryAPI] Generated unique filename with timestamp:', finalFilename);
    }
    
    // Upload config
    const uploadConfig = {
      folder,
      public_id: finalFilename,
      resource_type: 'auto',
      upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    };
    
    console.log('[CloudinaryAPI] Upload config:', uploadConfig);
    
    // Upload to Cloudinary using upload_stream
    console.log('[CloudinaryAPI] Starting Cloudinary upload...');
    const uploadResult = await new Promise((resolve, reject) => {
      // Create upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadConfig,
        (error, result) => {
          if (error) {
            console.error('[CloudinaryAPI] Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('[CloudinaryAPI] Cloudinary upload success:', {
              public_id: result.public_id,
              format: result.format,
              secure_url: result.secure_url
            });
            resolve(result);
          }
        }
      );
      
      // Pass buffer to stream
      uploadStream.end(buffer);
    });
    
    // Return successful response with upload details
    console.log('[CloudinaryAPI] Upload complete, returning response');
    return NextResponse.json(
      { 
        success: true, 
        data: uploadResult,
        message: 'File uploaded successfully' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CloudinaryAPI] Server error during upload:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error uploading to Cloudinary',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}