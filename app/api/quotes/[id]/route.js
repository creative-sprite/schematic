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

// DELETE a quote by ID
export async function DELETE(request, { params }) {
  try {
    // Await params object before destructuring
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await dbConnect();
    const quote = await Quote.findById(id);
    
    if (!quote) {
      return NextResponse.json(
        { success: false, message: "Quote not found" },
        { status: 404 }
      );
    }
    
    // Get Cloudinary publicId for potential deletion
    const cloudinaryPublicId = quote.cloudinary?.publicId;
    const hasCloudinaryFile = !!cloudinaryPublicId;
    
    // Delete the quote from MongoDB
    await Quote.findByIdAndDelete(id);
    
    // If this quote has a Cloudinary file, attempt to delete it
    let cloudinaryResult = { deleted: false, message: "No Cloudinary file to delete" };
    
    if (hasCloudinaryFile) {
      try {
        // Delete the file from Cloudinary
        const result = await cloudinary.uploader.destroy(cloudinaryPublicId);
        
        if (result.result === 'ok') {
          cloudinaryResult = { deleted: true, message: "Cloudinary file deleted successfully" };
        } else {
          cloudinaryResult = { deleted: false, message: `Failed to delete Cloudinary file: ${result.result}` };
        }
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        cloudinaryResult = { 
          deleted: false, 
          message: "Error deleting Cloudinary file",
          error: cloudinaryError.message 
        };
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Quote deleted successfully",
      cloudinaryResult
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete quote" },
      { status: 500 }
    );
  }
}