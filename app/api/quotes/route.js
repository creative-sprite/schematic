// app/api/quotes/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/database/quotes/Quote";

// GET quotes with optional surveyId filter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    const siteId = searchParams.get('siteId');
    
    await dbConnect();
    
    let filter = {};
    
    // Apply search filters if provided
    if (surveyId) {
      filter.surveyId = surveyId;
    }
    
    // If siteId is provided, we need to get all surveys from this site first
    if (siteId) {
      try {
        // Get all surveys that belong to this site
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/surveys/kitchenSurveys/viewAll?siteId=${siteId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            // Get all survey IDs from this site
            const surveyIds = data.data.map(survey => survey._id);
            
            // Add to our filter
            filter.surveyId = { $in: surveyIds };
          } else {
            // No surveys found for this site, return empty array
            return NextResponse.json([], { status: 200 });
          }
        }
      } catch (error) {
        console.warn("Error fetching site surveys:", error);
        // Continue without site filtering if there was an error
      }
    }
    
    // Execute the quotes query with our filter
    const quotes = await Quote.find(filter).sort({ createdAt: -1 }); // Most recent first
    
    return NextResponse.json(quotes, { status: 200 });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST a new quote
export async function POST(request) {
  try {
    const body = await request.json();
    
    await dbConnect();
    
    // Validate the request
    if (!body.surveyId) {
      return NextResponse.json(
        { success: false, message: "Survey ID is required" },
        { status: 400 }
      );
    }
    
    // NEW: Validate Cloudinary data if present
    if (body.cloudinary) {
      if (!body.cloudinary.publicId || !body.cloudinary.url) {
        return NextResponse.json(
          { success: false, message: "Incomplete Cloudinary data provided" },
          { status: 400 }
        );
      }
    }
    
    // NEW: If pdfData is provided but we also have cloudinary info, we can clear pdfData
    // This allows us to migrate existing quotes to Cloudinary storage and save DB space
    if (body.pdfData && body.cloudinary && body.cloudinary.publicId && body.cloudinary.url) {
      // Clear the large pdfData to save space, since we now have it in Cloudinary
      body.pdfData = null;
      console.log("Cleared pdfData from quote as it's now stored in Cloudinary");
    }
    
    // Check if we need to ensure one of pdfData or cloudinary exists
    if (!body.pdfData && (!body.cloudinary || !body.cloudinary.url)) {
      console.warn("Creating quote without PDF data - either pdfData or cloudinary.url should be provided");
    }
    
    // Create a new quote
    const quote = await Quote.create(body);
    
    return NextResponse.json(
      { success: true, data: quote, message: "Quote created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}