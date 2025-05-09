// app\api\database\suppliers\route.js
import dbConnect from "../../../../lib/dbConnect";
import Supplier from "../../../../models/database/clients/Supplier";

export async function GET(request) {
  try {
    await dbConnect();
    const suppliers = await Supplier.find({});
    return new Response(JSON.stringify({ success: true, data: suppliers }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const supplier = await Supplier.create(body);
    return new Response(JSON.stringify({ success: true, data: supplier }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
