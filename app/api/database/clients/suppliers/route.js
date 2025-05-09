// app\api\database\clients\suppliers\route.js
import dbConnect from "../../../../../lib/dbConnect";
import Supplier from "../../../../../models/database/clients/Supplier";

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