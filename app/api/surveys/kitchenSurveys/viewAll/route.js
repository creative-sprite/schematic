// app\api\surveys\kitchenSurveys\viewAll\route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import KitchenSurvey from "@/models/database/KitchenSurvey";

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    
    // Build query object - if siteId is provided, filter by site
    const query = siteId ? { site: siteId } : {};
    
    // Find surveys with optional site filter and populate site details
    const surveys = await KitchenSurvey.find(query)
      .populate("site", "siteName addresses")
      .sort({ surveyDate: -1 }); // Sort by survey date, newest first
    
    // Log basic info about retrieved surveys
    if (surveys.length > 0) {
      console.log(`Retrieved ${surveys.length} surveys`);
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