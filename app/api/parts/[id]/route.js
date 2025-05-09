// app\api\parts\[id]\route.js
import dbConnect from "../../../../lib/dbConnect";
import { Part } from "../../../../models/database/schematicParts/parts";

// PUT update a part by id
export async function PUT(request, { params }) {
  await dbConnect();
  const { id } = await params; // Await params before using its properties
  const body = await request.json();
  const { category, subcategory, item, svgPath, aggregateEntry, requiresDimensions } = body;
  try {
    const updatedPart = await Part.findByIdAndUpdate(
      id,
      { category, subcategory, item, svgPath, aggregateEntry, requiresDimensions },
      { new: true }
    );
    return new Response(
      JSON.stringify({ success: true, data: updatedPart }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// DELETE a part by id
export async function DELETE(request, { params }) {
  await dbConnect();
  const { id } = await params; // Await params here as well
  try {
    await Part.findByIdAndDelete(id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}
