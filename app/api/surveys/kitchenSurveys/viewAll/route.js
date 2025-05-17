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
    
    let surveys = [];
    
    // If collectionId is provided, get surveys from the collection
    if (collectionId) {
      const collection = await SurveyCollection.findById(collectionId);
      
      if (!collection) {
        return NextResponse.json(
          { success: false, message: "Collection not found" },
          { status: 404 }
        );
      }
      
      // Find all surveys that are part of this collection
      surveys = await KitchenSurvey.find({
        _id: { $in: collection.surveys }
      })
        .populate("site", "siteName addresses");
      
      // Sort by area index within this specific collection
      surveys.sort((a, b) => {
        const aIndex = a.collections?.find(c => 
          c.collectionId && c.collectionId.toString() === collectionId
        )?.areaIndex || 0;
        
        const bIndex = b.collections?.find(c => 
          c.collectionId && c.collectionId.toString() === collectionId
        )?.areaIndex || 0;
        
        return aIndex - bIndex;
      });
    } 
    // For backward compatibility - search by collections.collectionId also
    else if (collectionId) {
      surveys = await KitchenSurvey.find({
        "collections.collectionId": collectionId
      })
        .populate("site", "siteName addresses");
      
      // Sort by area index within this specific collection
      surveys.sort((a, b) => {
        const aIndex = a.collections?.find(c => 
          c.collectionId && c.collectionId.toString() === collectionId
        )?.areaIndex || 0;
        
        const bIndex = b.collections?.find(c => 
          c.collectionId && c.collectionId.toString() === collectionId
        )?.areaIndex || 0;
        
        return aIndex - bIndex;
      });
    }
    // Otherwise, use standard query
    else {
      // Find surveys with filters and populate site details
      surveys = await KitchenSurvey.find(query)
        .populate("site", "siteName addresses")
        .sort({ surveyDate: -1 }); // Sort by survey date, newest first
    }
    
    // If these are collection surveys, make sure areaIndex values are valid
    if (collectionId && surveys.length > 0) {
      let needsReindexing = false;
      
      // Check if we need to fix any areaIndex values
      for (let i = 0; i < surveys.length; i++) {
        const survey = surveys[i];
        
        // Find the collection entry for this specific collection
        const collectionEntry = survey.collections?.find(c => 
          c.collectionId && c.collectionId.toString() === collectionId
        );
        
        if (!collectionEntry || collectionEntry.areaIndex === undefined || collectionEntry.areaIndex === null) {
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
          const survey = await KitchenSurvey.findById(sortedSurveys[i]._id);
          
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
              await KitchenSurvey.findByIdAndUpdate(sortedSurveys[i]._id, {
                collections: updatedCollections
              });
              
              // Also update in-memory survey object to reflect the change
              sortedSurveys[i].collections = updatedCollections;
            } else {
              // Add this collection to the collections array if it's missing
              const updatedCollections = [...survey.collections];
              updatedCollections.push({
                collectionId: collectionId,
                areaIndex: i,
                collectionRef: "", // Will be updated later
                isPrimary: updatedCollections.length === 0 // Primary if it's the first collection
              });
              
              // Save the updated collections array
              await KitchenSurvey.findByIdAndUpdate(sortedSurveys[i]._id, {
                collections: updatedCollections
              });
              
              // Also update in-memory survey object to reflect the change
              sortedSurveys[i].collections = updatedCollections;
            }
          }
        }
        
        // Get collection ref from the collection
        const collection = await SurveyCollection.findById(collectionId);
        if (collection && collection.collectionRef) {
          // Update the collection ref on all surveys
          for (const survey of sortedSurveys) {
            const surveyObj = await KitchenSurvey.findById(survey._id);
            
            if (surveyObj && surveyObj.collections) {
              const collectionEntryIndex = surveyObj.collections.findIndex(
                entry => entry.collectionId && entry.collectionId.toString() === collectionId.toString()
              );
              
              if (collectionEntryIndex >= 0) {
                const updatedCollections = [...surveyObj.collections];
                updatedCollections[collectionEntryIndex].collectionRef = collection.collectionRef;
                
                await KitchenSurvey.findByIdAndUpdate(survey._id, {
                  collections: updatedCollections
                });
              }
            }
          }
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