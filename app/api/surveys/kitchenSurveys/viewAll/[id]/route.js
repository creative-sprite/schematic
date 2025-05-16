// app\api\surveys\kitchenSurveys\viewAll\[id]\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import KitchenSurvey from "../../../../../../models/database/KitchenSurvey";
import SurveyCollection from "../../../../../../models/database/SurveyCollection";

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
    // Get the survey with populated site data
    const survey = await KitchenSurvey.findById(id).populate("site");
    
    if (!survey) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }
    
    // If this survey is part of a collection, fetch collection info
    if (survey.collectionId) {
      const collection = await SurveyCollection.findById(survey.collectionId)
        .select('collectionRef name totalAreas');
      
      // If collection exists, attach info to response
      if (collection) {
        // Attach collection data to the survey response
        const surveyData = survey.toObject();
        surveyData.collectionInfo = {
          name: collection.name,
          totalAreas: collection.totalAreas,
          collectionRef: collection.collectionRef
        };
        
        return NextResponse.json({ success: true, data: surveyData });
      }
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error) {
    console.error(`Error fetching survey ${id}:`, error);
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
    
    // Remove any child areas references from body if they exist
    if (body.childAreas) {
      delete body.childAreas;
    }
    
    // Update the survey
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
    
    // If this is part of a collection and structureId changed, update collection
    if (body.structure?.structureId && updatedSurvey.collectionId) {
      // Check if collection needs updating
      const collection = await SurveyCollection.findById(updatedSurvey.collectionId);
      if (collection) {
        // If this is the first survey (areaIndex 0), update collection name
        if (updatedSurvey.areaIndex === 0) {
          collection.name = `${body.structure.structureId} Collection`;
          await collection.save();
        }
      }
    }
    
    return NextResponse.json({ success: true, data: updatedSurvey });
  } catch (error) {
    console.error(`Error updating survey ${id}:`, error);
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
    // Find the survey first to check if it's in a collection
    const survey = await KitchenSurvey.findById(id);
    
    if (!survey) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }
    
    // If survey is part of a collection, remove it from the collection
    if (survey.collectionId) {
      const collection = await SurveyCollection.findById(survey.collectionId);
      
      if (collection) {
        // Remove the survey from the collection's surveys array
        collection.surveys = collection.surveys.filter(
          surveyId => surveyId.toString() !== id
        );
        
        // Update total areas count
        collection.totalAreas = collection.surveys.length;
        
        // If this was the last survey, delete the collection
        if (collection.surveys.length === 0) {
          await SurveyCollection.findByIdAndDelete(survey.collectionId);
        } 
        // Otherwise save the updated collection
        else {
          await collection.save();
          
          // Reindex the remaining surveys
          const remainingSurveys = await KitchenSurvey.find({
            _id: { $in: collection.surveys }
          }).sort({ areaIndex: 1 });
          
          for (let i = 0; i < remainingSurveys.length; i++) {
            await KitchenSurvey.findByIdAndUpdate(remainingSurveys[i]._id, {
              areaIndex: i
            });
          }
        }
      }
    }
    
    // Now delete the survey
    const deletedSurvey = await KitchenSurvey.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      data: {},
      message: "Survey deleted successfully" 
    });
  } catch (error) {
    console.error(`Error deleting survey ${id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}

// PATCH handler for creating a new version of a survey - keep this functionality
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
      // Remove any parent/child fields
      const newSurveyData = {
          ...originalSurvey,
          _id: undefined, // Remove the original ID to create a new document
          refValue: newRefValue, // Set the new REF value
          surveyDate: new Date(), // Update survey date to current date
          createdAt: new Date(), // Set current timestamp for creation
          updatedAt: new Date(), // Set current timestamp for last update
      };
      
      // Remove any child area references
      if (newSurveyData.childAreas) {
          delete newSurveyData.childAreas;
      }
      if (newSurveyData.parentSurvey) {
          delete newSurveyData.parentSurvey;
      }
      
      // Create the new survey
      const newSurvey = await KitchenSurvey.create(newSurveyData);
      
      // If the original survey was part of a collection, add this one too
      if (originalSurvey.collectionId) {
        const collection = await SurveyCollection.findById(originalSurvey.collectionId);
        
        if (collection) {
          // Add the new survey to the collection
          collection.surveys.push(newSurvey._id);
          collection.totalAreas = collection.surveys.length;
          await collection.save();
          
          // Update the new survey with collection info
          await KitchenSurvey.findByIdAndUpdate(newSurvey._id, {
            collectionId: collection._id,
            areaIndex: collection.surveys.length - 1,
            collectionRef: collection.collectionRef
          });
          
          console.log(`Added new version to collection ${collection._id}`);
        }
      }
      
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