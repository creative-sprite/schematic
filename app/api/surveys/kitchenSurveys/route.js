// app\api\surveys\kitchenSurveys\route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KitchenSurvey from "@/models/database/KitchenSurvey";
import Site from "@/models/database/clients/Site";

// Add a new GET handler to check for unique IDs
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const checkUniqueId = searchParams.get('checkUniqueId');
  
  // If we're checking for a unique ID
  if (checkUniqueId) {
    try {
      await dbConnect();
      
      // Check if any survey exists with this exact unique ID in any part of the REF
      // We check all surveys to make sure this ID is truly unique
      const pattern = new RegExp(checkUniqueId);
      const existingSurvey = await KitchenSurvey.findOne({ refValue: { $regex: pattern } });
      
      // Return true if the ID is unique (no existing survey found)
      return NextResponse.json(
        { success: true, isUnique: !existingSurvey },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error checking unique ID:', error);
      return NextResponse.json(
        { success: false, message: 'Server error', error: error.message },
        { status: 500 }
      );
    }
  }
  
  // Handle other GET requests (if you have any)
  return NextResponse.json(
    { success: false, message: "Invalid request" },
    { status: 400 }
  );
}

export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    
    // Ensure site reference is valid
    if (!body.site || !body.site._id) {
      return NextResponse.json(
        { success: false, message: "Valid site reference is required" },
        { status: 400 }
      );
    }
    
    // Extract site ID - handle both object reference and direct ID string
    const siteId = body.site._id || body.site;
    
    // Verify the site exists
    const siteExists = await Site.findById(siteId);
    if (!siteExists) {
      return NextResponse.json(
        { success: false, message: "Referenced site does not exist" },
        { status: 400 }
      );
    }
    
    // Set site to just the ID for proper referencing
    body.site = siteId;
    
    // Ensure images field exists
    if (!body.images) {
      body.images = {};
    }
    
    // Create the new kitchen survey
    const newSurvey = await KitchenSurvey.create(body);
    
    // Return the created survey with populated site data
    const populatedSurvey = await KitchenSurvey.findById(newSurvey._id)
      .populate("site");
    
    return NextResponse.json(
      { success: true, data: populatedSurvey },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation error", 
          errors: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}