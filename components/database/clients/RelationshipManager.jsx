// components\database\clients\RelationshipManager.jsx

"use client";
import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";
import { Card } from "primereact/card";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

/**
 * A reusable component for managing entity relationships
 * This version uses a completely different approach:
 * Instead of updating the entire relationship array, it uses
 * a MongoDB $addToSet operator to only add new relationships
 */
export default function RelationshipManager({
    entity, // The current entity being managed
    entityType, // Type of entity: 'group', 'chain', 'site', or 'contact'
    relationshipOptions, // Available entities for relationships
    onUpdate, // Callback when relationships are updated
}) {
    // State for newly selected relationships
    const [selectedRelationships, setSelectedRelationships] = useState({
        groups: [],
        chains: [],
        sites: [],
        contacts: [],
    });

    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    // Reset selections when entity changes
    useEffect(() => {
        if (entity) {
            setSelectedRelationships({
                groups: [],
                chains: [],
                sites: [],
                contacts: [],
            });
        }
    }, [entity]);

    // Make safe options objects - memoized to prevent recalculation on each render
    const safeOptions = useMemo(
        () => ({
            groups: Array.isArray(relationshipOptions?.groups)
                ? relationshipOptions.groups
                : [],
            chains: Array.isArray(relationshipOptions?.chains)
                ? relationshipOptions.chains
                : [],
            sites: Array.isArray(relationshipOptions?.sites)
                ? relationshipOptions.sites
                : [],
            contacts: Array.isArray(relationshipOptions?.contacts)
                ? relationshipOptions.contacts
                : [],
        }),
        [relationshipOptions]
    );

    // Memoized change handlers for each entity type to prevent recreation on each render
    const handleGroupsChange = useCallback((e) => {
        setSelectedRelationships((prev) => ({
            ...prev,
            groups: Array.isArray(e.value) ? e.value : [],
        }));
    }, []);

    const handleChainsChange = useCallback((e) => {
        setSelectedRelationships((prev) => ({
            ...prev,
            chains: Array.isArray(e.value) ? e.value : [],
        }));
    }, []);

    const handleSitesChange = useCallback((e) => {
        setSelectedRelationships((prev) => ({
            ...prev,
            sites: Array.isArray(e.value) ? e.value : [],
        }));
    }, []);

    const handleContactsChange = useCallback((e) => {
        setSelectedRelationships((prev) => ({
            ...prev,
            contacts: Array.isArray(e.value) ? e.value : [],
        }));
    }, []);

    // A new approach that ONLY adds relationships - memoized to prevent recreation
    const handleAddRelationships = useCallback(async () => {
        if (!entity || !entityType) {
            if (toast.current) {
                toast.current.show({
                    severity: "warning",
                    summary: "Warning",
                    detail: "No entity selected for relationship management.",
                });
            }
            return;
        }

        // Check if any relationships are selected
        const hasSelections = Object.values(selectedRelationships).some(
            (arr) => Array.isArray(arr) && arr.length > 0
        );

        if (!hasSelections) {
            if (toast.current) {
                toast.current.show({
                    severity: "info",
                    summary: "Info",
                    detail: "No relationships selected to add.",
                });
            }
            return;
        }

        try {
            setLoading(true);

            // Extract IDs from selection objects
            const getIdList = (list) => {
                if (!Array.isArray(list)) return [];
                return list
                    .filter((item) => item && item.id)
                    .map((item) => item.id);
            };

            // These are the IDs we want to add to each relationship
            const idsToAdd = {
                groups: getIdList(selectedRelationships.groups),
                chains: getIdList(selectedRelationships.chains),
                sites: getIdList(selectedRelationships.sites),
                contacts: getIdList(selectedRelationships.contacts),
            };

            // Create the custom additive update payload
            const updatePayload = {
                operation: "addRelationships",
                relationships: {},
            };

            // Only include fields relevant to this entity
            if (entityType !== "group" && idsToAdd.groups.length > 0) {
                updatePayload.relationships.groups = idsToAdd.groups;
            }

            if (entityType !== "chain" && idsToAdd.chains.length > 0) {
                updatePayload.relationships.chains = idsToAdd.chains;
            }

            if (entityType !== "site" && idsToAdd.sites.length > 0) {
                updatePayload.relationships.sites = idsToAdd.sites;
            }

            if (entityType !== "contact" && idsToAdd.contacts.length > 0) {
                updatePayload.relationships.contacts = idsToAdd.contacts;
            }

            // Send an update to a custom endpoint that uses $addToSet
            const res = await fetch(
                `/api/database/clients/${entityType}s/${entity._id}/addRelationships`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatePayload),
                }
            );

            // If the custom endpoint doesn't exist, fall back to a regular update
            // but construct it in a way that only adds relationships
            if (res.status === 404) {
                // Get the current entity state with all its relationships
                const entityRes = await fetch(
                    `/api/database/clients/${entityType}s/${entity._id}`
                );
                const entityJson = await entityRes.json();

                if (!entityJson.success) {
                    throw new Error("Failed to fetch current entity state");
                }

                const currentEntity = entityJson.data;

                // Build an update payload that adds the new relationships without removing existing ones
                const fallbackPayload = {};

                if (entityType !== "group" && idsToAdd.groups.length > 0) {
                    const currentGroups = Array.isArray(currentEntity.groups)
                        ? currentEntity.groups
                        : [];
                    fallbackPayload.groups = [
                        ...new Set([...currentGroups, ...idsToAdd.groups]),
                    ];
                }

                if (entityType !== "chain" && idsToAdd.chains.length > 0) {
                    const currentChains = Array.isArray(currentEntity.chains)
                        ? currentEntity.chains
                        : [];
                    fallbackPayload.chains = [
                        ...new Set([...currentChains, ...idsToAdd.chains]),
                    ];
                }

                if (entityType !== "site" && idsToAdd.sites.length > 0) {
                    const currentSites = Array.isArray(currentEntity.sites)
                        ? currentEntity.sites
                        : [];
                    fallbackPayload.sites = [
                        ...new Set([...currentSites, ...idsToAdd.sites]),
                    ];
                }

                if (entityType !== "contact" && idsToAdd.contacts.length > 0) {
                    const currentContacts = Array.isArray(
                        currentEntity.contacts
                    )
                        ? currentEntity.contacts
                        : [];
                    fallbackPayload.contacts = [
                        ...new Set([...currentContacts, ...idsToAdd.contacts]),
                    ];
                }

                // Only proceed if we have something to update
                if (Object.keys(fallbackPayload).length > 0) {
                    const updateRes = await fetch(
                        `/api/database/clients/${entityType}s/${entity._id}`,
                        {
                            method: "PUT", // Changed from PATCH to PUT
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(fallbackPayload),
                        }
                    );

                    if (!updateRes.ok) {
                        const errorText = await updateRes.text();
                        throw new Error(
                            `Failed to update relationships: ${updateRes.status}`
                        );
                    }

                    const updateResult = await updateRes.json();

                    if (updateResult.success) {
                        // Success with fallback approach
                        if (toast.current) {
                            toast.current.show({
                                severity: "success",
                                summary: "Success",
                                detail: "Relationships added successfully",
                            });
                        }

                        // Clear selections
                        setSelectedRelationships({
                            groups: [],
                            chains: [],
                            sites: [],
                            contacts: [],
                        });

                        // Notify parent component
                        if (typeof onUpdate === "function") {
                            onUpdate(updateResult.data);
                        }
                    } else {
                        throw new Error(
                            updateResult.error ||
                                "Failed to update relationships"
                        );
                    }

                    return;
                }
            } else if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to add relationships: ${res.status}`);
            } else {
                // Custom endpoint worked
                const result = await res.json();

                if (result.success) {
                    // Show success toast
                    if (toast.current) {
                        toast.current.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Relationships added successfully",
                        });
                    }

                    // Clear selections
                    setSelectedRelationships({
                        groups: [],
                        chains: [],
                        sites: [],
                        contacts: [],
                    });

                    // Notify parent component
                    if (typeof onUpdate === "function") {
                        onUpdate(result.data);
                    }
                } else {
                    throw new Error(
                        result.error || "Failed to add relationships"
                    );
                }
            }
        } catch (error) {
            console.error("Error adding relationships:", error);
            if (toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: error.message || "Failed to add relationships",
                });
            }
        } finally {
            setLoading(false);
        }
    }, [entity, entityType, selectedRelationships, onUpdate]);

    // Determine which relationship sections to show based on entity type
    const showGroups = entityType !== "group";
    const showChains = entityType !== "chain";
    const showSites = entityType !== "site";
    const showContacts = entityType !== "contact";

    // Memoize button disabled state
    const isButtonDisabled = useMemo(
        () =>
            !entity ||
            Object.values(selectedRelationships).every((arr) => !arr.length),
        [entity, selectedRelationships]
    );

    // Performance optimization for MultiSelect items
    const itemTemplate = useCallback((option) => {
        return <div className="p-multiselect-item">{option.name}</div>;
    }, []);

    return (
        <Card>
            <Toast ref={toast} />

            {loading ? (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                    <ProgressSpinner />
                    <p>Adding relationships...</p>
                </div>
            ) : (
                <div className="relationship-form">
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1rem",
                        }}
                    >
                        {/* Groups Selection */}
                        {showGroups && (
                            <div
                                style={{
                                    flex: "1 1 200px",
                                    marginBottom: "1rem",
                                }}
                            >
                                <label>Related Groups</label>
                                <MultiSelect
                                    value={selectedRelationships.groups}
                                    options={safeOptions.groups}
                                    onChange={handleGroupsChange}
                                    optionLabel="name"
                                    placeholder="Select Groups"
                                    display="chip"
                                    filter
                                    filterBy="name"
                                    style={{ width: "100%" }}
                                    itemTemplate={itemTemplate}
                                    virtualScrollerOptions={{ itemSize: 38 }}
                                />
                            </div>
                        )}

                        {/* Chains Selection */}
                        {showChains && (
                            <div
                                style={{
                                    flex: "1 1 200px",
                                    marginBottom: "1rem",
                                }}
                            >
                                <label>Related Chains</label>
                                <MultiSelect
                                    value={selectedRelationships.chains}
                                    options={safeOptions.chains}
                                    onChange={handleChainsChange}
                                    optionLabel="name"
                                    placeholder="Select Chains"
                                    display="chip"
                                    filter
                                    filterBy="name"
                                    style={{ width: "100%" }}
                                    itemTemplate={itemTemplate}
                                    virtualScrollerOptions={{ itemSize: 38 }}
                                />
                            </div>
                        )}

                        {/* Sites Selection */}
                        {showSites && (
                            <div
                                style={{
                                    flex: "1 1 200px",
                                    marginBottom: "1rem",
                                }}
                            >
                                <label>Related Sites</label>
                                <MultiSelect
                                    value={selectedRelationships.sites}
                                    options={safeOptions.sites}
                                    onChange={handleSitesChange}
                                    optionLabel="name"
                                    placeholder="Select Sites"
                                    display="chip"
                                    filter
                                    filterBy="name"
                                    style={{ width: "100%" }}
                                    itemTemplate={itemTemplate}
                                    virtualScrollerOptions={{ itemSize: 38 }}
                                />
                            </div>
                        )}

                        {/* Contacts Selection */}
                        {showContacts && (
                            <div
                                style={{
                                    flex: "1 1 200px",
                                    marginBottom: "1rem",
                                }}
                            >
                                <label>Related Contacts</label>
                                <MultiSelect
                                    value={selectedRelationships.contacts}
                                    options={safeOptions.contacts}
                                    onChange={handleContactsChange}
                                    optionLabel="name"
                                    placeholder="Select Contacts"
                                    display="chip"
                                    filter
                                    filterBy="name"
                                    style={{ width: "100%" }}
                                    itemTemplate={itemTemplate}
                                    virtualScrollerOptions={{ itemSize: 38 }}
                                />
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: "right", marginTop: "1rem" }}>
                        <Button
                            label="Add Relationships"
                            onClick={handleAddRelationships}
                            disabled={isButtonDisabled}
                        />
                    </div>
                </div>
            )}
        </Card>
    );
}
