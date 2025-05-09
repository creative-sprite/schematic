// app\api\priceList\[id]\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import { Item } from "../../../../models/database/priceList/priceList"; // Using your pricing schema

// GET method: Retrieve a single pricing item by its ObjectId
export async function GET(request, { params }) {
  const { id } = params;
  // Connect to the database
  await dbConnect();
  try {
    // Find the item by id
    const item = await Item.findById(id);
    if (!item) {
      // Return a JSON response if the item is not found
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }
    // Return the found item
    return NextResponse.json({ success: true, data: item }, { status: 200 });
  } catch (error) {
    // Return an error response if something goes wrong
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// PUT method: Update a pricing item identified by its ObjectId
export async function PUT(request, { params }) {
  const { id } = params;
  // Connect to the database
  await dbConnect();
  try {
    // Parse the JSON body from the request
    const body = await request.json();
    // Update the item using the provided data with validators enabled
    const updatedItem = await Item.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updatedItem) {
      // Return a JSON response if the item does not exist
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }
    // Return the updated item
    return NextResponse.json({ success: true, data: updatedItem }, { status: 200 });
  } catch (error) {
    // Return an error response if the update fails
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// DELETE method: Remove a pricing item identified by its ObjectId
export async function DELETE(request, { params }) {
  const { id } = params;
  // Connect to the database
  await dbConnect();
  try {
    // Delete the item by id
    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) {
      // Return a JSON response if no item is found to delete
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }
    // Return a success response with an empty data object
    return NextResponse.json({ success: true, data: {} }, { status: 200 });
  } catch (error) {
    // Return an error response if deletion fails
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
