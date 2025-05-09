// components\database\main\helpers.jsx
"use client";
import React from "react";

// Helper: Extract display data for an entry based on its type.
export function getDisplayData(entry, type) {
    let displayName = "";
    let contactNumber = "";
    let contactEmail = "";
    let relatedEntities = []; // Added for showing related entities

    switch (type) {
        case "Sites":
            displayName = entry.siteName;

            // Find primary phone number for display
            if (entry.sitePhoneNumbers && entry.sitePhoneNumbers.length > 0) {
                const primaryPhone = entry.sitePhoneNumbers.find(
                    (phone) => phone.isPrimary
                );
                contactNumber = primaryPhone
                    ? `${primaryPhone.phoneNumber}${
                          primaryPhone.extension
                              ? ` (Ext: ${primaryPhone.extension})`
                              : ""
                      }`
                    : entry.sitePhoneNumbers[0]?.phoneNumber || "";
            }

            // Find primary email for display
            if (entry.siteEmails && entry.siteEmails.length > 0) {
                const primaryEmail = entry.siteEmails.find(
                    (email) => email.isPrimary
                );
                contactEmail = primaryEmail
                    ? primaryEmail.email
                    : entry.siteEmails[0]?.email || "";
            }
            break;

        case "Contacts":
            displayName = `${entry.contactFirstName} ${entry.contactLastName}`;

            // Find primary phone number for display
            if (
                entry.contactPhoneNumbers &&
                entry.contactPhoneNumbers.length > 0
            ) {
                const primaryPhone = entry.contactPhoneNumbers.find(
                    (phone) => phone.isPrimary
                );
                contactNumber = primaryPhone
                    ? `${primaryPhone.phoneNumber}${
                          primaryPhone.extension
                              ? ` (Ext: ${primaryPhone.extension})`
                              : ""
                      }`
                    : entry.contactPhoneNumbers[0]?.phoneNumber || "";
            }

            // Find primary email for display
            if (entry.contactEmails && entry.contactEmails.length > 0) {
                const primaryEmail = entry.contactEmails.find(
                    (email) => email.isPrimary
                );
                contactEmail = primaryEmail
                    ? primaryEmail.email
                    : entry.contactEmails[0]?.email || "";
            }

            // Additional status indicators for contacts that are primary for other entities
            let statusIndicators = [];
            if (entry.isPrimaryForSite) {
                statusIndicators.push("Primary Contact");
            }
            if (entry.isWalkAroundForSite) {
                statusIndicators.push("Walk Around");
            }
            if (statusIndicators.length > 0) {
                displayName += ` (${statusIndicators.join(", ")})`;
            }

            // Collect related entity names for display
            if (entry.groups && entry.groups.length > 0 && entry._groupNames) {
                relatedEntities = [...relatedEntities, ...entry._groupNames];
            }
            if (entry.chains && entry.chains.length > 0 && entry._chainNames) {
                relatedEntities = [...relatedEntities, ...entry._chainNames];
            }
            if (entry.sites && entry.sites.length > 0 && entry._siteNames) {
                relatedEntities = [...relatedEntities, ...entry._siteNames];
            }
            if (
                entry.suppliers &&
                entry.suppliers.length > 0 &&
                entry._supplierNames
            ) {
                relatedEntities = [...relatedEntities, ...entry._supplierNames];
            }
            break;

        case "Chains":
            displayName = entry.chainName;

            // Add indicator if this chain is primary for any sites
            if (entry.isPrimaryForSite) {
                displayName += " (Primary)";
            }

            // Find primary phone number for display
            if (entry.chainPhoneNumbers && entry.chainPhoneNumbers.length > 0) {
                const primaryPhone = entry.chainPhoneNumbers.find(
                    (phone) => phone.isPrimary
                );
                contactNumber = primaryPhone
                    ? `${primaryPhone.phoneNumber}${
                          primaryPhone.extension
                              ? ` (Ext: ${primaryPhone.extension})`
                              : ""
                      }`
                    : entry.chainPhoneNumbers[0]?.phoneNumber || "";
            }

            // Find primary email for display
            if (entry.chainEmails && entry.chainEmails.length > 0) {
                const primaryEmail = entry.chainEmails.find(
                    (email) => email.isPrimary
                );
                contactEmail = primaryEmail
                    ? primaryEmail.email
                    : entry.chainEmails[0]?.email || "";
            }
            break;

        case "Groups":
            displayName = entry.groupName;

            // Add indicator if this group is primary for any sites
            if (entry.isPrimaryForSite) {
                displayName += " (Primary)";
            }

            // Find primary phone number for display
            if (entry.groupPhoneNumbers && entry.groupPhoneNumbers.length > 0) {
                const primaryPhone = entry.groupPhoneNumbers.find(
                    (phone) => phone.isPrimary
                );
                contactNumber = primaryPhone
                    ? `${primaryPhone.phoneNumber}${
                          primaryPhone.extension
                              ? ` (Ext: ${primaryPhone.extension})`
                              : ""
                      }`
                    : entry.groupPhoneNumbers[0]?.phoneNumber || "";
            }

            // Find primary email for display
            if (entry.groupEmails && entry.groupEmails.length > 0) {
                const primaryEmail = entry.groupEmails.find(
                    (email) => email.isPrimary
                );
                contactEmail = primaryEmail
                    ? primaryEmail.email
                    : entry.groupEmails[0]?.email || "";
            }
            break;

        case "Suppliers":
            displayName = entry.supplierName;

            // Find primary phone number for display
            if (
                entry.supplierPhoneNumbers &&
                entry.supplierPhoneNumbers.length > 0
            ) {
                const primaryPhone = entry.supplierPhoneNumbers.find(
                    (phone) => phone.isPrimary
                );
                contactNumber = primaryPhone
                    ? `${primaryPhone.phoneNumber}${
                          primaryPhone.extension
                              ? ` (Ext: ${primaryPhone.extension})`
                              : ""
                      }`
                    : entry.supplierPhoneNumbers[0]?.phoneNumber || "";
            }

            // Find primary email for display
            if (entry.supplierEmails && entry.supplierEmails.length > 0) {
                const primaryEmail = entry.supplierEmails.find(
                    (email) => email.isPrimary
                );
                contactEmail = primaryEmail
                    ? primaryEmail.email
                    : entry.supplierEmails[0]?.email || "";
            }
            break;

        default:
            break;
    }
    return { displayName, contactNumber, contactEmail, relatedEntities };
}

