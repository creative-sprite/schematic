// app\api\database\products\customFields\route.js
import dbConnect from "../../../../../lib/dbConnect";
import CustomField from "../../../../../models/database/products/customField";
import { formatDatabaseError } from "../../../../../components/database/products/utils/apiUtils";

/**
 * GET handler - Fetch all custom fields
 */
export async function GET(request) {
  try {
    await dbConnect();
    const customFields = await CustomField.find({}).sort({ order: 1 });
    
    return new Response(JSON.stringify({ success: true, data: customFields }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    
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
 * POST handler - Create a new custom field
 */
export async function POST(request) {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.label || !body.fieldType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Label and field type are required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // For field types that need options, validate they exist
    if (
      ['dropdown', 'radio', 'checkbox', 'select'].includes(body.fieldType) &&
      (!body.options || body.options.length === 0)
    ) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Options are required for ${body.fieldType} field type` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Create the custom field
    const customField = await CustomField.create(body);
    
    return new Response(JSON.stringify({ success: true, data: customField }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating custom field:", error);
    
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
 * PUT handler - Update an existing custom field
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
    if (!body.label || !body.fieldType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Label and field type are required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Update the custom field
    const updatedField = await CustomField.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!updatedField) {
      return new Response(
        JSON.stringify({ success: false, message: "Custom field not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(JSON.stringify({ success: true, data: updatedField }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating custom field:", error);
    
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
 * DELETE handler - Delete a custom field by ID
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
    
    // Find and delete the custom field
    const deletedField = await CustomField.findByIdAndDelete(id);
    
    if (!deletedField) {
      return new Response(
        JSON.stringify({ success: false, message: "Custom field not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(JSON.stringify({ success: true, data: deletedField }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: formatDatabaseError(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}