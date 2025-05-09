// app\api\database\clients\suppliers\[id]\route.js

import dbConnect from "../../../../../../lib/dbConnect";
import Supplier from "../../../../../../models/database/clients/Supplier";
import { Product } from "../../../../../../models/database/products/products";

export async function GET(request, { params }) {
  try {
    await dbConnect();
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

    // Safely handle the various product types
    try {
      // Handle Products
      if (Product) {
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
    const awaitedParams = await params;
    const { id } = awaitedParams;

    const body = await request.json();
    
    // Handle phone numbers with primary flag enforcement
    if (body.supplierPhoneNumbers) {
      const hasPrimary = body.supplierPhoneNumbers.some(phone => phone.isPrimary);
      
      // If no primary is set but we have phone numbers, set the first one as primary
      if (!hasPrimary && body.supplierPhoneNumbers.length > 0) {
        body.supplierPhoneNumbers[0].isPrimary = true;
      }
      
      // Ensure only one phone number is primary
      let primaryFound = false;
      body.supplierPhoneNumbers = body.supplierPhoneNumbers.map(phone => {
        if (phone.isPrimary) {
          if (primaryFound) {
            phone.isPrimary = false;
          }
          primaryFound = true;
        }
        return phone;
      });
    }
    
    // Handle emails with primary flag enforcement
    if (body.supplierEmails) {
      const hasPrimary = body.supplierEmails.some(email => email.isPrimary);
      
      // If no primary is set but we have emails, set the first one as primary
      if (!hasPrimary && body.supplierEmails.length > 0) {
        body.supplierEmails[0].isPrimary = true;
      }
      
      // Ensure only one email is primary
      let primaryFound = false;
      body.supplierEmails = body.supplierEmails.map(email => {
        if (email.isPrimary) {
          if (primaryFound) {
            email.isPrimary = false;
          }
          primaryFound = true;
        }
        return email;
      });
    }
    
    // Remove legacy fields
    delete body.supplierContactNumbersMobile;
    delete body.supplierContactNumbersLand;
    delete body.supplierEmail;
    
    // Convert old format emails to new structure if needed
    if (typeof body.supplierEmails === 'string' || Array.isArray(body.supplierEmails) && body.supplierEmails.length > 0 && typeof body.supplierEmails[0] === 'string') {
      const oldEmails = body.supplierEmails;
      body.supplierEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    // Convert old format phone numbers to new structure if needed
    if (typeof body.supplierPhoneNumbers === 'string' || Array.isArray(body.supplierPhoneNumbers) && body.supplierPhoneNumbers.length > 0 && typeof body.supplierPhoneNumbers[0] === 'string') {
      const oldPhoneNumbers = body.supplierPhoneNumbers;
      body.supplierPhoneNumbers = Array.isArray(oldPhoneNumbers) 
        ? oldPhoneNumbers.map((phone, index) => ({ 
            phoneNumber: phone, 
            location: 'Office', 
            extension: '', 
            isPrimary: index === 0 
          }))
        : [{ phoneNumber: oldPhoneNumbers, location: 'Office', extension: '', isPrimary: true }];
    }
    
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

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const awaitedParams = await params;
    const { id } = awaitedParams;

    const deleted = await Supplier.findByIdAndDelete(id);
    if (!deleted) {
      return new Response(
        JSON.stringify({ success: false, message: "Supplier not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Supplier deleted successfully",
        data: deleted 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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