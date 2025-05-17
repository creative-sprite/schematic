// app\api\surveys\collections\route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SurveyCollection from "@/models/database/SurveyCollection";
import KitchenSurvey from "@/models/database/KitchenSurvey";

// Create a new collection
export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.collectionRef || !body.site) {
      return NextResponse.json(
        { success: false, message: "Collection reference and site are required" },
        { status: 400 }
      );
    }
    
    // Create the collection with initial values
    const collection = await SurveyCollection.create({
      collectionRef: body.collectionRef,
      name: body.name || "Survey Collection",
      site: body.site,
      surveys: body.surveys || [],
      totalAreas: body.surveys?.length || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // If surveys were provided, update them to include the collection reference
    if (body.surveys && body.surveys.length > 0) {
      // Update each survey with collection info
      for (let i = 0; i < body.surveys.length; i++) {
        const surveyId = body.surveys[i];
        const survey = await KitchenSurvey.findById(surveyId);
        
        if (survey) {
          // Get the current collections array
          const collections = survey.collections || [];
          
          // Check if this collection is already in the array
          const existingIndex = collections.findIndex(
            entry => entry.collectionId && entry.collectionId.toString() === collection._id.toString()
          );
          
          if (existingIndex >= 0) {
            // Update the existing entry
            collections[existingIndex].areaIndex = i;
            collections[existingIndex].collectionRef = body.collectionRef;
          } else {
            // Add the new collection entry
            collections.push({
              collectionId: collection._id,
              areaIndex: i,
              collectionRef: body.collectionRef,
              isPrimary: body.setAsPrimary || (collections.length === 0) // Set as primary if it's the first collection or specified
            });
            
            // If this is set as primary, ensure no other collection is primary
            if (body.setAsPrimary) {
              for (let j = 0; j < collections.length - 1; j++) {
                collections[j].isPrimary = false;
              }
            }
          }
          
          // Update the survey with the modified collections array
          await KitchenSurvey.findByIdAndUpdate(surveyId, { collections: collections });
        }
      }
      
      console.log(`Updated ${body.surveys.length} surveys with collection reference`);
    }
    
    return NextResponse.json(
      { success: true, data: collection },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Get all collections or filter by site
export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const surveyId = searchParams.get("surveyId");
    
    // Different query modes
    if (surveyId) {
      // If surveyId is provided, find all collections that contain this survey
      const survey = await KitchenSurvey.findById(surveyId);
      
      if (!survey) {
        return NextResponse.json(
          { success: false, message: "Survey not found" },
          { status: 404 }
        );
      }
      
      // Get collection IDs from the survey's collections array
      const collectionIds = (survey.collections || [])
        .filter(entry => entry.collectionId)
        .map(entry => entry.collectionId);
      
      // Fetch the collections
      const collections = await SurveyCollection.find({
        _id: { $in: collectionIds }
      })
        .populate("site", "siteName addresses")
        .populate({
          path: "surveys",
          select: "refValue structure.structureId areaIndex createdAt",
          options: { sort: { areaIndex: 1 } }
        })
        .sort({ createdAt: -1 });
      
      return NextResponse.json({ success: true, data: collections });
    }
    else {
      // Standard site-based query
      let query = {};
      if (siteId) {
        query.site = siteId;
      }
      
      // Find collections and populate both site and surveys for more detailed information
      const collections = await SurveyCollection.find(query)
        .populate("site", "siteName addresses")
        .populate({
          path: "surveys",
          select: "refValue structure.structureId collections createdAt",
          options: { sort: { createdAt: 1 } }
        })
        .sort({ createdAt: -1 });
      
      // Count areas for each collection and make sure totalAreas is accurate
      for (const collection of collections) {
        // Update totalAreas if it doesn't match the actual count
        if (collection.surveys.length !== collection.totalAreas) {
          collection.totalAreas = collection.surveys.length;
          await collection.save();
        }
      }
      
      return NextResponse.json({ success: true, data: collections });
    }
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}