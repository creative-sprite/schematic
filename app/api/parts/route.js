// app\api\parts\route.js
import dbConnect from "../../../lib/dbConnect";
import { Part } from "../../../models/database/schematicParts/parts";

// GET all parts
export async function GET() {
  await dbConnect();
  try {
    const parts = await Part.find({});
    return new Response(
      JSON.stringify({ success: true, data: parts }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// POST a new part
export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { category, subcategory, item, svgPath, aggregateEntry, requiresDimensions } = body;
  try {
    const newPart = await Part.create({ 
      category, 
      subcategory, 
      item, 
      svgPath, 
      aggregateEntry, 
      requiresDimensions 
    });
    return new Response(
      JSON.stringify({ success: true, data: newPart }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}
