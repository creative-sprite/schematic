// app\api\database\clients\groups\route.js
import dbConnect from "../../../../../lib/dbConnect";
import Group from "../../../../../models/database/clients/Group";

// GET all groups
export async function GET() {
  await dbConnect();
  try {
    const groups = await Group.find({});
    return new Response(JSON.stringify({ success: true, data: groups }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// POST new group
export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  try {
    // Handle phone numbers with primary flag enforcement
    if (body.groupPhoneNumbers) {
      const hasPrimary = body.groupPhoneNumbers.some(phone => phone.isPrimary);
      
      // If no primary is set but we have phone numbers, set the first one as primary
      if (!hasPrimary && body.groupPhoneNumbers.length > 0) {
        body.groupPhoneNumbers[0].isPrimary = true;
      }
      
      // Ensure only one phone number is primary
      let primaryFound = false;
      body.groupPhoneNumbers = body.groupPhoneNumbers.map(phone => {
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
    if (body.groupEmails) {
      const hasPrimary = body.groupEmails.some(email => email.isPrimary);
      
      // If no primary is set but we have emails, set the first one as primary
      if (!hasPrimary && body.groupEmails.length > 0) {
        body.groupEmails[0].isPrimary = true;
      }
      
      // Ensure only one email is primary
      let primaryFound = false;
      body.groupEmails = body.groupEmails.map(email => {
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
    delete body.groupContactNumbersMobile;
    delete body.groupContactNumbersLand;
    if (typeof body.groupEmails === 'string' || Array.isArray(body.groupEmails) && body.groupEmails.length > 0 && typeof body.groupEmails[0] === 'string') {
      // Convert old format emails to new structure
      const oldEmails = body.groupEmails;
      body.groupEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    const newGroup = await Group.create(body);
    return new Response(JSON.stringify({ success: true, data: newGroup }), {
      status: 201,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}