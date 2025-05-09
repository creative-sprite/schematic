// app\api\priceList\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import { Item } from "../../../models/database/priceList/priceList"; // Using your pricing schema

// GET method: Fetch all pricing items
export async function GET(request) {
  try {
    // Connect to the database
    await dbConnect();
    // Retrieve all items from the pricing collection
    const items = await Item.find({});
    // Return the items in a JSON response
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (error) {
    // Return an error response if the query fails
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// POST method: Create a new pricing item
export async function POST(request) {
  try {
    // Connect to the database
    await dbConnect();
    // Parse the request body to JSON
    const body = await request.json();
    // Create a new item using the provided data
    const newItem = await Item.create(body);
    // Return the newly created item in a JSON response
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error) {
    // Return an error response if creation fails
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
