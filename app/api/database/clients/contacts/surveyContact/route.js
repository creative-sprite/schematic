// app\api\database\clients\contacts\surveyContact\route.js
import dbConnect from "@/lib/dbConnect";
import Contact from "@/models/database/clients/Contact";

// GET all contacts
export async function GET(request) {
  await dbConnect();
  try {
    const contacts = await Contact.find({});
    return new Response(
      JSON.stringify({ success: true, data: contacts }),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/database/clients/contacts/surveyContact error:", error.message);
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
    
    // Validate that we have a site
    if (!body.site) {
      return new Response(
        JSON.stringify({ success: false, message: "Site is required for contact" }),
        { status: 400 }
      );
    }
    
    // Create new contact in database
    const contact = await Contact.create(body);
    
    return new Response(
      JSON.stringify({ success: true, data: contact }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/database/clients/contacts/surveyContact error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}