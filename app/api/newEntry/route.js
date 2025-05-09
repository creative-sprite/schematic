// app\api\newEntry\route.js
import dbConnect from "../../../../../lib/dbConnect";
import Group from "../../../../../models/database/clients/Group";
import Chain from "../../../../../models/database/clients/Chain";
import Site from "../../../../../models/database/clients/Site";
import Contact from "../../../../../models/database/clients/Contact";
import Supplier from "../../../../../models/database/clients/Supplier"; // Fixed import path

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  console.log("Received payload:", JSON.stringify(body, null, 2));
  try {
    // Destructure the payload; each key is optional.
    const { group, chain, site, contact, supplier } = body;

    let createdGroup = null,
      createdChain = null,
      createdSite = null,
      createdContact = null,
      createdSupplier = null;

    // Create Group only if groupName is provided.
    if (group && group.groupName) {
      createdGroup = await Group.create(group);
    }

    // Create Chain only if chainName is provided; link group if available.
    if (chain && chain.chainName) {
      const chainData = { ...chain };
      
      // Initialize arrays if not provided
      if (!chainData.groups) chainData.groups = [];
      
      // Add created group to the chain's groups array
      if (createdGroup && !chainData.groups.includes(createdGroup._id)) {
        chainData.groups.push(createdGroup._id);
      }
      
      // Legacy support: Add single group reference if not provided
      if (!chainData.group && createdGroup) {
        chainData.group = createdGroup._id;
      }
      
      createdChain = await Chain.create(chainData);
    }

    // Create Site only if siteName is provided; link group and chain if available.
    if (site && site.siteName) {
      const siteData = { ...site };
      
      // Initialize arrays if not provided
      if (!siteData.groups) siteData.groups = [];
      if (!siteData.chains) siteData.chains = [];
      
      // Add created group to the site's groups array
      if (createdGroup && !siteData.groups.includes(createdGroup._id)) {
        siteData.groups.push(createdGroup._id);
      }
      
      // Add created chain to the site's chains array
      if (createdChain && !siteData.chains.includes(createdChain._id)) {
        siteData.chains.push(createdChain._id);
      }
      
      // Legacy support: Add single references if not provided
      if (!siteData.group && createdGroup) {
        siteData.group = createdGroup._id;
      }
      if (!siteData.chain && createdChain) {
        siteData.chain = createdChain._id;
      }
      
      createdSite = await Site.create(siteData);
    }

    // Create Contact only if contactFirstName and contactLastName are provided; link group, chain, and site.
    if (contact && contact.contactFirstName && contact.contactLastName) {
      const contactData = { ...contact };
      
      // Initialize arrays if not provided
      if (!contactData.groups) contactData.groups = [];
      if (!contactData.chains) contactData.chains = [];
      if (!contactData.sites) contactData.sites = [];
      
      // Add created entities to the contact's arrays
      if (createdGroup && !contactData.groups.includes(createdGroup._id)) {
        contactData.groups.push(createdGroup._id);
      }
      if (createdChain && !contactData.chains.includes(createdChain._id)) {
        contactData.chains.push(createdChain._id);
      }
      if (createdSite && !contactData.sites.includes(createdSite._id)) {
        contactData.sites.push(createdSite._id);
      }
      
      // Legacy support: Add single site reference if not provided
      if (!contactData.site && createdSite) {
        contactData.site = createdSite._id;
      }
      
      // If contactEmails is provided as a string (even empty), convert it to an array.
      if (contactData.contactEmails && typeof contactData.contactEmails === "string") {
        contactData.contactEmails = [contactData.contactEmails];
      }
      // If contactEmails is not provided at all, default it to an empty array
      if (!contactData.contactEmails) {
        contactData.contactEmails = [];
      }
      
      createdContact = await Contact.create(contactData);
    }

    // Create Supplier only if supplierName is provided.
    if (supplier && supplier.supplierName) {
      createdSupplier = await Supplier.create(supplier);
      console.log("Created supplier:", createdSupplier);
    }

    // Update parent documents' reference arrays if applicable.
    if (createdGroup) {
      if (createdChain && !createdGroup.chains.includes(createdChain._id)) 
        createdGroup.chains.push(createdChain._id);
      if (createdSite && !createdGroup.sites.includes(createdSite._id))
        createdGroup.sites.push(createdSite._id);
      if (createdContact && !createdGroup.contacts.includes(createdContact._id))
        createdGroup.contacts.push(createdContact._id);
      await createdGroup.save();
    }

    if (createdChain) {
      if (createdSite && !createdChain.sites.includes(createdSite._id))
        createdChain.sites.push(createdSite._id);
      if (createdContact && !createdChain.contacts.includes(createdContact._id))
        createdChain.contacts.push(createdContact._id);
      await createdChain.save();
    }

    if (createdSite && createdContact && !createdSite.contacts.includes(createdContact._id)) {
      createdSite.contacts.push(createdContact._id);
      await createdSite.save();
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          group: createdGroup,
          chain: createdChain,
          site: createdSite,
          contact: createdContact,
          supplier: createdSupplier,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/database/clients/newEntry:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400 }
    );
  }
}