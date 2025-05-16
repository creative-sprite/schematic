// components/kitchenSurvey/collection/CollectionInfoBanner.jsx
import React from "react";

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
}) {
    // Use either individual props or extract from pagination data
    const collection = areasPagination
        ? {
              collectionRef: areasPagination.collectionRef || "Multiple Areas",
              totalAreas: areasPagination.totalAreas || 0,
              currentIndex: areasPagination.currentIndex,
              currentAreaName:
                  areasPagination.areasList &&
                  areasPagination.areasList[areasPagination.currentIndex]?.name,
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
            collection.currentAreaName &&
              collection.currentAreaName.trim() !== ""
            ? collection.currentAreaName
            : // Finally fallback to generic area with index
              `Area ${(collection.currentIndex || 0) + 1}`;

    // Log the values for debugging
    console.log("CollectionInfoBanner DEBUG Values:", {
        structureId,
        currentAreaName: collection.currentAreaName,
        currentIndex: collection.currentIndex,
        displayName,
    });

    // Don't render if there's only one area or no areas
    if (!collection.totalAreas || collection.totalAreas <= 1) {
        console.log(
            "CollectionInfoBanner: Not showing banner because totalAreas =",
            collection.totalAreas
        );
        return null;
    }

    // Log some info for debugging
    console.log(
        "CollectionInfoBanner: Rendering with",
        collection.totalAreas,
        "areas, currentIndex =",
        collection.currentIndex,
        "displaying area:",
        displayName
    );

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
                <span style={{ fontWeight: "bold" }}>
                    Collection: {collection.collectionRef}
                </span>
                <span style={{ marginLeft: "0.5rem", color: "#666" }}>
                    ({collection.totalAreas} areas)
                </span>
            </div>

            {/* Display current area name */}
            <div style={{ fontStyle: "italic", color: "#444" }}>
                Currently editing: {displayName}
            </div>
        </div>
    );
}
