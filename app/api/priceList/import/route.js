// app\api\priceList\import\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import { Item } from "../../../../models/database/priceList/priceList";

// POST method to import pricing items from a CSV/JSON payload
export async function POST(request) {
  try {
    // Parse the JSON body of the request
    const body = await request.json();
    const { items } = body;
    // Validate that items exists and is an array
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: "No items array in request body." },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Iterate over each row in the items array
    for (const row of items) {
      // Destructure fields from the row; note the use of computed property names for prices
      const {
        _id,
        category,
        subcategory,
        item,
        ["prices.A"]: pA,
        ["prices.B"]: pB,
        ["prices.C"]: pC,
        ["prices.D"]: pD,
        ["prices.E"]: pE,
        svgPath,
        ...rest
      } = row;

      // Construct the prices object from the CSV values (an array of keys with numerical values)
      const prices = {
        A: pA ? parseFloat(pA) : 0,
        B: pB ? parseFloat(pB) : 0,
        C: pC ? parseFloat(pC) : 0,
        D: pD ? parseFloat(pD) : 0,
        E: pE ? parseFloat(pE) : 0,
      };

      // Check if an item already exists based on category, subcategory, and item
      const existingItem = await Item.findOne({ category, subcategory, item });
      if (existingItem) {
        // If the item exists, update it with the new data
        await Item.findByIdAndUpdate(existingItem._id, {
          $set: { category, subcategory, item, prices, svgPath, ...rest },
        });
      } else {
        // Otherwise, create a new item with the provided data
        await Item.create({ category, subcategory, item, prices, svgPath, ...rest });
      }
    }

    // Return a JSON response indicating a successful import
    return NextResponse.json(
      { success: true, message: "Import successful!" },
      { status: 200 }
    );
  } catch (error) {
    // Log any errors and return a JSON error response
    console.error("Error importing items:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
