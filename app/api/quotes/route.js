// app/api/quotes/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/database/quotes/Quote";

// GET quotes with optional surveyId filter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    
    await dbConnect();
    
    let filter = {};
    if (surveyId) {
      filter = { surveyId };
    }
    
    const quotes = await Quote.find(filter).sort({ createdAt: -1 }); // Most recent first
    
    return NextResponse.json(quotes, { status: 200 });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST a new quote
export async function POST(request) {
  try {
    const body = await request.json();
    
    await dbConnect();
    
    // Create a new quote
    const quote = await Quote.create(body);
    
    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}