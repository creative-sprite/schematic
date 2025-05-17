// app\api\surveys\kitchenSurveys\route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KitchenSurvey from "@/models/database/KitchenSurvey";
import SurveyCollection from "@/models/database/SurveyCollection";
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
    if (!body.site || (!body.site._id && !body.site.id)) {
      return NextResponse.json(
        { success: false, message: "Valid site reference is required" },
        { status: 400 }
      );
    }
    
    // Extract site ID - handle both object reference and direct ID string
    const siteId = body.site._id || body.site.id || body.site;
    
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
    
    // Initialize collections array if it doesn't exist
    if (!body.collections) {
      body.collections = [];
    }
    
    // Handle backward compatibility - if collectionId exists, add it to collections array
    if (body.collectionId) {
      const oldCollectionId = body.collectionId;
      let collectionAdded = false;
      
      // Check if this collection is already in the collections array
      for (const collection of body.collections) {
        if (collection.collectionId && collection.collectionId.toString() === oldCollectionId.toString()) {
          collection.isPrimary = true;
          collection.areaIndex = body.areaIndex !== undefined ? body.areaIndex : 0;
          collectionAdded = true;
          break;
        }
      }
      
      // If not found, add it to the collections array
      if (!collectionAdded) {
        body.collections.push({
          collectionId: oldCollectionId,
          areaIndex: body.areaIndex !== undefined ? body.areaIndex : 0,
          collectionRef: body.collectionRef || "",
          isPrimary: true
        });
      }
      
      // Remove the old fields
      delete body.collectionId;
      delete body.areaIndex;
      delete body.collectionRef;
    }

    console.log(`Creating new survey for site ${siteId}${body.collections.length > 0 ? ` with ${body.collections.length} collections` : ''}`);
    
    // Create the new kitchen survey
    const newSurvey = await KitchenSurvey.create(body);
    console.log(`Created new survey with ID ${newSurvey._id}`);
    
    // Collection handling - improved approach for multiple collections
    let primaryCollectionId = null;
    
    // Process each collection in the collections array
    for (const collectionEntry of body.collections) {
      const collectionId = collectionEntry.collectionId;
      if (!collectionId) continue;
      
      // Set primaryCollectionId if this is the primary collection
      if (collectionEntry.isPrimary) {
        primaryCollectionId = collectionId;
      }
      
      // Fetch the collection to update it
      const existingCollection = await SurveyCollection.findById(collectionId);
      
      if (existingCollection) {
        console.log(`Found collection ${collectionId}, updating with new survey`);
        
        // Ensure area index is set correctly if not already provided
        let areaIndex = collectionEntry.areaIndex;
        if (areaIndex === undefined || areaIndex === null) {
          areaIndex = existingCollection.surveys.length;
        }
        
        // Add this survey to the collection if not already included
        if (!existingCollection.surveys.includes(newSurvey._id)) {
          existingCollection.surveys.push(newSurvey._id);
          existingCollection.totalAreas = existingCollection.surveys.length;
          existingCollection.updatedAt = new Date();
          await existingCollection.save();
          console.log(`Added survey ${newSurvey._id} to collection ${collectionId}, now has ${existingCollection.surveys.length} surveys`);
        } else {
          console.log(`Survey ${newSurvey._id} is already in collection ${collectionId}`);
        }
      } else {
        // Collection ID was provided but collection doesn't exist
        console.warn(`Collection ${collectionId} not found. Creating a new one.`);
        // Fall through to create a new collection
      }
    }
    
    // If no collections were provided or all collections were invalid, create a new collection
    if (body.collections.length === 0 || (body.collections.length > 0 && !primaryCollectionId)) {
      console.log(`Creating new collection for survey ${newSurvey._id}`);
      
      // Create a new collection with this survey as the first area
      const collectionData = {
        collectionRef: body.refValue || "Survey Collection",
        name: `${body.structure?.structureId || "Area"} Collection`,
        site: siteId,
        surveys: [newSurvey._id],
        totalAreas: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      try {
        const newCollection = await SurveyCollection.create(collectionData);
        primaryCollectionId = newCollection._id;
        
        console.log(`Created new collection ${primaryCollectionId} for survey ${newSurvey._id}`);
        
        // Update the survey with the new collection reference
        const updatedCollections = newSurvey.collections || [];
        updatedCollections.push({
          collectionId: primaryCollectionId,
          areaIndex: 0,
          collectionRef: collectionData.collectionRef,
          isPrimary: true
        });
        
        await KitchenSurvey.findByIdAndUpdate(newSurvey._id, {
          collections: updatedCollections
        });
        
        console.log(`Updated survey ${newSurvey._id} with collection info`);
      } catch (collError) {
        console.error(`Error creating collection for survey ${newSurvey._id}:`, collError);
        // Even if collection creation fails, we'll return the survey
      }
    }
    
    // Final verification step - this ensures the collection relationships are solid
    for (const collectionEntry of newSurvey.collections || []) {
      const collectionId = collectionEntry.collectionId;
      if (!collectionId) continue;
      
      try {
        const verifyCollection = await SurveyCollection.findById(collectionId);
        if (verifyCollection && !verifyCollection.surveys.includes(newSurvey._id)) {
          console.warn(`Survey ${newSurvey._id} not found in collection ${collectionId} during verification. Adding now.`);
          verifyCollection.surveys.push(newSurvey._id);
          verifyCollection.totalAreas = verifyCollection.surveys.length;
          verifyCollection.updatedAt = new Date();
          await verifyCollection.save();
        }
      } catch (verifyError) {
        console.warn(`Verification check failed for collection ${collectionId}:`, verifyError);
      }
    }
    
    // Return the created survey with populated site data and collection info
    try {
      const populatedSurvey = await KitchenSurvey.findById(newSurvey._id)
        .populate("site");
      
      // Add the primary collection ID to the response for backward compatibility
      const responseData = {
        ...populatedSurvey.toObject(),
        primaryCollectionId
      };
      
      return NextResponse.json(
        { success: true, data: responseData },
        { status: 201 }
      );
    } catch (populateError) {
      // If populating fails, just return the original survey with collection ID
      console.warn(`Error populating survey data: ${populateError.message}`);
      return NextResponse.json(
        { 
          success: true, 
          data: { ...newSurvey.toObject(), primaryCollectionId },
          message: "Survey created but could not populate site data"
        },
        { status: 201 }
      );
    }
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
    console.error("Error in kitchen survey creation:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}