// Helper: Highlight the search term within a text string.
export function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i}>{part}</mark>
        ) : (
            part
        )
    );
}

// Helper: Render a header for an accordion item based on entry type.
export function renderHeader(entry, type, searchTerm) {
    const rowStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
    };
    const itemStyle = { flex: 1, textAlign: "center" };
    const relationshipStyle = {
        color: "#666",
        fontSize: "0.85rem",
        fontStyle: "italic",
        marginLeft: "8px",
    };

    const h = (text) => highlightText(text || "", searchTerm);

    if (type === "Contacts") {
        const { displayName, contactNumber, contactEmail, relatedEntities } =
            getDisplayData(entry, type);

        // Format relationship text
        const relationshipText =
            relatedEntities.length > 0
                ? `(${relatedEntities.slice(0, 2).join(", ")}${
                      relatedEntities.length > 2 ? "..." : ""
                  })`
                : "";

        // Add primary status badges
        const primaryBadge = entry.isPrimaryForSite ? (
            <span
                style={{
                    background: "green",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    marginLeft: "4px",
                }}
            >
                Primary
            </span>
        ) : null;

        const walkAroundBadge = entry.isWalkAroundForSite ? (
            <span
                style={{
                    background: "blue",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    marginLeft: "4px",
                }}
            >
                Walk Around
            </span>
        ) : null;

        return (
            <div style={rowStyle}>
                <div
                    style={{
                        ...itemStyle,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    {h(displayName)}
                    {primaryBadge}
                    {walkAroundBadge}
                    {relationshipText && (
                        <span style={relationshipStyle}>
                            {relationshipText}
                        </span>
                    )}
                </div>
                <div
                    style={{
                        ...itemStyle,
                        textAlign: "right",
                        display: "flex",
                        gap: "1rem",
                        justifyContent: "space-around",
                    }}
                >
                    <span>{h(entry.position || "")}</span>
                    <span>{h(contactNumber)}</span>
                    <span>{h(contactEmail)}</span>
                </div>
            </div>
        );
    } else if (type === "Groups") {
        // Add primary badge for groups
        const primaryBadge = entry.isPrimaryForSite ? (
            <span
                style={{
                    background: "green",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    marginLeft: "4px",
                }}
            >
                Primary
            </span>
        ) : null;

        const { displayName, contactNumber, contactEmail } = getDisplayData(
            entry,
            type
        );

        const items = [
            <div style={{ display: "flex", alignItems: "center" }}>
                {h(displayName)}
                {primaryBadge}
            </div>,
            h(contactNumber),
            h(contactEmail),
        ];
        return (
            <div style={rowStyle}>
                {items.map((item, idx) => (
                    <div key={idx} style={itemStyle}>
                        {item}
                    </div>
                ))}
            </div>
        );
    } else if (type === "Chains") {
        // Add primary badge for chains
        const primaryBadge = entry.isPrimaryForSite ? (
            <span
                style={{
                    background: "green",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    marginLeft: "4px",
                }}
            >
                Primary
            </span>
        ) : null;

        const { displayName, contactNumber, contactEmail } = getDisplayData(
            entry,
            type
        );

        const items = [
            <div style={{ display: "flex", alignItems: "center" }}>
                {h(displayName)}
                {primaryBadge}
            </div>,
            h(contactNumber),
            h(contactEmail),
        ];
        return (
            <div style={rowStyle}>
                {items.map((item, idx) => (
                    <div key={idx} style={itemStyle}>
                        {item}
                    </div>
                ))}
            </div>
        );
    } else if (type === "Sites") {
        // Get display data
        const { displayName, contactNumber, contactEmail } = getDisplayData(
            entry,
            type
        );

        // Get town from addresses array
        const town =
            (entry.addresses &&
                entry.addresses.length > 0 &&
                entry.addresses[0].town) ||
            "";

        // Check for primary relationships
        const hasPrimaryRelationships =
            entry.primaryGroup ||
            entry.primaryChain ||
            entry.primaryContact ||
            entry.walkAroundContact;

        // Create primary indicator badge if needed
        const primaryRelationshipBadge = hasPrimaryRelationships ? (
            <span
                style={{
                    background: "#087f23",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    marginLeft: "4px",
                }}
            >
                Has Primary
            </span>
        ) : null;

        const items = [
            <div style={{ display: "flex", alignItems: "center" }}>
                {h(displayName)}
                {primaryRelationshipBadge}
            </div>,
            h(contactNumber),
            h(contactEmail),
            h(town),
            h(entry.clientType || ""),
        ];

        return (
            <div style={rowStyle}>
                {items.map((item, idx) => (
                    <div key={idx} style={itemStyle}>
                        {item}
                    </div>
                ))}
            </div>
        );
    } else if (type === "Suppliers") {
        const { displayName, contactNumber, contactEmail } = getDisplayData(
            entry,
            type
        );

        const items = [h(displayName), h(contactNumber), h(contactEmail)];
        return (
            <div style={rowStyle}>
                {items.map((item, idx) => (
                    <div key={idx} style={itemStyle}>
                        {h(item)}
                    </div>
                ))}
            </div>
        );
    } else {
        const { displayName, contactNumber, contactEmail } = getDisplayData(
            entry,
            type
        );
        const items = [displayName, contactNumber, contactEmail];
        return (
            <div style={rowStyle}>
                {items.map((item, idx) => (
                    <div key={idx} style={itemStyle}>
                        {h(item)}
                    </div>
                ))}
            </div>
        );
    }
}
