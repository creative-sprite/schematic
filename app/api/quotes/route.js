// app/api/quotes/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/database/quotes/Quote";
import KitchenSurvey from "@/models/database/KitchenSurvey"; // For survey lookup

// GET quotes with optional surveyId or siteId filter
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
        const surveys = await KitchenSurvey.find({ 'site': siteId }).select('_id');
        
        if (surveys && surveys.length > 0) {
          // Get all survey IDs from this site
          const surveyIds = surveys.map(survey => survey._id);
          
          // Add to our filter
          filter.surveyId = { $in: surveyIds };
        } else {
          // No surveys found for this site, return empty array
          return NextResponse.json([], { status: 200 });
        }
      } catch (error) {
        console.warn("Error fetching site surveys:", error);
        // Continue without site filtering if there was an error
      }
    }
    
    // Execute the quotes query with our filter with projection to exclude deprecated fields
    const quotes = await Quote.find(filter)
      .select('-pdfData -metadata') // Exclude deprecated large fields
      .sort({ createdAt: -1 }); // Most recent first
    
    return NextResponse.json(quotes, { status: 200 });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to fetch quotes" 
    }, { status: 500 });
  }
}

// POST a new quote
export async function POST(request) {
  try {
    const body = await request.json();
    
    await dbConnect();
    
    // Validate the required fields
    if (!body.surveyId) {
      return NextResponse.json(
        { success: false, message: "Survey ID is required" },
        { status: 400 }
      );
    }
    
    // Validate Cloudinary data
    if (!body.cloudinary || !body.cloudinary.publicId || !body.cloudinary.url) {
      return NextResponse.json(
        { success: false, message: "Cloudinary data is required" },
        { status: 400 }
      );
    }

    // Validate name
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: "Quote name is required" },
        { status: 400 }
      );
    }

    // Ensure totalPrice is valid
    if (body.totalPrice === undefined || isNaN(parseFloat(body.totalPrice))) {
      return NextResponse.json(
        { success: false, message: "Valid total price is required" },
        { status: 400 }
      );
    }
    
    // Create a new quote with essential fields only
    const quoteData = {
      name: body.name,
      surveyId: body.surveyId,
      cloudinary: {
        publicId: body.cloudinary.publicId,
        url: body.cloudinary.url
      },
      totalPrice: Number(body.totalPrice),
      refValue: body.refValue || "",
      createdAt: new Date()
    };
    
    // For backward compatibility, optionally include these fields if provided
    if (body.schematicImg) {
      if (typeof body.schematicImg === 'object' && body.schematicImg.url) {
        quoteData.schematicImg = body.schematicImg.url;
      } else if (typeof body.schematicImg === 'string') {
        quoteData.schematicImg = body.schematicImg;
      }
    }
    
    // Create the quote with clean data
    const quote = await Quote.create(quoteData);
    
    // Get the reference value from the survey if not provided
    if (!body.refValue) {
      try {
        const survey = await KitchenSurvey.findById(body.surveyId).select('refValue');
        if (survey && survey.refValue) {
          quote.refValue = survey.refValue;
          await quote.save();
        }
      } catch (surveyError) {
        console.warn("Could not get reference value from survey:", surveyError);
      }
    }
    
    return NextResponse.json(
      { 
        success: true, 
        data: quote, 
        message: "Quote created successfully" 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to create quote" 
      },
      { status: 500 }
    );
  }
}