// app\api\database\clients\sites\route.js
import dbConnect from "../../../../../lib/dbConnect";
import Site from "../../../../../models/database/clients/Site";

// GET all sites
export async function GET(request) {
  await dbConnect();
  // Parse search parameter from the request URL
  const { search } = Object.fromEntries(new URL(request.url).searchParams);
  const query = {};
  if (search) {
    // Filter sites based on a case-insensitive match on siteName
    query.siteName = { $regex: search, $options: "i" };
  }
  try {
    const sites = await Site.find(query);
    return new Response(
      JSON.stringify({ success: true, data: sites }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// POST new site
export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  
  try {
    // Handle phone numbers with primary flag enforcement
    if (body.sitePhoneNumbers) {
      const hasPrimary = body.sitePhoneNumbers.some(phone => phone.isPrimary);
      
      // If no primary is set but we have phone numbers, set the first one as primary
      if (!hasPrimary && body.sitePhoneNumbers.length > 0) {
        body.sitePhoneNumbers[0].isPrimary = true;
      }
      
      // Ensure only one phone number is primary
      let primaryFound = false;
      body.sitePhoneNumbers = body.sitePhoneNumbers.map(phone => {
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
    if (body.siteEmails) {
      const hasPrimary = body.siteEmails.some(email => email.isPrimary);
      
      // If no primary is set but we have emails, set the first one as primary
      if (!hasPrimary && body.siteEmails.length > 0) {
        body.siteEmails[0].isPrimary = true;
      }
      
      // Ensure only one email is primary
      let primaryFound = false;
      body.siteEmails = body.siteEmails.map(email => {
        if (email.isPrimary) {
          if (primaryFound) {
            email.isPrimary = false;
          }
          primaryFound = true;
        }
        return email;
      });
    }
    
    // Handle address array for new entries
    if (body.address && !body.addresses) {
      body.addresses = [body.address];
      delete body.address;
    }
    
    // Remove any legacy fields to ensure clean data
    delete body.siteContactNumbersMobile;
    delete body.siteContactNumbersLand;
    
    const newSite = await Site.create(body);
    return new Response(
      JSON.stringify({ success: true, data: newSite }),
      { status: 201 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}