// app\api\database\clients\contacts\route.js
import dbConnect from "../../../../../lib/dbConnect";
import Contact from "../../../../../models/database/clients/Contact";

// GET contacts with optional site filter
export async function GET(request) {
  await dbConnect();
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const siteId = url.searchParams.get('site');
    
    let query = {};
    
    // Add site filter for both many-to-many and legacy single reference
    if (siteId) {
      query.$or = [
        { sites: siteId },  // Many-to-many relationship
        { site: siteId }    // Legacy single site reference
      ];
    }
    
    // Populate related fields if needed
    const contacts = await Contact.find(query);
    
    return new Response(
      JSON.stringify({ success: true, data: contacts }),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/database/clients/contacts error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// POST new contact
export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    
    // Handle phone numbers with primary flag enforcement
    if (body.contactPhoneNumbers) {
      const hasPrimary = body.contactPhoneNumbers.some(phone => phone.isPrimary);
      
      // If no primary is set but we have phone numbers, set the first one as primary
      if (!hasPrimary && body.contactPhoneNumbers.length > 0) {
        body.contactPhoneNumbers[0].isPrimary = true;
      }
      
      // Ensure only one phone number is primary
      let primaryFound = false;
      body.contactPhoneNumbers = body.contactPhoneNumbers.map(phone => {
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
    if (body.contactEmails) {
      const hasPrimary = body.contactEmails.some(email => email.isPrimary);
      
      // If no primary is set but we have emails, set the first one as primary
      if (!hasPrimary && body.contactEmails.length > 0) {
        body.contactEmails[0].isPrimary = true;
      }
      
      // Ensure only one email is primary
      let primaryFound = false;
      body.contactEmails = body.contactEmails.map(email => {
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
    delete body.contactNumbersMobile;
    delete body.contactNumbersLand;
    if (typeof body.contactEmails === 'string' || Array.isArray(body.contactEmails) && body.contactEmails.length > 0 && typeof body.contactEmails[0] === 'string') {
      // Convert old format emails to new structure
      const oldEmails = body.contactEmails;
      body.contactEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    // Create new contact in database
    const contact = await Contact.create(body);
    
    return new Response(
      JSON.stringify({ success: true, data: contact }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/database/clients/contacts error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}