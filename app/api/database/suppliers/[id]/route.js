// app\api\database\suppliers\[id]\route.js

import dbConnect from "../../../../../lib/dbConnect";
import Supplier from "../../../../../models/database/clients/Supplier";
import { Product } from "../../../../../models/database/products/products";

// Make sure to import these models if they exist
// If you don't have these models or aren't using them, modify the code appropriately
let AccessDoors, StructuralEquipment, OtherEquipment;

export async function GET(request, { params }) {
  try {
    await dbConnect();
    // Must await params before using
    const awaitedParams = await params;
    const { id } = awaitedParams;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return new Response(
        JSON.stringify({ success: false, message: "Supplier not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supplierData = supplier.toObject();
    supplierData.products = [];

    // Safely handle the various product types only if the models are loaded
    try {

      // Handle Products
      if (Product) {
        // Try both ObjectId and string comparison
        const productsCollection = await Product.find({
          suppliers: supplier._id,
        });
        
        supplierData.products.push(
          ...productsCollection.map((item) => ({
            ...item.toObject(),
            productType: "Product",
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching related products:", e);
      // Don't fail the entire request if product fetching fails
    }

    return new Response(JSON.stringify({ success: true, data: supplierData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in supplier GET:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    // Must await params before using
    const awaitedParams = await params;
    const { id } = awaitedParams;

    const body = await request.json();
    const updated = await Supplier.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return new Response(
        JSON.stringify({ success: false, message: "Supplier not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(JSON.stringify({ success: true, data: updated }), {
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