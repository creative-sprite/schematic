// app\api\surveys\kitchenSurveys\viewAll\route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KitchenSurvey from "@/models/database/KitchenSurvey";
import SurveyCollection from "@/models/database/SurveyCollection";

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const collectionId = searchParams.get("collectionId");
    
    // Build query object based on parameters
    let query = {};
    
    // Filter by site if provided
    if (siteId) {
      query.site = siteId;
    }
    
    // Filter by collection if provided
    if (collectionId) {
      query.collectionId = collectionId;
    }
    
    // Find surveys with filters and populate site details
    const surveys = await KitchenSurvey.find(query)
      .populate("site", "siteName addresses")
      .sort({ surveyDate: -1 }); // Sort by survey date, newest first
    
    // If these are collection surveys, make sure areaIndex values are valid
    if (collectionId && surveys.length > 0) {
      let needsReindexing = false;
      
      // Check if we need to fix any areaIndex values
      for (let i = 0; i < surveys.length; i++) {
        if (surveys[i].areaIndex === undefined || surveys[i].areaIndex === null) {
          needsReindexing = true;
          break;
        }
      }
      
      // If needed, reindex all surveys in the collection
      if (needsReindexing) {
        console.log(`Reindexing surveys in collection ${collectionId}`);
        
        // Sort by creation date for initial indexing
        const sortedSurveys = [...surveys].sort((a, b) => 
          new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
        
        // Update all surveys with proper areaIndex values
        for (let i = 0; i < sortedSurveys.length; i++) {
          await KitchenSurvey.findByIdAndUpdate(sortedSurveys[i]._id, {
            areaIndex: i
          });
          
          // Also update in-memory survey object to reflect the change
          sortedSurveys[i].areaIndex = i;
        }
        
        // Update the collection's totalAreas count
        await SurveyCollection.findByIdAndUpdate(collectionId, {
          totalAreas: sortedSurveys.length,
          updatedAt: new Date()
        });
        
        // Return the updated surveys
        return NextResponse.json({ 
          success: true, 
          data: sortedSurveys,
          message: "Surveys fetched and reindexed" 
        });
      }
    }
    
    // Log basic info about retrieved surveys
    if (surveys.length > 0) {
      console.log(`Retrieved ${surveys.length} surveys` + 
        (collectionId ? ` for collection ${collectionId}` : "") +
        (siteId ? ` for site ${siteId}` : ""));
    }
    
    return NextResponse.json({ success: true, data: surveys });
  } catch (error) {
    console.error("Error in kitchen surveys viewAll:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}