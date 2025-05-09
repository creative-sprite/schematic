// app\api\database\clients\chains\[id]\route.js
import dbConnect from "../../../../../../lib/dbConnect";
import Chain from "../../../../../../models/database/clients/Chain";
import Group from "../../../../../../models/database/clients/Group";
import Site from "../../../../../../models/database/clients/Site";
import Contact from "../../../../../../models/database/clients/Contact";
import { cleanupEntityReferences } from "../../../../../../lib/database/relationshipUtils";
import { updateEntityRelationships, updateLegacyReferences } from "../../../../../../lib/database/updateUtils";

// GET chain by id
export async function GET(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    const chain = await Chain.findById(params.id);
    if (!chain) {
      return new Response(
        JSON.stringify({ success: false, message: "Chain not found" }),
        { status: 404 }
      );
    }
    return new Response(JSON.stringify({ success: true, data: chain }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// PUT update chain by id
export async function PUT(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    const body = await request.json();
    
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
    
    // Remove legacy fields
    delete body.chainContactNumbersMobile;
    delete body.chainContactNumbersLand;
    
    // Convert old format emails to new structure if needed
    if (typeof body.chainEmails === 'string' || Array.isArray(body.chainEmails) && body.chainEmails.length > 0 && typeof body.chainEmails[0] === 'string') {
      const oldEmails = body.chainEmails;
      body.chainEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    // Convert old format phone numbers to new structure if needed
    if (typeof body.chainPhoneNumbers === 'string' || Array.isArray(body.chainPhoneNumbers) && body.chainPhoneNumbers.length > 0 && typeof body.chainPhoneNumbers[0] === 'string') {
      const oldPhoneNumbers = body.chainPhoneNumbers;
      body.chainPhoneNumbers = Array.isArray(oldPhoneNumbers) 
        ? oldPhoneNumbers.map((phone, index) => ({ 
            phoneNumber: phone, 
            location: 'Office', 
            extension: '', 
            isPrimary: index === 0 
          }))
        : [{ phoneNumber: oldPhoneNumbers, location: 'Office', extension: '', isPrimary: true }];
    }
    
    // Configuration for many-to-many relationships
    const chainRelationshipConfig = [
      {
        field: 'groups',
        relatedModel: Group,
        relatedField: 'chains'
      },
      {
        field: 'sites',
        relatedModel: Site,
        relatedField: 'chains'
      },
      {
        field: 'contacts',
        relatedModel: Contact,
        relatedField: 'chains'
      }
    ];
    
    // Configuration for legacy single-reference relationships
    const legacyConfig = [
      {
        field: 'group',
        relatedModel: Group,
        relatedField: 'chains'
      }
    ];
    
    // Step 1: Update many-to-many relationships
    const updatedChain = await updateEntityRelationships(
      Chain,
      params.id,
      body,
      chainRelationshipConfig
    );
    
    // Step 2: Update legacy single-reference relationships
    await updateLegacyReferences(
      Chain,
      params.id,
      body,
      legacyConfig
    );
    
    if (!updatedChain) {
      return new Response(
        JSON.stringify({ success: false, message: "Chain not found" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: updatedChain }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating chain:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// DELETE chain by id
export async function DELETE(request, context) {
  await dbConnect();
  try {
    const params = await context.params;
    // Define all the relationships that need cleanup
    const chainRelationships = [
      {
        relatedModel: Group,
        entityField: 'groups',
        relatedField: 'chains'
      },
      {
        relatedModel: Site,
        entityField: 'sites',
        relatedField: 'chains'
      },
      {
        relatedModel: Contact,
        entityField: 'contacts',
        relatedField: 'chains'
      }
    ];
    
    // Get the chain first (we'll need it for legacy cleanup)
    const chain = await Chain.findById(params.id);
    
    if (!chain) {
      return new Response(
        JSON.stringify({ success: false, message: "Chain not found" }),
        { status: 404 }
      );
    }
    
    // Step 1: Clean up all references to this chain in related entities
    await cleanupEntityReferences(Chain, params.id, chainRelationships);
    
    // Step 2: For backward compatibility, handle single group reference
    if (chain.group) {
      // If chain has a legacy group reference, remove chain from group's chains array
      await Group.findByIdAndUpdate(
        chain.group,
        { $pull: { chains: params.id } },
        { new: true }
      );
    }
    
    // Step 3: Update any sites that have a legacy reference to this chain
    await Site.updateMany(
      { chain: params.id },
      { $unset: { chain: "" } }
    );
    
    // Step 4: Now we can safely delete the chain
    const deletedChain = await Chain.findByIdAndDelete(params.id);
    
    return new Response(JSON.stringify({ success: true, data: deletedChain }), { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/database/clients/chains/[id]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}