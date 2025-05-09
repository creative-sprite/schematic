// app\api\surveys\kitchenSurveys\viewAll\[id]\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import KitchenSurvey from "../../../../../../models/database/KitchenSurvey";

// Helper function to generate the next alphabetic version
// Examples: A -> B -> C -> ... -> Z -> AA -> AB -> ... -> ZZ -> AAA -> etc.
function generateNextVersion(current) {
    if (!current) return "A"; // Start with A if nothing provided
    
    // Convert to uppercase to ensure consistency
    current = current.toUpperCase();
    
    // Convert to array of characters
    const chars = current.split("");
    
    // Start from the rightmost character and increment
    let index = chars.length - 1;
    let carry = true;
    
    while (carry && index >= 0) {
        // If current char is Z, reset to A and carry over
        if (chars[index] === "Z") {
            chars[index] = "A";
            carry = true;
        } else {
            // Otherwise, increment the character
            chars[index] = String.fromCharCode(chars[index].charCodeAt(0) + 1);
            carry = false;
        }
        index--;
    }
    
    // If we still have a carry, we need to add another "A" at the beginning
    if (carry) {
        chars.unshift("A");
    }
    
    return chars.join("");
}

export async function GET(request, { params }) {
  // Await params object in Next.js App Router to avoid dynamic route param access errors
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  await dbConnect();
  try {
    const survey = await KitchenSurvey.findById(id).populate("site");
    if (!survey) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

export async function PUT(request, { params }) {
  // Await params object in Next.js App Router to avoid dynamic route param access errors
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  await dbConnect();
  try {
    const body = await request.json();
    
    // Ensure images field exists
    if (!body.images) {
      body.images = {};
    }
    
    const updatedSurvey = await KitchenSurvey.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updatedSurvey) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updatedSurvey });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  // Await params object in Next.js App Router to avoid dynamic route param access errors
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  await dbConnect();
  try {
    const deletedSurvey = await KitchenSurvey.findByIdAndDelete(id);
    if (!deletedSurvey) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

// New PATCH handler for creating a new version of a survey
export async function PATCH(request, { params }) {
  // Await params object in Next.js App Router to avoid dynamic route param access errors
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  await dbConnect();
  
  try {
      // Find the original survey by ID
      const originalSurvey = await KitchenSurvey.findById(id).lean();
      
      if (!originalSurvey) {
          return NextResponse.json(
              { success: false, message: "Original survey not found" },
              { status: 404 }
          );
      }
      
      // Ensure the images field exists
      if (!originalSurvey.images) {
        originalSurvey.images = {};
      }
      
      // Parse the REF ID to extract its parts
      let refParts = ["", "", "", ""];
      if (originalSurvey.refValue) {
          refParts = originalSurvey.refValue.split('/');
          
          // Make sure we have exactly 4 parts
          if (refParts.length !== 4) {
              return NextResponse.json(
                  { success: false, message: "Invalid REF ID format in original survey" },
                  { status: 400 }
              );
          }
      }
      
      // Generate the next version letter
      const currentVersionPart = refParts[3];
      let nextVersionPart = generateNextVersion(currentVersionPart);
      
      // Create a new REF ID with the updated version part
      let newRefValue = `${refParts[0]}/${refParts[1]}/${refParts[2]}/${nextVersionPart}`;
      
      // Check if a survey with this reference already exists
      let existingSurvey = await KitchenSurvey.findOne({ refValue: newRefValue });
      
      // Keep incrementing the version until we find an unused reference
      while (existingSurvey) {
          // Generate the next version
          nextVersionPart = generateNextVersion(nextVersionPart);
          newRefValue = `${refParts[0]}/${refParts[1]}/${refParts[2]}/${nextVersionPart}`;
          
          // Check again
          existingSurvey = await KitchenSurvey.findOne({ refValue: newRefValue });
      }
      
      // Create a new survey object based on the original
      const newSurveyData = {
          ...originalSurvey,
          _id: undefined, // Remove the original ID to create a new document
          refValue: newRefValue, // Set the new REF value
          surveyDate: new Date(), // Update survey date to current date
          createdAt: new Date(), // Set current timestamp for creation
          updatedAt: new Date(), // Set current timestamp for last update
      };
      
      // Create the new survey
      const newSurvey = await KitchenSurvey.create(newSurveyData);
      
      // Return the new survey with populated data
      const populatedSurvey = await KitchenSurvey.findById(newSurvey._id)
          .populate("site");
      
      return NextResponse.json(
          { 
              success: true, 
              data: populatedSurvey,
              message: `New version created (${nextVersionPart})` 
          },
          { status: 201 }
      );
  } catch (error) {
      console.error("Error creating survey version:", error);
      
      return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
      );
  }
}