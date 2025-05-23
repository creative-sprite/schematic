// app/api/quotes/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/database/quotes/Quote";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// GET a single quote by ID
export async function GET(request, { params }) {
  try {
    // Await params object in Next.js App Router to avoid dynamic route param access errors
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await dbConnect();
    
    // Select all fields except deprecated pdfData which can be very large
    const quote = await Quote.findById(id).select('-pdfData');

    if (!quote) {
      return NextResponse.json(
        { success: false, message: "Quote not found" },
        { status: 404 }
      );
    }

    // Check if related survey still exists
    const surveyExists = await quote.checkSurveyExists();

    return NextResponse.json({
      success: true,
      data: {
        ...quote.toObject(),
        surveyExists
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

// PUT to update a quote
export async function PUT(request, { params }) {
  try {
    // Await params object before destructuring
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();

    await dbConnect();
    
    // Create update object with only allowed fields
    const updateData = {};
    
    // Only allow updating certain fields
    if (body.name) updateData.name = body.name;
    if (body.refValue) updateData.refValue = body.refValue;
    if (body.totalPrice !== undefined) updateData.totalPrice = Number(body.totalPrice);
    
    // Allow updating Cloudinary info
    if (body.cloudinary && body.cloudinary.publicId && body.cloudinary.url) {
      updateData.cloudinary = {
        publicId: body.cloudinary.publicId,
        url: body.cloudinary.url
      };
    }
    
    // Update the quote with the new data
    const quote = await Quote.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, message: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
      message: "Quote updated successfully"
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update quote" },
      { status: 500 }
    );
  }
}

// Helper function to determine if a Cloudinary asset is a PDF
function isPdfAsset(publicId, url) {
  // Check if publicId ends with .pdf or contains .pdf
  if (publicId && publicId.toLowerCase().includes('.pdf')) {
    return true;
  }
  
  // Check if URL contains /raw/upload/ (indicator of raw resource type)
  if (url && url.includes('/raw/upload/')) {
    return true;
  }
  
  // Check if URL ends with .pdf
  if (url && url.toLowerCase().endsWith('.pdf')) {
    return true;
  }
  
  return false;
}

// Helper function to clean publicId for Cloudinary deletion
function cleanPublicIdForDeletion(publicId) {
  if (!publicId) return publicId;
  
  // For PDFs, we need to remove the .pdf extension from the publicId for deletion
  // Cloudinary stores PDFs without the extension in the publicId
  if (publicId.toLowerCase().endsWith('.pdf')) {
    return publicId.replace(/\.pdf$/i, '');
  }
  
  return publicId;
}

// DELETE a quote by ID
export async function DELETE(request, { params }) {
  try {
    // Await params object before destructuring
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      console.log("No ID provided in DELETE request");
      return NextResponse.json(
        { success: false, message: "Quote ID is required" },
        { status: 400 }
      );
    }

    console.log(`DELETE request for quote ID: ${id}`);

    await dbConnect();
    
    // Try to find the quote with more flexible ID handling
    let quote;
    try {
      quote = await Quote.findById(id);
      console.log(`Quote lookup result:`, quote ? `Found: ${quote.name || quote._id}` : 'Not found');
    } catch (dbError) {
      console.error("Database error during quote lookup:", dbError);
      return NextResponse.json(
        { success: false, message: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
    
    if (!quote) {
      console.log(`Quote not found with ID: ${id}`);
      // Let's also try to list some quotes for debugging
      try {
        const allQuotes = await Quote.find({}).limit(5).select('_id name');
        console.log("Sample quotes in database:", allQuotes.map(q => ({ id: q._id.toString(), name: q.name })));
      } catch (err) {
        console.log("Could not fetch sample quotes for debugging");
      }
      
      return NextResponse.json(
        { success: false, message: "Quote not found" },
        { status: 404 }
      );
    }
    
    console.log(`Found quote to delete: ${quote.name || 'Unnamed'} (ID: ${quote._id})`);
    
    // Get Cloudinary publicId and URL for potential deletion
    const cloudinaryPublicId = quote.cloudinary?.publicId;
    const cloudinaryUrl = quote.cloudinary?.url;
    const hasCloudinaryFile = !!cloudinaryPublicId;
    
    console.log(`Quote has Cloudinary file: ${hasCloudinaryFile}, PublicID: ${cloudinaryPublicId}`);
    
    // Delete the quote from MongoDB first
    try {
      await Quote.findByIdAndDelete(id);
      console.log(`Successfully deleted quote from database: ${id}`);
    } catch (deleteError) {
      console.error("Error deleting quote from database:", deleteError);
      return NextResponse.json(
        { success: false, message: `Failed to delete quote: ${deleteError.message}` },
        { status: 500 }
      );
    }
    
    // If this quote has a Cloudinary file, attempt to delete it
    let cloudinaryResult = { deleted: false, message: "No Cloudinary file to delete" };
    
    if (hasCloudinaryFile) {
      try {
        // Determine if this is a PDF or image file
        const isPdf = isPdfAsset(cloudinaryPublicId, cloudinaryUrl);
        console.log(`Cloudinary file is PDF: ${isPdf}`);
        
        // Clean the publicId for deletion (remove .pdf extension for PDFs)
        const cleanedPublicId = cleanPublicIdForDeletion(cloudinaryPublicId);
        console.log(`Cleaned publicId: ${cleanedPublicId} (from: ${cloudinaryPublicId})`);
        
        // Set the appropriate resource type for deletion
        const deleteOptions = {
          resource_type: isPdf ? 'raw' : 'image'
        };
        
        console.log(`Attempting Cloudinary deletion with options:`, deleteOptions);
        
        // Delete the file from Cloudinary with the correct resource type
        const result = await cloudinary.uploader.destroy(cleanedPublicId, deleteOptions);
        
        console.log(`Cloudinary deletion result:`, result);
        
        if (result.result === 'ok') {
          cloudinaryResult = { 
            deleted: true, 
            message: `Cloudinary ${isPdf ? 'PDF' : 'image'} deleted successfully`,
            resourceType: deleteOptions.resource_type,
            originalPublicId: cloudinaryPublicId,
            cleanedPublicId: cleanedPublicId
          };
        } else if (result.result === 'not found') {
          cloudinaryResult = { 
            deleted: false, 
            message: `Cloudinary file not found (may have been already deleted)`,
            resourceType: deleteOptions.resource_type,
            originalPublicId: cloudinaryPublicId,
            cleanedPublicId: cleanedPublicId
          };
        } else {
          cloudinaryResult = { 
            deleted: false, 
            message: `Failed to delete Cloudinary file: ${result.result}`,
            resourceType: deleteOptions.resource_type,
            originalPublicId: cloudinaryPublicId,
            cleanedPublicId: cleanedPublicId
          };
        }
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        cloudinaryResult = { 
          deleted: false, 
          message: "Error deleting Cloudinary file",
          error: cloudinaryError.message,
          originalPublicId: cloudinaryPublicId
        };
      }
    }

    console.log("DELETE operation completed successfully");
    return NextResponse.json({ 
      success: true, 
      message: "Quote deleted successfully",
      cloudinaryResult
    }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in DELETE operation:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete quote" },
      { status: 500 }
    );
  }
}