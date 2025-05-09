// app\api\database\products\customFields\updateOrder\route.js
import dbConnect from "../../../../../../lib/dbConnect";
import CustomField from "../../../../../../models/database/products/customField";

/**
 * POST handler - Update the order of multiple custom fields
 */
export async function POST(request) {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate the fields array
    if (!body.fields || !Array.isArray(body.fields) || body.fields.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Fields array is required" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Process each field update as a separate operation
    const updatePromises = body.fields.map(field => {
      // Validate field ID and order
      if (!field.id || typeof field.order !== 'number') {
        return Promise.reject(new Error(`Invalid field data: ${JSON.stringify(field)}`));
      }
      
      // Update the field in the database
      return CustomField.findByIdAndUpdate(
        field.id,
        { order: field.order },
        { new: false } // Don't need the updated document
      );
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating custom field order:", error);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}