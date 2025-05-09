// app\api\database\clients\chains\route.js
import dbConnect from "../../../../../lib/dbConnect";
import Chain from "../../../../../models/database/clients/Chain";

// GET all chains
export async function GET() {
  await dbConnect();
  try {
    const chains = await Chain.find({});
    return new Response(JSON.stringify({ success: true, data: chains }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// POST new chain
export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  try {
    // Handle phone numbers with primary flag enforcement
    if (body.chainPhoneNumbers) {
      const hasPrimary = body.chainPhoneNumbers.some(phone => phone.isPrimary);
      
      // If no primary is set but we have phone numbers, set the first one as primary
      if (!hasPrimary && body.chainPhoneNumbers.length > 0) {
        body.chainPhoneNumbers[0].isPrimary = true;
      }
      
      // Ensure only one phone number is primary
      let primaryFound = false;
      body.chainPhoneNumbers = body.chainPhoneNumbers.map(phone => {
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
    if (body.chainEmails) {
      const hasPrimary = body.chainEmails.some(email => email.isPrimary);
      
      // If no primary is set but we have emails, set the first one as primary
      if (!hasPrimary && body.chainEmails.length > 0) {
        body.chainEmails[0].isPrimary = true;
      }
      
      // Ensure only one email is primary
      let primaryFound = false;
      body.chainEmails = body.chainEmails.map(email => {
        if (email.isPrimary) {
          if (primaryFound) {
            email.isPrimary = false;
          }
          primaryFound = true;
        }
        return email;
      });
    }
    
    // Remove legacy fields if they exist
    delete body.chainContactNumbersMobile;
    delete body.chainContactNumbersLand;
    if (typeof body.chainEmails === 'string' || Array.isArray(body.chainEmails) && body.chainEmails.length > 0 && typeof body.chainEmails[0] === 'string') {
      // Convert old format emails to new structure
      const oldEmails = body.chainEmails;
      body.chainEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    const newChain = await Chain.create(body);
    return new Response(JSON.stringify({ success: true, data: newChain }), {
      status: 201,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}