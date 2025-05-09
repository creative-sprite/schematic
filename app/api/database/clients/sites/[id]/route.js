// app\api\database\clients\sites\[id]\route.js

import dbConnect from "@/lib/dbConnect";
import Site from "@/models/database/clients/Site";
import Group from "@/models/database/clients/Group";
import Chain from "@/models/database/clients/Chain";
import Contact from "@/models/database/clients/Contact";
import { cleanupEntityReferences } from "@/lib/database/relationshipUtils";
import { updateEntityRelationships, updateLegacyReferences } from "@/lib/database/updateUtils";

// GET site by id
export async function GET(request, context) {
  try {
    await dbConnect();
    
    const params = await context.params;
    console.log("GET request for site with ID:", params.id);
    
    const site = await Site.findById(params.id);
    
    if (!site) {
      console.log("Site not found:", params.id);
      return new Response(
        JSON.stringify({ success: false, message: "Site not found" }),
        { status: 404 }
      );
    }
    
    return new Response(JSON.stringify({ success: true, data: site }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in GET /api/database/clients/sites/[id]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// PUT update site by id
export async function PUT(request, context) {
  try {
    await dbConnect();
    
    const params = await context.params;
    console.log("PUT request for site with ID:", params.id);
    
    const body = await request.json();
    console.log("PUT request body:", JSON.stringify(body).slice(0, 200) + "...");
    
    // Process phone numbers with primary flag enforcement
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
    
    // Process emails with primary flag enforcement
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
    
    // Remove legacy fields to ensure clean data
    delete body.siteContactNumbersMobile;
    delete body.siteContactNumbersLand;
    
    // Convert old format emails to new structure if needed
    if (typeof body.siteEmails === 'string' || Array.isArray(body.siteEmails) && body.siteEmails.length > 0 && typeof body.siteEmails[0] === 'string') {
      const oldEmails = body.siteEmails;
      body.siteEmails = Array.isArray(oldEmails) 
        ? oldEmails.map((email, index) => ({ 
            email: email, 
            location: 'Office', 
            isPrimary: index === 0 
          }))
        : [{ email: oldEmails, location: 'Office', isPrimary: true }];
    }
    
    // Convert old format phone numbers to new structure if needed
    if (typeof body.sitePhoneNumbers === 'string' || Array.isArray(body.sitePhoneNumbers) && body.sitePhoneNumbers.length > 0 && typeof body.sitePhoneNumbers[0] === 'string') {
      const oldPhoneNumbers = body.sitePhoneNumbers;
      body.sitePhoneNumbers = Array.isArray(oldPhoneNumbers) 
        ? oldPhoneNumbers.map((phone, index) => ({ 
            phoneNumber: phone, 
            location: 'Office', 
            extension: '', 
            isPrimary: index === 0 
          }))
        : [{ phoneNumber: oldPhoneNumbers, location: 'Office', extension: '', isPrimary: true }];
    }
    
    // Configuration for many-to-many relationships
    const siteRelationshipConfig = [
      {
        field: 'groups',
        relatedModel: Group,
        relatedField: 'sites'
      },
      {
        field: 'chains',
        relatedModel: Chain,
        relatedField: 'sites'
      },
      {
        field: 'contacts',
        relatedModel: Contact,
        relatedField: 'sites'
      }
    ];
    
    // Configuration for legacy single-reference relationships
    const legacyConfig = [
      {
        field: 'group',
        relatedModel: Group,
        relatedField: 'sites'
      },
      {
        field: 'chain',
        relatedModel: Chain,
        relatedField: 'sites'
      }
    ];
    
    // Special handling for the address array
    if (body.address && !body.addresses) {
      body.addresses = [body.address];
      delete body.address;
    }
    
    // Step 1: Update many-to-many relationships
    const updatedSite = await updateEntityRelationships(
      Site,
      params.id,
      body,
      siteRelationshipConfig
    );
    
    // Step 2: Update legacy single-reference relationships
    await updateLegacyReferences(
      Site,
      params.id,
      body,
      legacyConfig
    );
    
    if (!updatedSite) {
      return new Response(
        JSON.stringify({ success: false, message: "Site not found" }),
        { status: 404 }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data: updatedSite }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating site:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}

// DELETE site by id
export async function DELETE(request, context) {
  try {
    await dbConnect();
    
    const params = await context.params;
    console.log("DELETE request for site with ID:", params.id);
    
    // Define all the relationships that need cleanup
    const siteRelationships = [
      {
        relatedModel: Group,
        entityField: 'groups',
        relatedField: 'sites'
      },
      {
        relatedModel: Chain,
        entityField: 'chains',
        relatedField: 'sites'
      },
      {
        relatedModel: Contact,
        entityField: 'contacts',
        relatedField: 'sites'
      }
    ];
    
    // Get the site first (we'll need it for legacy cleanup)
    const site = await Site.findById(params.id);
    
    if (!site) {
      return new Response(
        JSON.stringify({ success: false, message: "Site not found" }),
        { status: 404 }
      );
    }
    
    // Step 1: Clean up all references to this site in related entities
    await cleanupEntityReferences(Site, params.id, siteRelationships);
    
    // Step 2: For backward compatibility, handle legacy single references
    // If site has a legacy group reference, remove site from group's sites array
    if (site.group) {
      await Group.findByIdAndUpdate(
        site.group,
        { $pull: { sites: params.id } },
        { new: true }
      );
    }
    
    // If site has a legacy chain reference, remove site from chain's sites array
    if (site.chain) {
      await Chain.findByIdAndUpdate(
        site.chain,
        { $pull: { sites: params.id } },
        { new: true }
      );
    }
    
    // Step 3: Update any contacts that have a legacy reference to this site
    await Contact.updateMany(
      { site: params.id },
      { $unset: { site: "" } }
    );
    
    // Step 4: Now we can safely delete the site
    const deletedSite = await Site.findByIdAndDelete(params.id);
    
    return new Response(JSON.stringify({ success: true, data: deletedSite }), { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/database/clients/sites/[id]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}