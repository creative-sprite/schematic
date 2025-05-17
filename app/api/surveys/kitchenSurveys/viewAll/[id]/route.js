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
    
    // Convert to object for manipulation
    const surveyData = survey.toObject();
    
    // Handle collections information
    if (survey.collections && survey.collections.length > 0) {
      // Find the primary collection
      const primaryCollection = survey.collections.find(c => c.isPrimary) || survey.collections[0];
      const collectionId = primaryCollection.collectionId;
      
      // Fetch additional information about collections
      const collectionInfoList = [];
      
      for (const collectionEntry of survey.collections) {
        if (!collectionEntry.collectionId) continue;
        
        try {
          const collection = await SurveyCollection.findById(collectionEntry.collectionId)
            .select('collectionRef name totalAreas');
          
          if (collection) {
            collectionInfoList.push({
              id: collection._id,
              name: collection.name,
              totalAreas: collection.totalAreas,
              collectionRef: collection.collectionRef,
              areaIndex: collectionEntry.areaIndex,
              isPrimary: collectionEntry.isPrimary
            });
          }
        } catch (err) {
          console.warn(`Could not fetch info for collection ${collectionEntry.collectionId}:`, err);
        }
      }
      
      // Attach collection data to the survey response
      surveyData.collectionsInfo = collectionInfoList;
      
      // For backward compatibility, also include the primary collection info directly
      if (primaryCollection && primaryCollection.collectionId) {
        const collection = await SurveyCollection.findById(primaryCollection.collectionId)
          .select('collectionRef name totalAreas');
        
        if (collection) {
          surveyData.collectionInfo = {
            name: collection.name,
            totalAreas: collection.totalAreas,
            collectionRef: collection.collectionRef
          };
          
          // For backward compatibility, also add these direct fields
          surveyData.collectionId = primaryCollection.collectionId;
          surveyData.areaIndex = primaryCollection.areaIndex;
          surveyData.collectionRef = primaryCollection.collectionRef;
        }
      }
    }

    return NextResponse.json({ success: true, data: surveyData });
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
    
    // Handle backward compatibility for collection data
    if (body.collectionId && !body.collections) {
      // Add to collections array if only collectionId provided
      body.collections = [{
        collectionId: body.collectionId,
        areaIndex: body.areaIndex !== undefined ? body.areaIndex : 0,
        collectionRef: body.collectionRef || "",
        isPrimary: true
      }];
      
      // Remove old fields to avoid conflicts
      delete body.collectionId;
      delete body.areaIndex;
      delete body.collectionRef;
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
    
    // Update collection information if structure ID changed
    if (body.structure?.structureId && updatedSurvey.collections) {
      // Loop through all collections
      for (const collectionEntry of updatedSurvey.collections) {
        if (!collectionEntry.collectionId) continue;
        
        // Check if collection needs updating
        const collection = await SurveyCollection.findById(collectionEntry.collectionId);
        if (collection) {
          // If this is the first survey (areaIndex 0), update collection name
          if (collectionEntry.areaIndex === 0) {
            collection.name = `${body.structure.structureId} Collection`;
            await collection.save();
          }
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
    // Find the survey first to check if it's in collections
    const survey = await KitchenSurvey.findById(id);
    
    if (!survey) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }
    
    // If survey is part of collections, remove it from all collections
    if (survey.collections && survey.collections.length > 0) {
      for (const collectionEntry of survey.collections) {
        const collectionId = collectionEntry.collectionId;
        if (!collectionId) continue;
        
        const collection = await SurveyCollection.findById(collectionId);
        
        if (collection) {
          // Remove the survey from the collection's surveys array
          collection.surveys = collection.surveys.filter(
            surveyId => surveyId.toString() !== id
          );
          
          // Update total areas count
          collection.totalAreas = collection.surveys.length;
          
          // If this was the last survey, delete the collection
          if (collection.surveys.length === 0) {
            await SurveyCollection.findByIdAndDelete(collectionId);
          } 
          // Otherwise save the updated collection
          else {
            await collection.save();
            
            // Reindex the remaining surveys
            const remainingSurveys = await KitchenSurvey.find({
              _id: { $in: collection.surveys }
            }).sort({ areaIndex: 1 });
            
            for (let i = 0; i < remainingSurveys.length; i++) {
              // Look for this survey in the collections array
              const survey = await KitchenSurvey.findById(remainingSurveys[i]._id);
              
              if (survey && survey.collections) {
                // Find the specific collection entry for this collection
                const collectionEntryIndex = survey.collections.findIndex(
                  entry => entry.collectionId && entry.collectionId.toString() === collectionId.toString()
                );
                
                if (collectionEntryIndex >= 0) {
                  // Update the area index in this specific collection
                  const updatedCollections = [...survey.collections];
                  updatedCollections[collectionEntryIndex].areaIndex = i;
                  
                  // Save the updated collections array
                  await KitchenSurvey.findByIdAndUpdate(remainingSurveys[i]._id, {
                    collections: updatedCollections
                  });
                }
              }
            }
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
      
      // If the original survey was part of collections, add this one too
      if (originalSurvey.collections && originalSurvey.collections.length > 0) {
        for (const collectionEntry of originalSurvey.collections) {
          const collectionId = collectionEntry.collectionId;
          if (!collectionId) continue;
          
          const collection = await SurveyCollection.findById(collectionId);
          
          if (collection) {
            // Add the new survey to the collection
            collection.surveys.push(newSurvey._id);
            collection.totalAreas = collection.surveys.length;
            await collection.save();
            
            // Get the collections array from the new survey
            const newSurveyObj = await KitchenSurvey.findById(newSurvey._id);
            const updatedCollections = newSurveyObj.collections || [];
            
            // Add this collection to the new survey's collections array
            updatedCollections.push({
              collectionId: collection._id,
              areaIndex: collection.surveys.length - 1,
              collectionRef: collection.collectionRef,
              isPrimary: collectionEntry.isPrimary
            });
            
            // Save the updated collections array
            await KitchenSurvey.findByIdAndUpdate(newSurvey._id, {
              collections: updatedCollections
            });
            
            console.log(`Added new version to collection ${collection._id}`);
          }
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