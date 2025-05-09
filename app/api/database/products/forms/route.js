// app\api\database\products\forms\route.js
import dbConnect from "../../../../../lib/dbConnect";
import { Form } from "../../../../../models/database/products/products";
import { formatDatabaseError } from "../../../../../components/database/products/utils/apiUtils";

/**
 * GET handler - Fetch all forms
 */
export async function GET(request) {
  try {
    await dbConnect();
    const forms = await Form.find({});
    
    return new Response(JSON.stringify({ success: true, data: forms }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    
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
 * POST handler - Create a new form
 */
export async function POST(request) {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.category || !body.name || !body.type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Category, name, and type are required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Create the form
    const form = await Form.create(body);
    
    return new Response(JSON.stringify({ success: true, data: form }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating form:", error);
    
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
 * DELETE handler - Delete a form by ID
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
    
    // Find and delete the form
    const deletedForm = await Form.findByIdAndDelete(id);
    
    if (!deletedForm) {
      return new Response(
        JSON.stringify({ success: false, message: "Form not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(JSON.stringify({ success: true, data: deletedForm }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting form:", error);
    
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
 * PUT handler - Update a form by ID
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
    if (!body.category || !body.name || !body.type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Category, name, and type are required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Update the form
    const updatedForm = await Form.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!updatedForm) {
      return new Response(
        JSON.stringify({ success: false, message: "Form not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(JSON.stringify({ success: true, data: updatedForm }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating form:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: formatDatabaseError(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}