// app/api/quotes/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/database/quotes/Quote";

// GET a single quote by ID
export async function GET(request, { params }) {
  try {
    // Await params object in Next.js App Router to avoid dynamic route param access errors
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

    // Determine PDF source for the response data
    let pdfSource = "none";
    if (quote.cloudinary && quote.cloudinary.url) {
      pdfSource = "cloudinary";
    } else if (quote.pdfData) {
      pdfSource = "database";
    }

    return NextResponse.json({
      success: true,
      data: quote,
      pdfSource: pdfSource
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json(
      { success: false, message: error.message },
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
    
    // If we're updating Cloudinary info and still have pdfData, clear pdfData to save space
    if (body.cloudinary && body.cloudinary.url && body.pdfData) {
      console.log(`Clearing pdfData from quote ${id} since Cloudinary storage is now used`);
      body.pdfData = null;
    }
    
    // Update the quote with the new data
    const quote = await Quote.findByIdAndUpdate(id, body, {
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
      { success: false, message: error.message },
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
    
    // Note Cloudinary info for potential cleanup (not implemented here)
    const cloudinaryInfo = quote.cloudinary;
    
    // Delete the quote from MongoDB
    await Quote.findByIdAndDelete(id);
    
    // Optional: If you want to also delete the PDF from Cloudinary, you could
    // implement that here using the cloudinaryInfo

    return NextResponse.json({ 
      success: true, 
      message: "Quote deleted successfully",
      cloudinaryInfo: cloudinaryInfo // Return this in case caller wants to cleanup Cloudinary
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}