// components\database\clients\common\RelationshipsTab.jsx
import React, { useState, useEffect, useRef } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import RelationshipManager from "../RelationshipManager";
import EntityGrid from "./EntityGrid";

/**
 * Component for managing entity relationships
 * Shows relationship manager and related entities
 * Updated to use the new primary relationship API for all entity types
 */
const RelationshipsTab = ({
    entity,
    entityType,
    relationshipOptions,
    onUpdate,
    relatedGroups,
    relatedChains,
    relatedSites,
    relatedContacts,
}) => {
    const [loading, setLoading] = useState(false);
    const [primaryRelationships, setPrimaryRelationships] = useState({
        primaryGroupId: null,
        primaryChainId: null,
        primaryContactId: null,
        walkAroundContactId: null,
    });
    const toast = useRef(null);

    // Fetch primary relationships when the component mounts or entity changes
    useEffect(() => {
        if (entity && entity._id) {
            if (entityType === "site") {
                // For sites, fetch all primary relationships
                setPrimaryRelationships({
                    primaryGroupId: entity.primaryGroup || null,
                    primaryChainId: entity.primaryChain || null,
                    primaryContactId: entity.primaryContact || null,
                    walkAroundContactId: entity.walkAroundContact || null,
                });
            } else if (entityType === "group") {
                // For groups, just the primary contact
                setPrimaryRelationships({
                    primaryContactId: entity.primaryContact || null,
                });
            } else if (entityType === "chain") {
                // For chains, primary group and contact
                setPrimaryRelationships({
                    primaryGroupId: entity.primaryGroup || null,
                    primaryContactId: entity.primaryContact || null,
                });
            } else if (entityType === "supplier") {
                // For suppliers, just the primary contact
                setPrimaryRelationships({
                    primaryContactId: entity.primaryContact || null,
                });
            }
        }
    }, [entity, entityType]);

    // Function to handle setting a Group as primary for a Site
    const handleSetPrimaryGroup = async (groupId, isPrimary) => {
        if (!entity || !entityType || entityType !== "site") return;

        try {
            setLoading(true);

            // If already primary, unset it
            const action = isPrimary ? "unset" : "set";

            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType: "group",
                        entityId: groupId,
                        targetType: "site",
                        targetId: entity._id,
                        action: action,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    primaryGroupId: action === "set" ? groupId : null,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: result.message,
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update primary group"
                );
            }
        } catch (error) {
            console.error("Error setting primary group:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary group",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle setting a Chain as primary for a Site
    const handleSetPrimaryChain = async (chainId, isPrimary) => {
        if (!entity || !entityType || entityType !== "site") return;

        try {
            setLoading(true);

            // If already primary, unset it
            const action = isPrimary ? "unset" : "set";

            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType: "chain",
                        entityId: chainId,
                        targetType: "site",
                        targetId: entity._id,
                        action: action,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    primaryChainId: action === "set" ? chainId : null,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: result.message,
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update primary chain"
                );
            }
        } catch (error) {
            console.error("Error setting primary chain:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary chain",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle setting a Contact as primary for a Site
    const handleSetPrimaryContact = async (contactId, isPrimary) => {
        if (!entity || !entityType || entityType !== "site") return;

        try {
            setLoading(true);

            // If already primary, unset it
            const action = isPrimary ? "unset" : "set";

            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType: "contact",
                        entityId: contactId,
                        targetType: "site",
                        targetId: entity._id,
                        action: action,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    primaryContactId: action === "set" ? contactId : null,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: result.message,
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update primary contact"
                );
            }
        } catch (error) {
            console.error("Error setting primary contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary contact",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle setting a Contact as primary for a Group
    const handleSetPrimaryContactForGroup = async (contactId, isPrimary) => {
        if (!entity || !entityType || entityType !== "group") return;

        try {
            setLoading(true);

            // If already primary, unset it
            const action = isPrimary ? "unset" : "set";

            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType: "contact",
                        entityId: contactId,
                        targetType: "group",
                        targetId: entity._id,
                        action: action,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    primaryContactId: action === "set" ? contactId : null,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: result.message,
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update primary contact"
                );
            }
        } catch (error) {
            console.error("Error setting primary contact for group:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary contact",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle setting a Contact as primary for a Chain
    const handleSetPrimaryContactForChain = async (contactId, isPrimary) => {
        if (!entity || !entityType || entityType !== "chain") return;

        try {
            setLoading(true);

            // If already primary, unset it
            const action = isPrimary ? "unset" : "set";

            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType: "contact",
                        entityId: contactId,
                        targetType: "chain",
                        targetId: entity._id,
                        action: action,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    primaryContactId: action === "set" ? contactId : null,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: result.message,
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update primary contact"
                );
            }
        } catch (error) {
            console.error("Error setting primary contact for chain:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary contact",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle setting a Group as primary for a Chain
    const handleSetPrimaryGroupForChain = async (groupId, isPrimary) => {
        if (!entity || !entityType || entityType !== "chain") return;

        try {
            setLoading(true);

            // If already primary, unset it
            const action = isPrimary ? "unset" : "set";

            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType: "group",
                        entityId: groupId,
                        targetType: "chain",
                        targetId: entity._id,
                        action: action,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    primaryGroupId: action === "set" ? groupId : null,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: result.message,
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update primary group"
                );
            }
        } catch (error) {
            console.error("Error setting primary group for chain:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary group",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle setting a Contact as primary for a Supplier
    const handleSetPrimaryContactForSupplier = async (contactId, isPrimary) => {
        if (!entity || !entityType || entityType !== "supplier") return;

        try {
            setLoading(true);

            // If already primary, unset it
            const action = isPrimary ? "unset" : "set";

            const response = await fetch(
                "/api/database/clients/relationships",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        entityType: "contact",
                        entityId: contactId,
                        targetType: "supplier",
                        targetId: entity._id,
                        action: action,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    primaryContactId: action === "set" ? contactId : null,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: result.message,
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update primary contact"
                );
            }
        } catch (error) {
            console.error("Error setting primary contact for supplier:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update primary contact",
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to handle setting a Contact as walk around contact for a Site
    const handleSetWalkAroundContact = async (contactId, isWalkAround) => {
        if (!entity || !entityType || entityType !== "site") return;

        try {
            setLoading(true);

            // This will need a separate API endpoint for walk around contacts
            // For now, we'll just use a direct update to the site
            const response = await fetch(
                `/api/database/clients/sites/${entity._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        walkAroundContact: isWalkAround ? null : contactId,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                // Update local state
                setPrimaryRelationships((prev) => ({
                    ...prev,
                    walkAroundContactId: isWalkAround ? null : contactId,
                }));

                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: isWalkAround
                        ? "Walk around contact removed"
                        : "Walk around contact set successfully",
                });

                // Refresh the entity data
                if (onUpdate) {
                    onUpdate(result.data);
                }
            } else {
                throw new Error(
                    result.message || "Failed to update walk around contact"
                );
            }
        } catch (error) {
            console.error("Error setting walk around contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to update walk around contact",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="links-manager">
            <Toast ref={toast} />
            <RelationshipManager
                entity={entity}
                entityType={entityType}
                relationshipOptions={relationshipOptions}
                onUpdate={onUpdate}
            />

            <div className="entity-sections" style={{ marginTop: "2rem" }}>
                {/* Show Groups if not a Group page */}
                {entityType !== "group" && (
                    <>
                        <h2>Groups</h2>
                        {/* Show primary group info for Site and Chain */}
                        {(entityType === "site" || entityType === "chain") &&
                            relatedGroups &&
                            relatedGroups.length > 0 && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <p>
                                        Primary Group:{" "}
                                        {primaryRelationships.primaryGroupId
                                            ? relatedGroups.find(
                                                  (g) =>
                                                      g._id ===
                                                      primaryRelationships.primaryGroupId
                                              )?.groupName || "Unknown"
                                            : "None"}
                                    </p>
                                </div>
                            )}
                        <div
                            className="p-grid"
                            style={{ display: "flex", flexWrap: "wrap" }}
                        >
                            {relatedGroups && relatedGroups.length > 0 ? (
                                relatedGroups.map((group) => {
                                    const isPrimary =
                                        group._id ===
                                        primaryRelationships.primaryGroupId;

                                    return (
                                        <div
                                            key={group._id}
                                            className="p-col-12 p-md-4"
                                            style={{ padding: "1rem" }}
                                        >
                                            <div
                                                style={{
                                                    border: isPrimary
                                                        ? "2px solid #2196F3"
                                                        : "1px solid #ccc",
                                                    padding: "1rem",
                                                    borderRadius: "4px",
                                                    height: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                }}
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                        }}
                                                    >
                                                        <h5>
                                                            {group.groupName}
                                                        </h5>
                                                        {isPrimary && (
                                                            <span
                                                                style={{
                                                                    background:
                                                                        "#2196F3",
                                                                    color: "white",
                                                                    padding:
                                                                        "2px 8px",
                                                                    borderRadius:
                                                                        "4px",
                                                                    fontSize:
                                                                        "12px",
                                                                }}
                                                            >
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Group info */}
                                                    {group.groupEmails &&
                                                        group.groupEmails
                                                            .length > 0 && (
                                                            <p>
                                                                <strong>
                                                                    Email:
                                                                </strong>{" "}
                                                                {group.groupEmails.join(
                                                                    ", "
                                                                )}
                                                            </p>
                                                        )}
                                                </div>

                                                {/* Button section - only show for sites and chains */}
                                                <div
                                                    style={{
                                                        marginTop: "auto",
                                                        paddingTop: "0.5rem",
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                    }}
                                                >
                                                    {entityType === "site" && (
                                                        <Button
                                                            label={
                                                                isPrimary
                                                                    ? "Remove Primary"
                                                                    : "Set as Primary"
                                                            }
                                                            className={
                                                                isPrimary
                                                                    ? "p-button-danger"
                                                                    : "p-button-outlined"
                                                            }
                                                            disabled={loading}
                                                            onClick={() =>
                                                                handleSetPrimaryGroup(
                                                                    group._id,
                                                                    isPrimary
                                                                )
                                                            }
                                                        />
                                                    )}

                                                    {entityType === "chain" && (
                                                        <Button
                                                            label={
                                                                isPrimary
                                                                    ? "Remove Primary"
                                                                    : "Set as Primary"
                                                            }
                                                            className={
                                                                isPrimary
                                                                    ? "p-button-danger"
                                                                    : "p-button-outlined"
                                                            }
                                                            disabled={loading}
                                                            onClick={() =>
                                                                handleSetPrimaryGroupForChain(
                                                                    group._id,
                                                                    isPrimary
                                                                )
                                                            }
                                                        />
                                                    )}

                                                    <a
                                                        href={`/database/clients/group/${group._id}`}
                                                    >
                                                        <Button
                                                            label="View"
                                                            icon="pi pi-eye"
                                                        />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No groups associated with this entity.</p>
                            )}
                        </div>
                    </>
                )}

                {/* Show Chains if not a Chain page */}
                {entityType !== "chain" && (
                    <>
                        <h2>Chains</h2>
                        {entityType === "site" &&
                            relatedChains &&
                            relatedChains.length > 0 && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <p>
                                        Primary Chain:{" "}
                                        {primaryRelationships.primaryChainId
                                            ? relatedChains.find(
                                                  (c) =>
                                                      c._id ===
                                                      primaryRelationships.primaryChainId
                                              )?.chainName || "Unknown"
                                            : "None"}
                                    </p>
                                </div>
                            )}
                        <div
                            className="p-grid"
                            style={{ display: "flex", flexWrap: "wrap" }}
                        >
                            {relatedChains && relatedChains.length > 0 ? (
                                relatedChains.map((chain) => {
                                    const isPrimary =
                                        chain._id ===
                                        primaryRelationships.primaryChainId;

                                    return (
                                        <div
                                            key={chain._id}
                                            className="p-col-12 p-md-4"
                                            style={{ padding: "1rem" }}
                                        >
                                            <div
                                                style={{
                                                    border: isPrimary
                                                        ? "2px solid #2196F3"
                                                        : "1px solid #ccc",
                                                    padding: "1rem",
                                                    borderRadius: "4px",
                                                    height: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                }}
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                        }}
                                                    >
                                                        <h5>
                                                            {chain.chainName}
                                                        </h5>
                                                        {isPrimary && (
                                                            <span
                                                                style={{
                                                                    background:
                                                                        "#2196F3",
                                                                    color: "white",
                                                                    padding:
                                                                        "2px 8px",
                                                                    borderRadius:
                                                                        "4px",
                                                                    fontSize:
                                                                        "12px",
                                                                }}
                                                            >
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Chain info */}
                                                    {chain.chainEmails &&
                                                        chain.chainEmails
                                                            .length > 0 && (
                                                            <p>
                                                                <strong>
                                                                    Email:
                                                                </strong>{" "}
                                                                {chain.chainEmails.join(
                                                                    ", "
                                                                )}
                                                            </p>
                                                        )}
                                                </div>

                                                {/* Button section - only show for sites */}
                                                {entityType === "site" && (
                                                    <div
                                                        style={{
                                                            marginTop: "auto",
                                                            paddingTop:
                                                                "0.5rem",
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                        }}
                                                    >
                                                        <Button
                                                            label={
                                                                isPrimary
                                                                    ? "Remove Primary"
                                                                    : "Set as Primary"
                                                            }
                                                            className={
                                                                isPrimary
                                                                    ? "p-button-danger"
                                                                    : "p-button-outlined"
                                                            }
                                                            disabled={loading}
                                                            onClick={() =>
                                                                handleSetPrimaryChain(
                                                                    chain._id,
                                                                    isPrimary
                                                                )
                                                            }
                                                        />

                                                        <a
                                                            href={`/database/clients/chain/${chain._id}`}
                                                        >
                                                            <Button
                                                                label="View"
                                                                icon="pi pi-eye"
                                                            />
                                                        </a>
                                                    </div>
                                                )}

                                                {/* For other entity types, just show View button */}
                                                {entityType !== "site" && (
                                                    <div
                                                        style={{
                                                            marginTop: "auto",
                                                            paddingTop:
                                                                "0.5rem",
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        <a
                                                            href={`/database/clients/chain/${chain._id}`}
                                                        >
                                                            <Button
                                                                label="View"
                                                                icon="pi pi-eye"
                                                            />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No chains associated with this entity.</p>
                            )}
                        </div>
                    </>
                )}

                {/* Show Sites if not a Site page */}
                {entityType !== "site" && (
                    <>
                        <h2>Sites</h2>
                        <EntityGrid
                            entities={relatedSites}
                            entityType="site"
                            emptyMessage="No sites associated with this entity."
                        />
                    </>
                )}

                {/* Show Contacts if not a Contact page */}
                {entityType !== "contact" && (
                    <>
                        <h2>Contacts</h2>
                        {/* Primary contact information by entity type */}
                        {entityType === "site" &&
                            relatedContacts &&
                            relatedContacts.length > 0 && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <p>
                                        Primary Contact:{" "}
                                        {primaryRelationships.primaryContactId
                                            ? `${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactFirstName || ""
                                              } ${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactLastName ||
                                                  "Unknown"
                                              }`
                                            : "None"}
                                    </p>
                                    <p>
                                        Walk Around Contact:{" "}
                                        {primaryRelationships.walkAroundContactId
                                            ? `${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.walkAroundContactId
                                                  )?.contactFirstName || ""
                                              } ${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.walkAroundContactId
                                                  )?.contactLastName ||
                                                  "Unknown"
                                              }`
                                            : "None"}
                                    </p>
                                </div>
                            )}

                        {entityType === "group" &&
                            relatedContacts &&
                            relatedContacts.length > 0 && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <p>
                                        Primary Contact:{" "}
                                        {primaryRelationships.primaryContactId
                                            ? `${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactFirstName || ""
                                              } ${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactLastName ||
                                                  "Unknown"
                                              }`
                                            : "None"}
                                    </p>
                                </div>
                            )}

                        {entityType === "chain" &&
                            relatedContacts &&
                            relatedContacts.length > 0 && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <p>
                                        Primary Contact:{" "}
                                        {primaryRelationships.primaryContactId
                                            ? `${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactFirstName || ""
                                              } ${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactLastName ||
                                                  "Unknown"
                                              }`
                                            : "None"}
                                    </p>
                                </div>
                            )}

                        {entityType === "supplier" &&
                            relatedContacts &&
                            relatedContacts.length > 0 && (
                                <div style={{ marginBottom: "1rem" }}>
                                    <p>
                                        Primary Contact:{" "}
                                        {primaryRelationships.primaryContactId
                                            ? `${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactFirstName || ""
                                              } ${
                                                  relatedContacts.find(
                                                      (c) =>
                                                          c._id ===
                                                          primaryRelationships.primaryContactId
                                                  )?.contactLastName ||
                                                  "Unknown"
                                              }`
                                            : "None"}
                                    </p>
                                </div>
                            )}

                        <div
                            className="p-grid"
                            style={{ display: "flex", flexWrap: "wrap" }}
                        >
                            {relatedContacts && relatedContacts.length > 0 ? (
                                relatedContacts.map((contact) => {
                                    // Determine if this contact is primary based on entity type
                                    const isPrimary =
                                        contact._id ===
                                        primaryRelationships.primaryContactId;
                                    const isWalkAround =
                                        entityType === "site" &&
                                        contact._id ===
                                            primaryRelationships.walkAroundContactId;
                                    const hasBothRoles =
                                        isPrimary && isWalkAround;

                                    // Generate border style based on selected roles
                                    let cardStyle = {
                                        padding: "1rem",
                                        borderRadius: "4px",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                    };

                                    // Apply different border styles based on role combination
                                    if (hasBothRoles) {
                                        // Top and left borders are green (primary), bottom and right are blue (walk around)
                                        cardStyle.borderTop =
                                            "2px solid #4CAF50";
                                        cardStyle.borderLeft =
                                            "2px solid #4CAF50";
                                        cardStyle.borderBottom =
                                            "2px solid #2196F3";
                                        cardStyle.borderRight =
                                            "2px solid #2196F3";
                                        cardStyle.boxShadow =
                                            "0 0 10px rgba(33, 150, 243, 0.5)";
                                    } else if (isPrimary) {
                                        cardStyle.border = "2px solid #4CAF50"; // Green for primary
                                        cardStyle.boxShadow =
                                            "0 0 10px rgba(76, 175, 80, 0.5)";
                                    } else if (isWalkAround) {
                                        cardStyle.border = "2px solid #2196F3"; // Blue for walk around
                                        cardStyle.boxShadow =
                                            "0 0 10px rgba(33, 150, 243, 0.5)";
                                    } else {
                                        cardStyle.border = "1px solid #ccc";
                                    }

                                    return (
                                        <div
                                            key={contact._id}
                                            className="p-col-12 p-md-4"
                                            style={{ padding: "1rem" }}
                                        >
                                            <div style={cardStyle}>
                                                {/* Contact info section */}
                                                <div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                        }}
                                                    >
                                                        <h5>{`${contact.contactFirstName} ${contact.contactLastName}`}</h5>
                                                        <div>
                                                            {isPrimary && (
                                                                <span
                                                                    style={{
                                                                        background:
                                                                            "#4CAF50",
                                                                        color: "white",
                                                                        padding:
                                                                            "2px 8px",
                                                                        borderRadius:
                                                                            "4px",
                                                                        fontSize:
                                                                            "12px",
                                                                        marginRight:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    Primary
                                                                </span>
                                                            )}
                                                            {isWalkAround && (
                                                                <span
                                                                    style={{
                                                                        background:
                                                                            "#2196F3",
                                                                        color: "white",
                                                                        padding:
                                                                            "2px 8px",
                                                                        borderRadius:
                                                                            "4px",
                                                                        fontSize:
                                                                            "12px",
                                                                    }}
                                                                >
                                                                    Walk Around
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {contact.position && (
                                                        <p>
                                                            <strong>
                                                                Position:
                                                            </strong>{" "}
                                                            {contact.position}
                                                        </p>
                                                    )}

                                                    {contact.contactEmails &&
                                                        contact.contactEmails
                                                            .length > 0 && (
                                                            <p>
                                                                <strong>
                                                                    Email:
                                                                </strong>{" "}
                                                                {contact.contactEmails.join(
                                                                    ", "
                                                                )}
                                                            </p>
                                                        )}

                                                    {contact.contactNumbersMobile &&
                                                        contact
                                                            .contactNumbersMobile
                                                            .length > 0 && (
                                                            <p>
                                                                <strong>
                                                                    Mobile:
                                                                </strong>{" "}
                                                                {contact.contactNumbersMobile.join(
                                                                    ", "
                                                                )}
                                                            </p>
                                                        )}
                                                </div>

                                                {/* Button section based on entity type */}
                                                <div
                                                    style={{
                                                        marginTop: "auto",
                                                        paddingTop: "0.5rem",
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: "0.5rem",
                                                    }}
                                                >
                                                    {/* For Sites - Primary and Walk Around buttons */}
                                                    {entityType === "site" && (
                                                        <>
                                                            <Button
                                                                label={
                                                                    isPrimary
                                                                        ? "Remove Primary"
                                                                        : "Set as Primary"
                                                                }
                                                                className={
                                                                    isPrimary
                                                                        ? "p-button-danger"
                                                                        : "p-button-outlined p-button-success"
                                                                }
                                                                disabled={
                                                                    loading
                                                                }
                                                                onClick={() =>
                                                                    handleSetPrimaryContact(
                                                                        contact._id,
                                                                        isPrimary
                                                                    )
                                                                }
                                                                style={{
                                                                    flex: "1",
                                                                }}
                                                            />

                                                            <Button
                                                                label={
                                                                    isWalkAround
                                                                        ? "Remove Walk Around"
                                                                        : "Set as Walk Around"
                                                                }
                                                                className={
                                                                    isWalkAround
                                                                        ? "p-button-danger"
                                                                        : "p-button-outlined p-button-info"
                                                                }
                                                                disabled={
                                                                    loading
                                                                }
                                                                onClick={() =>
                                                                    handleSetWalkAroundContact(
                                                                        contact._id,
                                                                        isWalkAround
                                                                    )
                                                                }
                                                                style={{
                                                                    flex: "1",
                                                                }}
                                                            />
                                                        </>
                                                    )}

                                                    {/* For Groups - only Primary button */}
                                                    {entityType === "group" && (
                                                        <Button
                                                            label={
                                                                isPrimary
                                                                    ? "Remove Primary"
                                                                    : "Set as Primary"
                                                            }
                                                            className={
                                                                isPrimary
                                                                    ? "p-button-danger"
                                                                    : "p-button-outlined p-button-success"
                                                            }
                                                            disabled={loading}
                                                            onClick={() =>
                                                                handleSetPrimaryContactForGroup(
                                                                    contact._id,
                                                                    isPrimary
                                                                )
                                                            }
                                                            style={{
                                                                flex: "1",
                                                            }}
                                                        />
                                                    )}

                                                    {/* For Chains - only Primary button */}
                                                    {entityType === "chain" && (
                                                        <Button
                                                            label={
                                                                isPrimary
                                                                    ? "Remove Primary"
                                                                    : "Set as Primary"
                                                            }
                                                            className={
                                                                isPrimary
                                                                    ? "p-button-danger"
                                                                    : "p-button-outlined p-button-success"
                                                            }
                                                            disabled={loading}
                                                            onClick={() =>
                                                                handleSetPrimaryContactForChain(
                                                                    contact._id,
                                                                    isPrimary
                                                                )
                                                            }
                                                            style={{
                                                                flex: "1",
                                                            }}
                                                        />
                                                    )}

                                                    {/* For Suppliers - only Primary button */}
                                                    {entityType ===
                                                        "supplier" && (
                                                        <Button
                                                            label={
                                                                isPrimary
                                                                    ? "Remove Primary"
                                                                    : "Set as Primary"
                                                            }
                                                            className={
                                                                isPrimary
                                                                    ? "p-button-danger"
                                                                    : "p-button-outlined p-button-success"
                                                            }
                                                            disabled={loading}
                                                            onClick={() =>
                                                                handleSetPrimaryContactForSupplier(
                                                                    contact._id,
                                                                    isPrimary
                                                                )
                                                            }
                                                            style={{
                                                                flex: "1",
                                                            }}
                                                        />
                                                    )}

                                                    <a
                                                        href={`/database/clients/contact/${contact._id}`}
                                                        style={{
                                                            flex: "1",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <Button
                                                            label="View"
                                                            icon="pi pi-eye"
                                                            style={{
                                                                width: "100%",
                                                            }}
                                                        />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No contacts associated with this entity.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RelationshipsTab;
