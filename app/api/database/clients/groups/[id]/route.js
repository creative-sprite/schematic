// app\api\database\clients\groups\[id]\route.js
import dbConnect from "../../../../../../lib/dbConnect";
import Group from "../../../../../../models/database/clients/Group";
import Chain from "../../../../../../models/database/clients/Chain";
import Site from "../../../../../../models/database/clients/Site";
import Contact from "../../../../../../models/database/clients/Contact";
import { cleanupEntityReferences } from "../../../../../../lib/database/relationshipUtils";
import { updateEntityRelationships } from "../../../../../../lib/database/updateUtils";

// GET group by id
export async function GET(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    const group = await Group.findById(params.id);
    if (!group) {
      return new Response(
        JSON.stringify({ success: false, message: "Group not found" }),
        { status: 404 }
      );
    }
    return new Response(JSON.stringify({ success: true, data: group }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// PUT update group by id
export async function PUT(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    const body = await request.json();
    
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
    
    // Remove legacy fields
    delete body.groupContactNumbersMobile;
    delete body.groupContactNumbersLand;
    
    // Convert old format emails to new structure if needed
    if (typeof body.groupEmails === 'string' || Array.isArray(body.groupEmails) && body.groupEmails.length > 0 && typeof body.groupEmails[0] === 'string') {
      const oldEmails = body.groupEmails;
      body.groupEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    // Convert old format phone numbers to new structure if needed
    if (typeof body.groupPhoneNumbers === 'string' || Array.isArray(body.groupPhoneNumbers) && body.groupPhoneNumbers.length > 0 && typeof body.groupPhoneNumbers[0] === 'string') {
      const oldPhoneNumbers = body.groupPhoneNumbers;
      body.groupPhoneNumbers = Array.isArray(oldPhoneNumbers) 
        ? oldPhoneNumbers.map((phone, index) => ({ 
            phoneNumber: phone, 
            location: 'Office', 
            extension: '', 
            isPrimary: index === 0 
          }))
        : [{ phoneNumber: oldPhoneNumbers, location: 'Office', extension: '', isPrimary: true }];
    }
    
    // Configuration for many-to-many relationships
    const groupRelationshipConfig = [
      {
        field: 'chains',
        relatedModel: Chain,
        relatedField: 'groups'
      },
      {
        field: 'sites',
        relatedModel: Site,
        relatedField: 'groups'
      },
      {
        field: 'contacts',
        relatedModel: Contact,
        relatedField: 'groups'
      }
    ];
    
    // Update all relationships
    const updatedGroup = await updateEntityRelationships(
      Group,
      params.id,
      body,
      groupRelationshipConfig
    );
    
    if (!updatedGroup) {
      return new Response(
        JSON.stringify({ success: false, message: "Group not found" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: updatedGroup }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating group:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// DELETE group by id
export async function DELETE(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    // Define all the relationships that need cleanup
    const groupRelationships = [
      {
        relatedModel: Chain,
        entityField: 'chains',
        relatedField: 'groups'
      },
      {
        relatedModel: Site,
        entityField: 'sites',
        relatedField: 'groups'
      },
      {
        relatedModel: Contact,
        entityField: 'contacts',
        relatedField: 'groups'
      }
    ];
    
    // Get the group first (we'll need it for reference cleanup)
    const group = await Group.findById(params.id);
    
    if (!group) {
      return new Response(
        JSON.stringify({ success: false, message: "Group not found" }),
        { status: 404 }
      );
    }
    
    // Step 1: Clean up all references to this group in related entities
    await cleanupEntityReferences(Group, params.id, groupRelationships);
    
    // Step 2: For backward compatibility, update chains, sites and contacts that have legacy references to this group
    await Chain.updateMany(
      { group: params.id },
      { $unset: { group: "" } }
    );
    
    await Site.updateMany(
      { group: params.id },
      { $unset: { group: "" } }
    );
    
    await Contact.updateMany(
      { group: params.id },
      { $unset: { group: "" } }
    );
    
    // Step 3: Now we can safely delete the group
    const deletedGroup = await Group.findByIdAndDelete(params.id);
    
    return new Response(JSON.stringify({ success: true, data: deletedGroup }), { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/database/clients/groups/[id]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}