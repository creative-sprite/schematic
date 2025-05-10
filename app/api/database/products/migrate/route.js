// app/api/database/products/migrate/route.js
import dbConnect from "@/lib/dbConnect";
import { Product } from "@/models/database/products/products";
import CustomField from "@/models/database/products/customField";

export async function POST(request) {
  try {
    await dbConnect();
    console.log('Connected to the database');

    // Perform the migration directly in the API route for better control
    // Fetch all custom fields
    const customFields = await CustomField.find({});
    console.log(`Found ${customFields.length} custom fields`);

    // Build a map of field IDs to field details for quick lookup
    const fieldMap = new Map();
    customFields.forEach(field => {
      fieldMap.set(field._id.toString(), {
        fieldName: field.label,
        fieldType: field.fieldType,
        prefix: field.prefix || "",
        suffix: field.suffix || "",
      });
    });

    // Fetch all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    // Track stats
    let updatedCount = 0;
    let skippedCount = 0;
    let errors = [];

    // Process each product
    for (const product of products) {
      try {
        // Skip if product has no custom data
        if (!product.customData || product.customData.length === 0) {
          skippedCount++;
          continue;
        }

        let needsUpdate = false;
        const updatedCustomData = product.customData.map(data => {
          // Get the field ID as string
          const fieldId = data.fieldId.toString();
          
          // Skip if all metadata is already present
          if (data.fieldName && data.fieldType) {
            return data;
          }

          // Look up the field metadata from our map
          const fieldInfo = fieldMap.get(fieldId);
          if (!fieldInfo) {
            console.warn(`Could not find metadata for field ${fieldId} in product ${product._id}`);
            return data;
          }

          // Mark that this product needs updating
          needsUpdate = true;

          // Return updated data with field metadata
          return {
            ...data,
            fieldName: data.fieldName || fieldInfo.fieldName,
            fieldType: data.fieldType || fieldInfo.fieldType,
            prefix: data.prefix || fieldInfo.prefix || "",
            suffix: data.suffix || fieldInfo.suffix || "",
          };
        });

        // Update the product if changes were made
        if (needsUpdate) {
          product.customData = updatedCustomData;
          await product.save();
          updatedCount++;
          console.log(`Updated product ${product._id}`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error processing product ${product._id}:`, error);
        errors.push({
          productId: product._id,
          error: error.message,
        });
      }
    }

    const results = {
      updatedCount,
      skippedCount,
      errors
    };

    console.log('Migration completed:');
    console.log(`- Products updated: ${updatedCount}`);
    console.log(`- Products skipped: ${skippedCount}`);
    console.log(`- Errors: ${errors.length}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Migration completed successfully",
      results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Migration failed:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message || "Migration failed" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}