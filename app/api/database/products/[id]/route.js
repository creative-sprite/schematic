// app\api\database\products\[id]\route.js
import dbConnect from "../../../../../lib/dbConnect";
import { Product, Form } from "../../../../../models/database/products/products";
import { formatDatabaseError } from "../../../../../components/database/products/utils/apiUtils";

/**
 * GET handler - Fetch a single product by ID
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    // Extract ID from route params
    const { id } = params;
    
    // Find the product by ID
    const product = await Product.findById(id);
    
    if (!product) {
      return new Response(
        JSON.stringify({ success: false, message: "Product not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Get the associated form to include form details
    let productWithForm = product.toObject();
    
    if (product.form) {
      const form = await Form.findById(product.form);
      if (form) {
        productWithForm.formDetails = form;
      }
    }
    
    return new Response(JSON.stringify({ success: true, data: productWithForm }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    
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
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    // Extract ID from route params
    const { id } = params;
    
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

/**
 * DELETE handler - Delete a product by ID
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    // Extract ID from route params
    const { id } = params;
    
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