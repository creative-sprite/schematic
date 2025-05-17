// components/kitchenSurvey/collection/CollectionInfoBanner.jsx
import React, { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";

/**
 * Component to display collection information at the top of the survey form
 * when viewing a survey that is part of a multi-area collection
 */
export default function CollectionInfoBanner({
    // Option 1: Individual props
    collectionRef,
    totalAreas,
    currentAreaName,
    currentIndex,

    // Option 2: Pagination data object
    areasPagination = null,

    // Additional props
    structureId = "",

    // New collection props
    collections = [],
    onSwitchCollection = () => {},
}) {
    const [selectedCollectionId, setSelectedCollectionId] = useState(null);

    // Use either individual props or extract from pagination data
    const paginationData = areasPagination
        ? {
              collectionRef: areasPagination.collectionRef || "Multiple Areas",
              totalAreas: areasPagination.totalAreas || 0,
              currentIndex: areasPagination.currentIndex,
              currentAreaName:
                  areasPagination.areasList &&
                  areasPagination.areasList[areasPagination.currentIndex]?.name,
              collectionId: areasPagination.collectionId,
          }
        : {
              collectionRef: collectionRef || "Multiple Areas",
              totalAreas: totalAreas || 0,
              currentIndex: currentIndex || 0,
              currentAreaName,
          };

    // Determine the current area name to display with better fallbacks
    const displayName =
        // First try the provided structureId since it's directly from the current form state
        structureId && structureId.trim() !== ""
            ? structureId
            : // Then try the name from the collection data
            paginationData.currentAreaName &&
              paginationData.currentAreaName.trim() !== ""
            ? paginationData.currentAreaName
            : // Finally fallback to generic area with index
              `Area ${(paginationData.currentIndex || 0) + 1}`;

    // Check if we need to render the multi-collection selector
    const hasMultipleCollections = collections && collections.length > 1;

    // Prepare collection options for dropdown
    const collectionOptions = hasMultipleCollections
        ? collections.map((c) => ({
              label: c.name || c.collectionRef || "Collection",
              value: c.id,
              isPrimary: c.isPrimary,
          }))
        : [];

    // Sort collection options to put primary first
    collectionOptions.sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
    });

    // Set initial selected collection from props
    React.useEffect(() => {
        if (hasMultipleCollections && collectionOptions.length > 0) {
            // First try to use the collection from pagination data
            if (paginationData.collectionId) {
                setSelectedCollectionId(paginationData.collectionId);
            }
            // Otherwise use the first/primary collection
            else {
                setSelectedCollectionId(collectionOptions[0].value);
            }
        }
    }, [hasMultipleCollections, collections, paginationData.collectionId]);

    // Handle collection change
    const handleCollectionChange = (e) => {
        setSelectedCollectionId(e.value);
        onSwitchCollection(e.value);
    };

    // Custom template for dropdown items to show primary
    const collectionOptionTemplate = (option) => {
        return (
            <div className="collection-option">
                <span>{option.label}</span>
                {option.isPrimary && (
                    <Badge
                        value="Primary"
                        severity="success"
                        style={{ marginLeft: "8px", fontSize: "0.7rem" }}
                    />
                )}
            </div>
        );
    };

    // Don't render if there's only one area or no areas
    if (!paginationData.totalAreas || paginationData.totalAreas <= 1) {
        return null;
    }

    return (
        <div
            style={{
                padding: "0.75rem",
                marginBottom: "1rem",
                background: "#eaf6ff",
                border: "1px solid #c2e0ff",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <div>
                {hasMultipleCollections ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <span style={{ fontWeight: "bold" }}>Collection:</span>
                        <Dropdown
                            value={selectedCollectionId}
                            options={collectionOptions}
                            onChange={handleCollectionChange}
                            itemTemplate={collectionOptionTemplate}
                            style={{ minWidth: "250px" }}
                        />
                        <span style={{ color: "#666", marginLeft: "0.5rem" }}>
                            ({paginationData.totalAreas} areas)
                        </span>
                    </div>
                ) : (
                    <>
                        <span style={{ fontWeight: "bold" }}>
                            Collection: {paginationData.collectionRef}
                        </span>
                        <span style={{ marginLeft: "0.5rem", color: "#666" }}>
                            ({paginationData.totalAreas} areas)
                        </span>
                    </>
                )}
            </div>

            {/* Display current area name */}
            <div style={{ fontStyle: "italic", color: "#444" }}>
                Currently editing: {displayName}
            </div>
        </div>
    );
}
