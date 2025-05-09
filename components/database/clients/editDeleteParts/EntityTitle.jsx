// components\database\clients\editDeleteParts\EntityTitle.jsx
import React from "react";
import { Badge } from "primereact/badge";

/**
 * Renders a formatted title for an entity based on its type
 * For contacts, includes primary/walk around badges
 */
const EntityTitle = ({ entity, entityType }) => {
    if (entityType === "contact") {
        return (
            <>
                {entity.contactFirstName} {entity.contactLastName}
                {entity.position && ` - ${entity.position}`}
                {entity.isPrimaryContact && (
                    <Badge
                        value="Primary"
                        severity="success"
                        style={{ marginLeft: "1rem" }}
                    />
                )}
                {entity.isWalkAroundContact && (
                    <Badge
                        value="Walk Around"
                        severity="info"
                        style={{ marginLeft: "1rem" }}
                    />
                )}
            </>
        );
    }

    switch (entityType) {
        case "site":
            return entity?.siteName || "Site";
        case "group":
            return entity?.groupName || "Group";
        case "chain":
            return entity?.chainName || "Chain";
        case "supplier":
            return entity?.supplierName || "Supplier";
        default:
            return "Entity";
    }
};

export default EntityTitle;
