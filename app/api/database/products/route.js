// app\api\database\products\route.js
import dbConnect from "../../../../lib/dbConnect";
import { Product } from "../../../../models/database/products/products";
import { formatDatabaseError } from "../../../../components/database/products/utils/apiUtils";

/**
 * GET handler - Fetch all products
 */
export async function GET(request) {
  try {
    await dbConnect();
    const products = await Product.find({});
    
    return new Response(JSON.stringify({ success: true, data: products }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: formatDatabaseError(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * POST handler - Create a new product
 */
export async function POST(request) {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.category || !body.name || !body.type || !body.form) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Category, name, type, and form are required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Create the product
    const product = await Product.create(body);
    
    return new Response(JSON.stringify({ success: true, data: product }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: formatDatabaseError(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * DELETE handler - Delete a product by ID
 */
export async function DELETE(request) {
  try {
    await dbConnect();
    
    // Extract ID from query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "ID parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Find and delete the product
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return new Response(
        JSON.stringify({ success: false, message: "Product not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(JSON.stringify({ success: true, data: deletedProduct }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: formatDatabaseError(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * PUT handler - Update a product by ID
 */
export async function PUT(request) {
  try {
    await dbConnect();
    
    // Extract ID from query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, message: "ID parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.category || !body.name || !body.type || !body.form) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Category, name, type, and form are required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return new Response(
        JSON.stringify({ success: false, message: "Product not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(JSON.stringify({ success: true, data: updatedProduct }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: formatDatabaseError(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}