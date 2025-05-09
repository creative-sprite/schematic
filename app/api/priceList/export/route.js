// app\api\priceList\export\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/dbConnect";
import { Item } from "../../../../models/database/priceList/priceList";
import Papa from "papaparse";

// GET method to export pricing items as CSV
export async function GET(request) {
  try {
    // Connect to the database
    await dbConnect();
    // Fetch all items from the pricing database
    const items = await Item.find({});
    // Check if any items were returned
    if (!items.length) {
      // Return a JSON response indicating no data available if the items array is empty
      return NextResponse.json(
        { success: false, message: "No data available to export." },
        { status: 404 }
      );
    }

    /* ==== NEW CODE START - Ensure proper CSV header order ==== */
    /* This modification adds a 'fields' option to Papa.unparse */
    /* to enforce a consistent header row order for the exported CSV */
    /* so that the import mapping aligns correctly */
    const csv = Papa.unparse(
      // Map over each item and convert it into an object for CSV conversion
      items.map((item) => ({
        _id: item._id.toString(), // Convert _id to string
        category: item.category, // Category field
        subcategory: item.subcategory, // Subcategory field
        item: item.item, // Item name field
        "prices.A": item.prices?.A || "", // Price A, with fallback empty string
        "prices.B": item.prices?.B || "", // Price B, with fallback empty string
        "prices.C": item.prices?.C || "", // Price C, with fallback empty string
        "prices.D": item.prices?.D || "", // Price D, with fallback empty string
        "prices.E": item.prices?.E || "", // Price E, with fallback empty string
        svgPath: item.svgPath || "", // SVG path, with fallback empty string
      })),
      {
        // Define the order of fields for the CSV header row (this is an array)
        fields: [
          "_id",
          "category",
          "subcategory",
          "item",
          "prices.A",
          "prices.B",
          "prices.C",
          "prices.D",
          "prices.E",
          "svgPath",
        ],
      }
    );
    /* ==== NEW CODE END - Ensure proper CSV header order ==== */
    
    // Return the CSV as a file download with appropriate headers
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Disposition": "attachment; filename=export.csv",
        "Content-Type": "text/csv",
      },
    });
  } catch (error) {
    // Log any errors and return a JSON error response
    console.error("Export Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export data." },
      { status: 500 }
    );
  }
}
