// app\api\database\clients\contacts\[id]\route.js
import dbConnect from "../../../../../../lib/dbConnect";
import Contact from "../../../../../../models/database/clients/Contact";
import Group from "../../../../../../models/database/clients/Group";
import Chain from "../../../../../../models/database/clients/Chain";
import Site from "../../../../../../models/database/clients/Site";
import { cleanupEntityReferences } from "../../../../../../lib/database/relationshipUtils";
import { updateEntityRelationships, updateLegacyReferences } from "../../../../../../lib/database/updateUtils";

// GET contact by id
export async function GET(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    const contact = await Contact.findById(params.id);
    if (!contact) {
      return new Response(
        JSON.stringify({ success: false, message: "Contact not found" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ success: true, data: contact }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// PUT update contact by id
export async function PUT(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
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
    
    // Convert old format emails to new structure if needed
    if (typeof body.contactEmails === 'string' || Array.isArray(body.contactEmails) && body.contactEmails.length > 0 && typeof body.contactEmails[0] === 'string') {
      const oldEmails = body.contactEmails;
      body.contactEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    // Convert old format phone numbers to new structure if needed
    if (typeof body.contactPhoneNumbers === 'string' || Array.isArray(body.contactPhoneNumbers) && body.contactPhoneNumbers.length > 0 && typeof body.contactPhoneNumbers[0] === 'string') {
      const oldPhoneNumbers = body.contactPhoneNumbers;
      body.contactPhoneNumbers = Array.isArray(oldPhoneNumbers) 
        ? oldPhoneNumbers.map((phone, index) => ({ 
            phoneNumber: phone, 
            location: 'Office', 
            extension: '', 
            isPrimary: index === 0 
          }))
        : [{ phoneNumber: oldPhoneNumbers, location: 'Office', extension: '', isPrimary: true }];
    }
    
    // Configuration for many-to-many relationships
    const contactRelationshipConfig = [
      {
        field: 'groups',
        relatedModel: Group,
        relatedField: 'contacts'
      },
      {
        field: 'chains',
        relatedModel: Chain,
        relatedField: 'contacts'
      },
      {
        field: 'sites',
        relatedModel: Site,
        relatedField: 'contacts'
      }
    ];
    
    // Configuration for legacy single-reference relationships
    const legacyConfig = [
      {
        field: 'site',  // Single site reference in Contact
        relatedModel: Site,
        relatedField: 'contacts'
      }
    ];
    
    // Step 1: Update many-to-many relationships
    const updatedContact = await updateEntityRelationships(
      Contact,
      params.id,
      body,
      contactRelationshipConfig
    );
    
    // Step 2: Update legacy single-reference relationships
    await updateLegacyReferences(
      Contact,
      params.id,
      body,
      legacyConfig
    );
    
    if (!updatedContact) {
      return new Response(
        JSON.stringify({ success: false, message: "Contact not found" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: updatedContact }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating contact:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// DELETE contact by id
export async function DELETE(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    // Define all the relationships that need cleanup
    const contactRelationships = [
      {
        relatedModel: Group,
        entityField: 'groups',
        relatedField: 'contacts'
      },
      {
        relatedModel: Chain,
        entityField: 'chains',
        relatedField: 'contacts'
      },
      {
        relatedModel: Site,
        entityField: 'sites',
        relatedField: 'contacts'
      }
    ];
    
    // Step 1: Clean up all references to this contact in related entities
    await cleanupEntityReferences(Contact, params.id, contactRelationships);
    
    // Step 2: For backward compatibility, handle single site reference
    const contact = await Contact.findById(params.id);
    if (contact && contact.site) {
      // If contact has a legacy site reference, remove contact from site's contacts array
      await Site.findByIdAndUpdate(
        contact.site,
        { $pull: { contacts: params.id } },
        { new: true }
      );
    }
    
    // Step 3: Now we can safely delete the contact
    const deletedContact = await Contact.findByIdAndDelete(params.id);
    
    if (!deletedContact) {
      return new Response(
        JSON.stringify({ success: false, message: "Contact not found" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: deletedContact }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/database/clients/contacts/[id]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}