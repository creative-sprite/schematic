// components\database\clients\common\EntityGrid.jsx
import React from "react";
import { DataView } from "primereact/dataview";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import Link from "next/link";

/**
 * Component for displaying a grid of entities (groups, chains, sites, contacts)
 */
const EntityGrid = ({ entities, entityType, emptyMessage }) => {
    // Render Group Item
    const renderGroupItem = (group) => {
        return (
            <div className="p-col-12 p-md-4" style={{ padding: "1rem" }}>
                <Card title={group.groupName} style={{ height: "100%" }}>
                    <div>
                        <p>{group.groupAddressLine1}</p>
                        {group.groupAddressLine2 && (
                            <p>{group.groupAddressLine2}</p>
                        )}
                        <p>
                            {group.groupTown}, {group.groupCounty}{" "}
                            {group.groupPostCode}
                        </p>
                        {group.groupEmails && group.groupEmails.length > 0 && (
                            <p>
                                <strong>Email:</strong>{" "}
                                {group.groupEmails.join(", ")}
                            </p>
                        )}
                        {group.groupContactNumbersMobile &&
                            group.groupContactNumbersMobile.length > 0 && (
                                <p>
                                    <strong>Mobile:</strong>{" "}
                                    {group.groupContactNumbersMobile.join(", ")}
                                </p>
                            )}
                    </div>
                    <div style={{ marginTop: "1rem", textAlign: "right" }}>
                        <Link href={`/database/clients/group/${group._id}`}>
                            <Button label="View" icon="pi pi-eye" />
                        </Link>
                    </div>
                </Card>
            </div>
        );
    };

    // Render Chain Item
    const renderChainItem = (chain) => {
        return (
            <div className="p-col-12 p-md-4" style={{ padding: "1rem" }}>
                <Card title={chain.chainName} style={{ height: "100%" }}>
                    <div>
                        <p>{chain.chainAddressLine1}</p>
                        {chain.chainAddressLine2 && (
                            <p>{chain.chainAddressLine2}</p>
                        )}
                        <p>
                            {chain.chainTown}, {chain.chainCounty}{" "}
                            {chain.chainPostCode}
                        </p>
                        {chain.chainEmails && chain.chainEmails.length > 0 && (
                            <p>
                                <strong>Email:</strong>{" "}
                                {chain.chainEmails.join(", ")}
                            </p>
                        )}
                        {chain.chainContactNumbersMobile &&
                            chain.chainContactNumbersMobile.length > 0 && (
                                <p>
                                    <strong>Mobile:</strong>{" "}
                                    {chain.chainContactNumbersMobile.join(", ")}
                                </p>
                            )}
                    </div>
                    <div style={{ marginTop: "1rem", textAlign: "right" }}>
                        <Link href={`/database/clients/chain/${chain._id}`}>
                            <Button label="View" icon="pi pi-eye" />
                        </Link>
                    </div>
                </Card>
            </div>
        );
    };

    // Render Site Item
    const renderSiteItem = (site) => {
        const address =
            site.addresses && site.addresses.length > 0
                ? site.addresses[0]
                : {};

        return (
            <div className="p-col-12 p-md-4" style={{ padding: "1rem" }}>
                <Card title={site.siteName} style={{ height: "100%" }}>
                    <div>
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        <p>
                            {address.town}, {address.county} {address.postCode}
                        </p>
                        {site.siteEmails && site.siteEmails.length > 0 && (
                            <p>
                                <strong>Email:</strong>{" "}
                                {site.siteEmails.join(", ")}
                            </p>
                        )}
                        {site.siteContactNumbersMobile &&
                            site.siteContactNumbersMobile.length > 0 && (
                                <p>
                                    <strong>Mobile:</strong>{" "}
                                    {site.siteContactNumbersMobile.join(", ")}
                                </p>
                            )}
                    </div>
                    <div style={{ marginTop: "1rem", textAlign: "right" }}>
                        <Link href={`/database/clients/site/${site._id}`}>
                            <Button label="View" icon="pi pi-eye" />
                        </Link>
                    </div>
                </Card>
            </div>
        );
    };

    // Render Contact Item
    const renderContactItem = (contact) => {
        return (
            <div className="p-col-12 p-md-4" style={{ padding: "1rem" }}>
                <Card
                    title={`${contact.contactFirstName} ${contact.contactLastName}`}
                    style={{ height: "100%" }}
                >
                    <div>
                        {contact.position && (
                            <p>
                                <strong>Position:</strong> {contact.position}
                            </p>
                        )}
                        {contact.contactEmails &&
                            contact.contactEmails.length > 0 && (
                                <p>
                                    <strong>Email:</strong>{" "}
                                    {contact.contactEmails.join(", ")}
                                </p>
                            )}
                        {contact.contactNumbersMobile &&
                            contact.contactNumbersMobile.length > 0 && (
                                <p>
                                    <strong>Mobile:</strong>{" "}
                                    {contact.contactNumbersMobile.join(", ")}
                                </p>
                            )}
                        {contact.isPrimaryContact && (
                            <p>
                                <i>Primary Contact</i>
                            </p>
                        )}
                        {contact.isWalkAroundContact && (
                            <p>
                                <i>Walk Around Contact</i>
                            </p>
                        )}
                    </div>
                    <div style={{ marginTop: "1rem", textAlign: "right" }}>
                        <Link href={`/database/clients/contact/${contact._id}`}>
                            <Button label="View" icon="pi pi-eye" />
                        </Link>
                    </div>
                </Card>
            </div>
        );
    };

    // Select the appropriate template based on entity type
    const getItemTemplate = () => {
        switch (entityType) {
            case "group":
                return renderGroupItem;
            case "chain":
                return renderChainItem;
            case "site":
                return renderSiteItem;
            case "contact":
                return renderContactItem;
            default:
                return () => <div>Unknown entity type</div>;
        }
    };

    // If no entities, show message
    if (!entities || entities.length === 0) {
        return <p>{emptyMessage}</p>;
    }

    return (
        <DataView
            value={entities}
            layout="grid"
            itemTemplate={getItemTemplate()}
            rows={3}
        />
    );
};

export default EntityGrid;
