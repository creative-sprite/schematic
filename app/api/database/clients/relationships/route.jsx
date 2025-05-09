// app/api/database/clients/relationships/route.jsx
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Group from "@/models/database/clients/Group";
import Chain from "@/models/database/clients/Chain";
import Site from "@/models/database/clients/Site";
import Contact from "@/models/database/clients/Contact";
import Supplier from "@/models/database/clients/Supplier";

// Map of entity types to their respective models
const entityModels = {
    group: Group,
    groups: Group,
    chain: Chain,
    chains: Chain,
    site: Site,
    sites: Site,
    contact: Contact,
    contacts: Contact,
    supplier: Supplier,
    suppliers: Supplier,
};

/**
 * API endpoint to set/unset primary relationships between entities
 * Handles Group->Site, Chain->Site, Contact->Site, Contact->Group, Contact->Chain, and Contact->Supplier relationships
 */
export async function POST(request) {
    await dbConnect();

    try {
        const body = await request.json();
        const {
            entityType, // Type of entity being set as primary (group, chain, contact)
            entityId, // ID of the entity being set as primary
            targetType, // Type of target entity (usually site, but could be group, chain, supplier)
            targetId, // ID of the target entity for which we're setting the primary
            action, // "set" or "unset"
        } = body;

        console.log(`Processing ${action} primary relationship request:`, body);

        // Validate required parameters
        if (!entityType || !entityId || !targetType || !targetId) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Missing required parameters: entityType, entityId, targetType, targetId",
                },
                { status: 400 }
            );
        }

        // Validate entity types
        if (!entityModels[entityType] || !entityModels[targetType]) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Invalid entity types: ${entityType} or ${targetType}`,
                },
                { status: 400 }
            );
        }

        // Get models
        const EntityModel = entityModels[entityType];
        const TargetModel = entityModels[targetType];

        // Validate that both entities exist
        const [entity, target] = await Promise.all([
            EntityModel.findById(entityId),
            TargetModel.findById(targetId),
        ]);

        if (!entity) {
            return NextResponse.json(
                {
                    success: false,
                    message: `${entityType} with ID ${entityId} not found`,
                },
                { status: 404 }
            );
        }

        if (!target) {
            return NextResponse.json(
                {
                    success: false,
                    message: `${targetType} with ID ${targetId} not found`,
                },
                { status: 404 }
            );
        }

        // For setting a primary relationship
        if (action === "set") {
            // First, clear any existing primary relationship of this type for the target
            // For example, if setting a primary group for a site,
            // clear any existing primary group designation for this site

            // Update the target to add this entity as its primary relationship
            const updateField = `primary${
                entityType.charAt(0).toUpperCase() + entityType.slice(1)
            }`;

            // Handle any existing primary entity of this type for this target
            if (target[updateField]) {
                const previousPrimaryId = target[updateField];

                // If trying to set the same entity as primary, just return success
                if (previousPrimaryId.toString() === entityId.toString()) {
                    return NextResponse.json({
                        success: true,
                        message: `${entityType} is already the primary for this ${targetType}`,
                        data: target,
                    });
                }

                // Otherwise, clear the "isPrimary" flag on the previous primary entity
                // The field to update depends on the combination of entity and target
                let isPrimaryField;
                if (entityType === "contact") {
                    switch (targetType) {
                        case "site":
                            isPrimaryField = "isPrimaryForSite";
                            break;
                        case "group":
                            isPrimaryField = "isPrimaryForGroup";
                            break;
                        case "chain":
                            isPrimaryField = "isPrimaryForChain";
                            break;
                        case "supplier":
                            isPrimaryField = "isPrimaryForSupplier";
                            break;
                        default:
                            isPrimaryField = null;
                    }
                } else if (entityType === "group" || entityType === "chain") {
                    isPrimaryField = "isPrimaryForSite";
                } else {
                    isPrimaryField = null;
                }

                if (isPrimaryField) {
                    try {
                        await EntityModel.findByIdAndUpdate(previousPrimaryId, {
                            [isPrimaryField]: false,
                        });
                    } catch (err) {
                        console.warn(
                            `Could not update previous primary ${entityType}:`,
                            err
                        );
                        // Continue execution even if this fails
                    }
                }
            }

            // Update the target to set this entity as its primary
            await TargetModel.findByIdAndUpdate(targetId, {
                [updateField]: entityId,
            });

            // Update the entity to mark it as primary for this target
            // The field to update depends on the combination of entity and target
            let isPrimaryField;
            if (entityType === "contact") {
                switch (targetType) {
                    case "site":
                        isPrimaryField = "isPrimaryForSite";
                        break;
                    case "group":
                        isPrimaryField = "isPrimaryForGroup";
                        break;
                    case "chain":
                        isPrimaryField = "isPrimaryForChain";
                        break;
                    case "supplier":
                        isPrimaryField = "isPrimaryForSupplier";
                        break;
                    default:
                        isPrimaryField = null;
                }
            } else if (entityType === "group" || entityType === "chain") {
                isPrimaryField = "isPrimaryForSite";
            } else {
                isPrimaryField = null;
            }

            if (isPrimaryField) {
                await EntityModel.findByIdAndUpdate(entityId, {
                    [isPrimaryField]: true,
                });
            }

            // Get the updated target to return in the response
            const updatedTarget = await TargetModel.findById(targetId);

            return NextResponse.json({
                success: true,
                message: `Primary ${entityType} set successfully for ${targetType}`,
                data: updatedTarget,
            });
        }
        // For unsetting a primary relationship
        else if (action === "unset") {
            const updateField = `primary${
                entityType.charAt(0).toUpperCase() + entityType.slice(1)
            }`;

            // Verify this entity is actually the primary one
            if (target[updateField]?.toString() !== entityId) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `This ${entityType} is not set as primary for this ${targetType}`,
                    },
                    { status: 400 }
                );
            }

            // Update the target to remove this entity as its primary
            await TargetModel.findByIdAndUpdate(targetId, {
                $unset: { [updateField]: "" },
            });

            // Update the entity to unmark it as primary for this target
            // The field to update depends on the combination of entity and target
            let isPrimaryField;
            if (entityType === "contact") {
                switch (targetType) {
                    case "site":
                        isPrimaryField = "isPrimaryForSite";
                        break;
                    case "group":
                        isPrimaryField = "isPrimaryForGroup";
                        break;
                    case "chain":
                        isPrimaryField = "isPrimaryForChain";
                        break;
                    case "supplier":
                        isPrimaryField = "isPrimaryForSupplier";
                        break;
                    default:
                        isPrimaryField = null;
                }
            } else if (entityType === "group" || entityType === "chain") {
                isPrimaryField = "isPrimaryForSite";
            } else {
                isPrimaryField = null;
            }

            if (isPrimaryField) {
                await EntityModel.findByIdAndUpdate(entityId, {
                    [isPrimaryField]: false,
                });
            }

            // Get the updated target to return in the response
            const updatedTarget = await TargetModel.findById(targetId);

            return NextResponse.json({
                success: true,
                message: `Primary ${entityType} unset successfully for ${targetType}`,
                data: updatedTarget,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid action. Use 'set' or 'unset'.",
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error in relationships endpoint:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET endpoint to retrieve all primary relationships for an entity
 */
export async function GET(request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get("entityType");
        const entityId = searchParams.get("entityId");

        if (!entityType || !entityId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing entityType or entityId parameters",
                },
                { status: 400 }
            );
        }

        if (!entityModels[entityType]) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Invalid entity type: ${entityType}`,
                },
                { status: 400 }
            );
        }

        const EntityModel = entityModels[entityType];
        const entity = await EntityModel.findById(entityId);

        if (!entity) {
            return NextResponse.json(
                {
                    success: false,
                    message: `${entityType} with ID ${entityId} not found`,
                },
                { status: 404 }
            );
        }

        // Prepare the response with primary relationship information
        const primaryRelationships = {};

        // Check for primary relationships based on entity type
        if (entityType === "site") {
            if (entity.primaryGroup) {
                const primaryGroup = await Group.findById(entity.primaryGroup);
                primaryRelationships.primaryGroup = primaryGroup;
            }

            if (entity.primaryChain) {
                const primaryChain = await Chain.findById(entity.primaryChain);
                primaryRelationships.primaryChain = primaryChain;
            }

            if (entity.primaryContact) {
                const primaryContact = await Contact.findById(
                    entity.primaryContact
                );
                primaryRelationships.primaryContact = primaryContact;
            }

            if (entity.walkAroundContact) {
                const walkAroundContact = await Contact.findById(
                    entity.walkAroundContact
                );
                primaryRelationships.walkAroundContact = walkAroundContact;
            }
        } else if (entityType === "group") {
            if (entity.primaryContact) {
                const primaryContact = await Contact.findById(
                    entity.primaryContact
                );
                primaryRelationships.primaryContact = primaryContact;
            }

            // Find sites where this is the primary group
            const sitesWherePrimary = await Site.find({
                primaryGroup: entityId,
            });
            primaryRelationships.primaryForSites = sitesWherePrimary;
        } else if (entityType === "chain") {
            if (entity.primaryGroup) {
                const primaryGroup = await Group.findById(entity.primaryGroup);
                primaryRelationships.primaryGroup = primaryGroup;
            }

            if (entity.primaryContact) {
                const primaryContact = await Contact.findById(
                    entity.primaryContact
                );
                primaryRelationships.primaryContact = primaryContact;
            }

            // Find sites where this is the primary chain
            const sitesWherePrimary = await Site.find({
                primaryChain: entityId,
            });
            primaryRelationships.primaryForSites = sitesWherePrimary;
        } else if (entityType === "supplier") {
            if (entity.primaryContact) {
                const primaryContact = await Contact.findById(
                    entity.primaryContact
                );
                primaryRelationships.primaryContact = primaryContact;
            }
        } else if (entityType === "contact") {
            // For contacts, find all entities where this is the primary contact
            const sitesWherePrimary = await Site.find({
                primaryContact: entityId,
            });
            const sitesWhereWalkAround = await Site.find({
                walkAroundContact: entityId,
            });
            const groupsWherePrimary = await Group.find({
                primaryContact: entityId,
            });
            const chainsWherePrimary = await Chain.find({
                primaryContact: entityId,
            });
            const suppliersWherePrimary = await Supplier.find({
                primaryContact: entityId,
            });

            primaryRelationships.primaryForSites = sitesWherePrimary;
            primaryRelationships.walkAroundForSites = sitesWhereWalkAround;
            primaryRelationships.primaryForGroups = groupsWherePrimary;
            primaryRelationships.primaryForChains = chainsWherePrimary;
            primaryRelationships.primaryForSuppliers = suppliersWherePrimary;
        }

        return NextResponse.json({
            success: true,
            data: {
                entity,
                primaryRelationships,
            },
        });
    } catch (error) {
        console.error("Error in GET relationships endpoint:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
