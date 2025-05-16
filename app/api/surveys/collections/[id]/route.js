// app\api\surveys\collections\[id]\route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SurveyCollection from "@/models/database/SurveyCollection";
import KitchenSurvey from "@/models/database/KitchenSurvey";

// Get a specific collection with its surveys
export async function GET(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  await dbConnect();
  
  try {
    // Find collection and populate related data
    const collection = await SurveyCollection.findById(id)
      .populate("site", "siteName addresses")
      .populate({
        path: "surveys",
        select: "refValue structure areaIndex surveyDate createdAt",
        options: { sort: { areaIndex: 1 } }
      });
    
    if (!collection) {
      return NextResponse.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }
    
    // Verify totalAreas matches actual count and update if needed
    if (collection.surveys.length !== collection.totalAreas) {
      collection.totalAreas = collection.surveys.length;
      await collection.save();
      console.log(`Updated totalAreas for collection ${id} to ${collection.surveys.length}`);
    }
    
    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    console.error(`Error fetching collection ${id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Add a survey to a collection
export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  await dbConnect();
  
  try {
    const body = await request.json();
    
    if (!body.surveyId) {
      return NextResponse.json(
        { success: false, message: "Survey ID is required" },
        { status: 400 }
      );
    }
    
    // Find the collection
    const collection = await SurveyCollection.findById(id);
    if (!collection) {
      return NextResponse.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }
    
    // Check if survey exists
    const survey = await KitchenSurvey.findById(body.surveyId);
    if (!survey) {
      return NextResponse.json(
        { success: false, message: "Survey not found" },
        { status: 404 }
      );
    }
    
    // Determine area index for the survey (use provided index or next available)
    const areaIndex = body.areaIndex !== undefined 
      ? body.areaIndex 
      : collection.surveys.length;
    
    // Add survey to collection if not already included
    if (!collection.surveys.includes(body.surveyId)) {
      collection.surveys.push(body.surveyId);
      collection.totalAreas = collection.surveys.length;
      
      // Update collection's lastModified date
      collection.updatedAt = new Date();
      
      await collection.save();
      console.log(`Added survey ${body.surveyId} to collection ${id} at index ${areaIndex}`);
    }
    
    // Update the survey with collection information
    await KitchenSurvey.findByIdAndUpdate(body.surveyId, {
      collectionId: id,
      areaIndex: areaIndex,
      collectionRef: collection.collectionRef
    });
    
    // Ensure all surveys in this collection have the correct collection reference
    for (const surveyId of collection.surveys) {
      await KitchenSurvey.findByIdAndUpdate(surveyId, {
        collectionId: id,
        collectionRef: collection.collectionRef
      });
    }
    
    // Log detailed collection state for debugging
    console.log(`Collection ${id} now has ${collection.surveys.length} surveys`);
    
    return NextResponse.json({ 
      success: true, 
      data: collection,
      message: `Survey added to collection at index ${areaIndex}`
    });
  } catch (error) {
    console.error(`Error adding survey to collection ${id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Remove a survey from a collection
export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  await dbConnect();
  
  try {
    const body = await request.json();
    
    if (!body.surveyId) {
      return NextResponse.json(
        { success: false, message: "Survey ID is required" },
        { status: 400 }
      );
    }
    
    const collection = await SurveyCollection.findById(id);
    if (!collection) {
      return NextResponse.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }
    
    // Find the survey's current index for logging
    const currentIndex = collection.surveys.findIndex(
      surveyId => surveyId.toString() === body.surveyId
    );
    
    // Remove the survey from the collection
    collection.surveys = collection.surveys.filter(
      surveyId => surveyId.toString() !== body.surveyId
    );
    
    // Update collection count and save
    collection.totalAreas = collection.surveys.length;
    collection.updatedAt = new Date();
    await collection.save();
    
    // Update the survey to remove collection reference
    await KitchenSurvey.findByIdAndUpdate(body.surveyId, {
      $unset: { collectionId: "", areaIndex: "", collectionRef: "" }
    });
    
    console.log(`Removed survey ${body.surveyId} from collection ${id} (was at index ${currentIndex})`);
    
    // If this was the last survey in the collection, delete the collection
    if (collection.surveys.length === 0) {
      await SurveyCollection.findByIdAndDelete(id);
      return NextResponse.json({ 
        success: true, 
        message: "Survey removed and empty collection deleted"
      });
    }
    
    // Otherwise, reindex the remaining surveys to close gaps in areaIndex values
    const remainingSurveys = await KitchenSurvey.find({
      _id: { $in: collection.surveys }
    }).sort({ areaIndex: 1 });
    
    // Reassign area indices
    for (let i = 0; i < remainingSurveys.length; i++) {
      await KitchenSurvey.findByIdAndUpdate(remainingSurveys[i]._id, {
        areaIndex: i
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: collection,
      message: "Survey removed from collection and remaining surveys reindexed"
    });
  } catch (error) {
    console.error(`Error removing survey from collection ${id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Update collection properties
export async function PUT(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  await dbConnect();
  
  try {
    const body = await request.json();
    
    // Validate that something is being updated
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: "No update data provided" },
        { status: 400 }
      );
    }
    
    // Find the collection
    const collection = await SurveyCollection.findById(id);
    if (!collection) {
      return NextResponse.json(
        { success: false, message: "Collection not found" },
        { status: 404 }
      );
    }
    
    // Update allowed fields
    if (body.name) collection.name = body.name;
    if (body.collectionRef) {
      collection.collectionRef = body.collectionRef;
      
      // Update collectionRef on all member surveys
      for (const surveyId of collection.surveys) {
        await KitchenSurvey.findByIdAndUpdate(surveyId, {
          collectionRef: body.collectionRef
        });
      }
    }
    
    collection.updatedAt = new Date();
    await collection.save();
    
    return NextResponse.json({ 
      success: true, 
      data: collection,
      message: "Collection updated successfully" 
    });
  } catch (error) {
    console.error(`Error updating collection ${id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}