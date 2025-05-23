// app/surveys/kitchenSurvey/page.jsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { ProgressBar } from "primereact/progressbar";
import { Button } from "primereact/button";
import SurveyInfo from "@/components/kitchenSurvey/surveyInfo";
import Area1Logic from "@/components/kitchenSurvey/Area1Logic";

// Import our new extracted components
import AreaPagination from "@/components/kitchenSurvey/pagination/AreaPagination";
import { SurveyActionButtonsConsolidated } from "@/components/kitchenSurvey/actions/SurveyActionButtons";
import CollectionInfoBanner from "@/components/kitchenSurvey/collection/CollectionInfoBanner";

// Import pricing components
import PriceTables from "@/components/kitchenSurvey/pricing/PriceTables";
import GrandTotalSection from "@/components/kitchenSurvey/pricing/GrandTotalSection";
import {
    computeEquipmentTotal,
    computeGrandTotals,
} from "@/components/kitchenSurvey/pricing/PricingUtils";

// Import save component
import SaveSurvey from "@/components/kitchenSurvey/save/SaveSurvey";

// Import data loading hook
import useSurveyDataLoader from "@/components/kitchenSurvey/surveyDataLoading";

// NEW: Import the ParkingPostServiceReport component
import ParkingPostServiceReport from "@/components/kitchenSurvey/parkingPostServiceReport/parkingPostServiceReport";

export default function SurveyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const surveyId = searchParams.get("id");
    const siteIdParam = searchParams.get("site");
    const collectionIdParam = searchParams.get("collection");
    // Add a refreshFlag parameter to detect explicit refreshes
    const refreshFlag = searchParams.get("refresh");

    const toast = useRef(null);
    const contentRef = useRef(null);
    const mainAreaRef = useRef(null); // Reference for main area
    const schematicRef = useRef(null); // Reference for capturing schematic in quotes

    // Ref to track if we're creating a draft survey
    const creatingDraftSurvey = useRef(false);
    // State to help with router refreshes when survey ID changes
    const [internalSurveyId, setInternalSurveyId] = useState(surveyId);
    // Keep track of previous site ID to prevent unnecessary fetches
    const prevSiteIdRef = useRef(siteIdParam);
    // Add state to track navigation loading state
    const [isNavigatingToNewArea, setIsNavigatingToNewArea] = useState(false);

    // NEW: Add debug ref to track structure entries changes
    const structureDebugRef = useRef({
        lastUpdateTime: Date.now(),
        entriesCount: 0,
        updateCount: 0,
        hasBeenLoaded: false,
    });

    // MULTI-COLLECTION: Add state for survey's collection memberships
    const [surveyCollections, setSurveyCollections] = useState([]);

    // State for pagination
    const [areasPagination, setAreasPagination] = useState({
        currentIndex: 0,
        totalAreas: 1,
        areasList: [],
        collectionRef: null,
        collectionId: collectionIdParam || null,
    });

    // Add this effect to catch navigation with refresh=true
    useEffect(() => {
        // If we have a refresh flag in the URL, this is a navigation from AddNewArea
        if (refreshFlag === "true") {
            setIsNavigatingToNewArea(true);

            // Clear the flag after we detect it
            const clearFlag = () => {
                const url = new URL(window.location);
                url.searchParams.delete("refresh");
                window.history.replaceState({}, "", url);

                // Give some extra time for everything to load
                setTimeout(() => {
                    setIsNavigatingToNewArea(false);
                }, 1500);
            };

            // Delay to ensure page has fully loaded
            setTimeout(clearFlag, 500);
        }
    }, [refreshFlag]);

    // Refs to track update status and prevent circular updates for elements
    // that still need protection
    const initializedRef = useRef(false);
    const updatingSurveyDataRef = useRef(false);
    const updatingSpecialistEquipmentRef = useRef(false);
    const updatingStructureTotalRef = useRef(false);
    const updatingCanopyTotalRef = useRef(false);
    const updatingAccessRef = useRef(false);
    const updatingVentilationRef = useRef(false);
    const updatingNotesRef = useRef(false);
    const updatingOperationsRef = useRef(false);
    // NEW: Add ref to prevent circular structure entries updates
    const updatingStructureEntriesRef = useRef(false);

    // Refs to store previous values for comparison
    const prevSurveyDataRef = useRef([]);
    const prevSpecialistEquipmentRef = useRef([]);
    const prevStructureTotalRef = useRef(0);
    const prevCanopyTotalRef = useRef(0);
    const prevAccessRef = useRef({});
    const prevVentilationRef = useRef({});
    const prevNotesRef = useRef({});
    const prevOperationsRef = useRef({});
    // NEW: Add ref for previous structure entries
    const prevStructureEntriesRef = useRef([]);

    // Load all survey data using our custom hook
    const {
        // Loading state
        isLoading,

        // Survey basic info
        surveyDate,
        setSurveyDate,
        refValue,
        setRefValue,

        // Get parking from the data loader
        parking,
        setParking,

        // NEW: Add additional services state values
        parkingCost,
        setParkingCost,
        postServiceReport,
        setPostServiceReport,
        postServiceReportPrice,
        setPostServiceReportPrice,

        // Top-level survey images - standardized location only
        surveyImages,
        setSurveyImages,

        // Equipment data
        surveyData,
        setSurveyData,
        equipmentItems,

        // Specialist equipment
        specialistEquipmentData,
        setSpecialistEquipmentData,
        specialistEquipmentId,
        setSpecialistEquipmentId,
        // CRITICAL: Get the specialist equipment survey object with category comments
        initialSpecialistEquipmentSurvey,

        // Structure data
        structureTotal,
        setStructureTotal,
        structureEntries,
        setStructureEntries,

        // Canopy data
        canopyTotal,
        setCanopyTotal,
        canopyEntries,
        setCanopyEntries,
        canopyComments,
        setCanopyComments,

        // Schematic costs
        accessDoorPrice,
        setAccessDoorPrice,
        ventilationPrice,
        setVentilationPrice,
        airPrice,
        setAirPrice,
        fanPartsPrice,
        setFanPartsPrice,
        airInExTotal,
        setAirInExTotal,
        selectedGroupId,
        setSelectedGroupId,

        // Site details
        siteDetails,
        setSiteDetails,

        // IDs for grouping
        structureId,
        setStructureId,
        equipmentId,
        setEquipmentId,
        canopyId,
        setCanopyId,

        // Price modification
        modify,
        setModify,

        // Schematic items
        schematicItemsTotal,
        setSchematicItemsTotal,

        // Schematic visual data
        placedItems,
        setPlacedItems,
        specialItems,
        setSpecialItems,
        gridSpaces,
        setGridSpaces,
        cellSize,
        setCellSize,
        flexiDuctSelections,
        setFlexiDuctSelections,
        accessDoorSelections,
        setAccessDoorSelections,
        groupDimensions,
        setGroupDimensions,
        fanGradeSelections,
        setFanGradeSelections,

        // Form sections
        ventilation,
        setVentilation,
        access,
        setAccess,
        equipment,
        setEquipment,
        operations,
        setOperations,
        notes,
        setNotes,

        // Contacts
        contacts,
        setContacts,
        primaryContactIndex,
        setPrimaryContactIndex,
        walkAroundContactIndex,
        setWalkAroundContactIndex,
    } = useSurveyDataLoader(internalSurveyId, siteIdParam, toast);

    // Track if we've already created a draft survey for this site
    const [hasDraftSurvey, setHasDraftSurvey] = useState(!!surveyId);

    // NEW: Monitor structure entries for debugging
    useEffect(() => {
        if (structureEntries) {
            structureDebugRef.current.entriesCount = structureEntries.length;
            structureDebugRef.current.updateCount++;
            structureDebugRef.current.lastUpdateTime = Date.now();

            // Track if data has been loaded
            if (
                structureEntries.length > 0 &&
                !structureDebugRef.current.hasBeenLoaded
            ) {
                structureDebugRef.current.hasBeenLoaded = true;
                console.log(
                    `Page: Structure entries loaded from data loader: ${structureEntries.length} entries`
                );

                // Log the first entry to verify data structure
                if (structureEntries.length > 0) {
                    const firstEntry = structureEntries[0];
                    console.log(`First entry ID: ${firstEntry.id}`);
                    console.log(
                        `First entry selection data: ${
                            Array.isArray(firstEntry.selectionData)
                                ? firstEntry.selectionData.length + " rows"
                                : "missing or invalid"
                        }`
                    );
                    console.log(
                        `First entry dimensions: ${
                            firstEntry.dimensions
                                ? `${firstEntry.dimensions.length}x${firstEntry.dimensions.width}x${firstEntry.dimensions.height}`
                                : "missing"
                        }`
                    );
                }
            } else if (structureDebugRef.current.updateCount % 5 === 0) {
                // Log every 5 updates to avoid console spam
                console.log(
                    `Page: Structure entries updated (${structureDebugRef.current.updateCount}): ${structureEntries.length} entries`
                );
            }
        }
    }, [structureEntries]);

    // MULTI-COLLECTION: Add a new effect to fetch and process the survey's collections
    useEffect(() => {
        if (!surveyId || isLoading) return;

        const fetchSurveyCollections = async () => {
            try {
                const res = await fetch(
                    `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                );

                if (res.ok) {
                    const json = await res.json();

                    if (json.success && json.data) {
                        // MULTI-COLLECTION: Check for collections array (new format)
                        if (
                            json.data.collections &&
                            Array.isArray(json.data.collections)
                        ) {
                            // Transform the collections data into a consistent format
                            const processedCollections =
                                json.data.collections.map((coll) => ({
                                    id: coll.collectionId,
                                    collectionId: coll.collectionId,
                                    areaIndex: coll.areaIndex,
                                    collectionRef: coll.collectionRef,
                                    isPrimary: coll.isPrimary,
                                }));

                            // Get detailed information for each collection
                            const enhancedCollections = [];

                            for (const coll of processedCollections) {
                                try {
                                    const collRes = await fetch(
                                        `/api/surveys/collections/${coll.collectionId}`
                                    );

                                    if (collRes.ok) {
                                        const collJson = await collRes.json();

                                        if (collJson.success && collJson.data) {
                                            enhancedCollections.push({
                                                ...coll,
                                                name: collJson.data.name,
                                                totalAreas:
                                                    collJson.data.totalAreas,
                                            });
                                        } else {
                                            enhancedCollections.push(coll);
                                        }
                                    } else {
                                        enhancedCollections.push(coll);
                                    }
                                } catch (error) {
                                    console.error(
                                        `Error fetching collection ${coll.collectionId}:`,
                                        error
                                    );
                                    enhancedCollections.push(coll);
                                }
                            }

                            setSurveyCollections(enhancedCollections);
                            console.log(
                                `[page] Fetched ${enhancedCollections.length} collections for survey ${surveyId}`
                            );
                        }
                        // Backward compatibility: Handle single collectionId
                        else if (json.data.collectionId) {
                            const singleCollection = {
                                id: json.data.collectionId,
                                collectionId: json.data.collectionId,
                                areaIndex:
                                    json.data.areaIndex !== undefined
                                        ? json.data.areaIndex
                                        : 0,
                                collectionRef: json.data.collectionRef || "",
                                isPrimary: true,
                            };

                            // Try to get collection name
                            try {
                                const collRes = await fetch(
                                    `/api/surveys/collections/${json.data.collectionId}`
                                );

                                if (collRes.ok) {
                                    const collJson = await collRes.json();

                                    if (collJson.success && collJson.data) {
                                        singleCollection.name =
                                            collJson.data.name;
                                        singleCollection.totalAreas =
                                            collJson.data.totalAreas;
                                    }
                                }
                            } catch (error) {
                                console.error(
                                    `Error fetching collection ${json.data.collectionId}:`,
                                    error
                                );
                            }

                            setSurveyCollections([singleCollection]);
                            console.log(
                                `[page] Found single collection ${json.data.collectionId} for survey ${surveyId}`
                            );
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching survey collections:", error);
            }
        };

        fetchSurveyCollections();
    }, [surveyId, isLoading]);

    // Effect to detect site selection and automatically create a survey
    useEffect(() => {
        // Check if we already have a survey ID or are in the process of creating one
        if (surveyId || creatingDraftSurvey.current || hasDraftSurvey) {
            return;
        }

        // Check if we now have a site but no survey ID
        if (siteDetails && (siteDetails._id || siteDetails.id) && !isLoading) {
            // Automatically create the survey when a site is selected
            console.log(
                "Site selected but no survey exists - auto-creating survey"
            );
            createMainSurveyInBackground();
        }
    }, [siteDetails, surveyId, isLoading, hasDraftSurvey]);

    // Check for fallback collection data in localStorage
    useEffect(() => {
        try {
            const fallbackData = localStorage.getItem(
                "surveyCollectionFallback"
            );

            if (fallbackData) {
                const data = JSON.parse(fallbackData);

                // Only use if recent (less than 30 seconds old) and matches current URL
                const isRecent = Date.now() - data.timestamp < 30000;
                const matchesUrl =
                    data.newSurveyId === surveyId &&
                    data.collectionId === collectionIdParam;

                if (isRecent && matchesUrl) {
                    console.log(
                        "FALLBACK: Found valid collection data in localStorage",
                        data
                    );

                    // MULTI-COLLECTION: Check for collections array in fallback data
                    if (data.collections && Array.isArray(data.collections)) {
                        setSurveyCollections(data.collections);
                    }

                    // Force set areasPagination with minimum data to show pagination
                    setAreasPagination((prev) => ({
                        ...prev,
                        collectionId: data.collectionId,
                        totalAreas: 2, // Force at least 2 to show pagination
                        areasList: [
                            {
                                id: data.newSurveyId,
                                name: structureId || "New Area",
                                refValue: refValue,
                            },
                            // Add a dummy area to ensure totalAreas > 1
                            {
                                id: "placeholder",
                                name: "Previous Area",
                                refValue: "",
                            },
                        ],
                        currentIndex: data.areaIndex || 0,
                    }));

                    // Clear the fallback data to avoid reuse
                    localStorage.removeItem("surveyCollectionFallback");
                } else if (isRecent) {
                    console.log(
                        "FALLBACK: Found localStorage data but URL mismatch"
                    );
                } else {
                    console.log("FALLBACK: Found expired localStorage data");
                    localStorage.removeItem("surveyCollectionFallback");
                }
            }
        } catch (e) {
            console.error("Error checking localStorage fallback:", e);
        }
    }, [surveyId, collectionIdParam, structureId, refValue]);

    // ADDED FIX: Update internalSurveyId when the URL parameter changes
    useEffect(() => {
        if (surveyId !== internalSurveyId) {
            console.log(
                `Updating internal survey ID from ${internalSurveyId} to ${surveyId}`
            );
            setInternalSurveyId(surveyId);
        }
    }, [surveyId, internalSurveyId]);

    // Add a fallback retry mechanism for collection loading
    useEffect(() => {
        if (
            surveyId &&
            collectionIdParam &&
            areasPagination.areasList.length <= 1
        ) {
            console.log(
                "FALLBACK: Setting up retry mechanism for collection data"
            );

            // Create multiple retry attempts with increasing delays
            const retryDelays = [1000, 2000, 3000, 5000];

            retryDelays.forEach((delay, index) => {
                setTimeout(async () => {
                    console.log(
                        `FALLBACK: Retry attempt ${
                            index + 1
                        } for collection data`
                    );

                    try {
                        // Direct fetch to the collection endpoint
                        const res = await fetch(
                            `/api/surveys/collections/${collectionIdParam}`
                        );
                        if (res.ok) {
                            const json = await res.json();

                            if (
                                json.success &&
                                json.data &&
                                json.data.surveys &&
                                json.data.surveys.length > 0
                            ) {
                                // Sort surveys by areaIndex
                                const sortedSurveys = json.data.surveys.sort(
                                    (a, b) =>
                                        (a.areaIndex || 0) - (b.areaIndex || 0)
                                );

                                // Find current survey index
                                const currentIndex = sortedSurveys.findIndex(
                                    (area) => area._id === surveyId
                                );

                                console.log(
                                    `FALLBACK: Found ${
                                        sortedSurveys.length
                                    } areas in retry ${index + 1}`
                                );

                                // Only update if we found more areas than currently stored
                                if (
                                    sortedSurveys.length >
                                    areasPagination.areasList.length
                                ) {
                                    console.log(
                                        `FALLBACK: Updating pagination data with ${sortedSurveys.length} areas`
                                    );

                                    setAreasPagination({
                                        currentIndex:
                                            currentIndex !== -1
                                                ? currentIndex
                                                : 0,
                                        totalAreas: sortedSurveys.length,
                                        areasList: sortedSurveys.map(
                                            (area) => ({
                                                id: area._id,
                                                name:
                                                    area.structure
                                                        ?.structureId ||
                                                    `Area ${
                                                        area.areaIndex + 1
                                                    }`,
                                                refValue: area.refValue || "",
                                            })
                                        ),
                                        collectionRef: json.data.collectionRef,
                                        collectionId: collectionIdParam,
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error(
                            `FALLBACK: Error in retry ${index + 1}:`,
                            error
                        );
                    }
                }, delay);
            });
        }
    }, [surveyId, collectionIdParam, areasPagination.areasList.length]);

    // Add this effect to force collection refresh when the refresh flag is present
    useEffect(() => {
        // If we have a refresh flag in the URL, force refresh collection data
        if (
            refreshFlag === "true" &&
            !isLoading &&
            surveyId &&
            areasPagination.collectionId
        ) {
            console.log("Force refreshing collection data from refresh flag");

            const forceRefreshCollection = async () => {
                try {
                    // Direct fetch to get up-to-date collection data
                    const res = await fetch(
                        `/api/surveys/collections/${areasPagination.collectionId}`
                    );
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            // Get all surveys in this collection and sort them
                            const sortedSurveys = Array.isArray(
                                json.data.surveys
                            )
                                ? json.data.surveys.sort(
                                      (a, b) =>
                                          (a.areaIndex || 0) -
                                          (b.areaIndex || 0)
                                  )
                                : [];

                            // Find current survey index
                            const currentIndex = sortedSurveys.findIndex(
                                (area) => area._id === surveyId
                            );

                            console.log(
                                `Found ${sortedSurveys.length} areas in collection after force refresh`
                            );

                            // Update pagination state with fresh data
                            setAreasPagination({
                                currentIndex:
                                    currentIndex !== -1 ? currentIndex : 0,
                                totalAreas: sortedSurveys.length,
                                areasList: sortedSurveys.map((area) => ({
                                    id: area._id,
                                    name:
                                        area.structure?.structureId ||
                                        `Area ${area.areaIndex + 1}`,
                                    refValue: area.refValue || "",
                                })),
                                collectionRef: json.data.collectionRef,
                                collectionId: areasPagination.collectionId,
                            });

                            // MULTI-COLLECTION: Also refresh survey collections
                            if (surveyId) {
                                try {
                                    const surveyRes = await fetch(
                                        `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                                    );

                                    if (surveyRes.ok) {
                                        const surveyJson =
                                            await surveyRes.json();

                                        if (
                                            surveyJson.success &&
                                            surveyJson.data &&
                                            surveyJson.data.collections
                                        ) {
                                            const collections =
                                                surveyJson.data.collections.map(
                                                    (coll) => ({
                                                        id: coll.collectionId,
                                                        collectionId:
                                                            coll.collectionId,
                                                        areaIndex:
                                                            coll.areaIndex,
                                                        collectionRef:
                                                            coll.collectionRef,
                                                        isPrimary:
                                                            coll.isPrimary,
                                                    })
                                                );

                                            setSurveyCollections(collections);
                                        }
                                    }
                                } catch (error) {
                                    console.error(
                                        "Error refreshing survey collections:",
                                        error
                                    );
                                }
                            }

                            // Remove refresh flag from URL after processing
                            const url = new URL(window.location);
                            url.searchParams.delete("refresh");
                            window.history.replaceState({}, "", url);
                        }
                    }
                } catch (error) {
                    console.error("Error in force refresh:", error);
                }
            };

            // Delay to ensure page has fully loaded
            setTimeout(forceRefreshCollection, 500);
        }
    }, [refreshFlag, surveyId, areasPagination.collectionId, isLoading]);

    // Fetch collection info when survey ID or collection ID changes
    useEffect(() => {
        if (!isLoading && (surveyId || collectionIdParam)) {
            console.log("PAGINATION DEBUG: Starting fetch with params:", {
                surveyId,
                collectionIdParam,
                isLoading,
            });

            const fetchCollectionInfo = async () => {
                try {
                    console.log("[page] Fetching collection info...");
                    // Try both approaches to get collection data:

                    // 1. First try: Get info from survey if we have a survey ID
                    if (surveyId) {
                        const res = await fetch(
                            `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                        );

                        if (res.ok) {
                            const json = await res.json();
                            if (json.success && json.data) {
                                // MULTI-COLLECTION: First check for collections array
                                if (
                                    json.data.collections &&
                                    Array.isArray(json.data.collections) &&
                                    json.data.collections.length > 0
                                ) {
                                    // Find the primary collection or use the first one
                                    const primaryCollection =
                                        json.data.collections.find(
                                            (c) => c.isPrimary
                                        ) || json.data.collections[0];
                                    const targetCollectionId =
                                        collectionIdParam ||
                                        primaryCollection.collectionId;

                                    // Get all surveys in this specific collection
                                    const collRes = await fetch(
                                        `/api/surveys/kitchenSurveys/viewAll?collectionId=${targetCollectionId}`
                                    );

                                    if (collRes.ok) {
                                        const collJson = await collRes.json();
                                        if (
                                            collJson.success &&
                                            Array.isArray(collJson.data)
                                        ) {
                                            // Sort by areaIndex
                                            const sortedAreas =
                                                collJson.data.sort((a, b) => {
                                                    // Find the collection entry for this specific collection
                                                    const aEntry =
                                                        a.collections?.find(
                                                            (coll) =>
                                                                coll.collectionId &&
                                                                coll.collectionId.toString() ===
                                                                    targetCollectionId.toString()
                                                        );

                                                    const bEntry =
                                                        b.collections?.find(
                                                            (coll) =>
                                                                coll.collectionId &&
                                                                coll.collectionId.toString() ===
                                                                    targetCollectionId.toString()
                                                        );

                                                    // Use the areaIndex from the specific collection entry
                                                    const aIndex =
                                                        aEntry?.areaIndex || 0;
                                                    const bIndex =
                                                        bEntry?.areaIndex || 0;

                                                    return aIndex - bIndex;
                                                });

                                            // Find current survey's index in collection
                                            const currentIndex =
                                                sortedAreas.findIndex(
                                                    (area) =>
                                                        area._id === surveyId
                                                );

                                            console.log(
                                                "[page] Found collection with",
                                                sortedAreas.length,
                                                "areas"
                                            );

                                            // Get collection info for display
                                            let collectionRef =
                                                primaryCollection.collectionRef;
                                            try {
                                                const detailRes = await fetch(
                                                    `/api/surveys/collections/${targetCollectionId}`
                                                );
                                                if (detailRes.ok) {
                                                    const detailJson =
                                                        await detailRes.json();
                                                    if (
                                                        detailJson.success &&
                                                        detailJson.data
                                                    ) {
                                                        collectionRef =
                                                            detailJson.data
                                                                .collectionRef;
                                                    }
                                                }
                                            } catch (error) {
                                                console.warn(
                                                    "Could not fetch collection details",
                                                    error
                                                );
                                            }

                                            setAreasPagination({
                                                currentIndex:
                                                    currentIndex !== -1
                                                        ? currentIndex
                                                        : 0,
                                                totalAreas: sortedAreas.length,
                                                areasList: sortedAreas.map(
                                                    (area) => ({
                                                        id: area._id,
                                                        name:
                                                            area.structure
                                                                ?.structureId ||
                                                            `Area ${
                                                                (area.collections?.find(
                                                                    (coll) =>
                                                                        coll.collectionId &&
                                                                        coll.collectionId.toString() ===
                                                                            targetCollectionId.toString()
                                                                )?.areaIndex ||
                                                                    0) + 1
                                                            }`,
                                                        refValue: area.refValue,
                                                    })
                                                ),
                                                collectionRef: collectionRef,
                                                collectionId:
                                                    targetCollectionId,
                                            });
                                        }
                                    }
                                }
                                // Fall back to legacy single collectionId approach
                                else if (json.data.collectionId) {
                                    // Get all surveys in this collection
                                    const collRes = await fetch(
                                        `/api/surveys/kitchenSurveys/viewAll?collectionId=${json.data.collectionId}`
                                    );

                                    if (collRes.ok) {
                                        const collJson = await collRes.json();
                                        if (
                                            collJson.success &&
                                            Array.isArray(collJson.data)
                                        ) {
                                            // Sort by areaIndex
                                            const sortedAreas =
                                                collJson.data.sort(
                                                    (a, b) =>
                                                        (a.areaIndex || 0) -
                                                        (b.areaIndex || 0)
                                                );

                                            // Find current survey's index in collection
                                            const currentIndex =
                                                sortedAreas.findIndex(
                                                    (area) =>
                                                        area._id === surveyId
                                                );

                                            console.log(
                                                "[page] Found collection with",
                                                sortedAreas.length,
                                                "areas"
                                            );

                                            setAreasPagination({
                                                currentIndex:
                                                    currentIndex !== -1
                                                        ? currentIndex
                                                        : 0,
                                                totalAreas: sortedAreas.length,
                                                areasList: sortedAreas.map(
                                                    (area) => ({
                                                        id: area._id,
                                                        name:
                                                            area.structure
                                                                ?.structureId ||
                                                            `Area ${
                                                                area.areaIndex +
                                                                1
                                                            }`,
                                                        refValue: area.refValue,
                                                    })
                                                ),
                                                collectionRef:
                                                    json.data.collectionRef,
                                                collectionId:
                                                    json.data.collectionId,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 2. Second try: Use collection ID parameter directly
                    else if (collectionIdParam) {
                        console.log(
                            "[page] Using collection ID param:",
                            collectionIdParam
                        );

                        const collRes = await fetch(
                            `/api/surveys/kitchenSurveys/viewAll?collectionId=${collectionIdParam}`
                        );

                        if (collRes.ok) {
                            const collJson = await collRes.json();
                            if (
                                collJson.success &&
                                Array.isArray(collJson.data)
                            ) {
                                // MULTI-COLLECTION: Sort by areaIndex for this specific collection
                                const sortedAreas = collJson.data.sort(
                                    (a, b) => {
                                        // Find the collection entry for this specific collection
                                        const aEntry = a.collections?.find(
                                            (coll) =>
                                                coll.collectionId &&
                                                coll.collectionId.toString() ===
                                                    collectionIdParam.toString()
                                        );

                                        const bEntry = b.collections?.find(
                                            (coll) =>
                                                coll.collectionId &&
                                                coll.collectionId.toString() ===
                                                    collectionIdParam.toString()
                                        );

                                        // Use the areaIndex from the specific collection entry
                                        const aIndex = aEntry?.areaIndex || 0;
                                        const bIndex = bEntry?.areaIndex || 0;

                                        return aIndex - bIndex;
                                    }
                                );

                                console.log(
                                    "[page] Found collection with",
                                    sortedAreas.length,
                                    "areas from param"
                                );

                                // Get collection ref from API for display
                                let collectionRef = "";
                                try {
                                    const detailRes = await fetch(
                                        `/api/surveys/collections/${collectionIdParam}`
                                    );
                                    if (detailRes.ok) {
                                        const detailJson =
                                            await detailRes.json();
                                        if (
                                            detailJson.success &&
                                            detailJson.data
                                        ) {
                                            collectionRef =
                                                detailJson.data.collectionRef;
                                        }
                                    }
                                } catch (error) {
                                    console.warn(
                                        "Could not fetch collection details",
                                        error
                                    );
                                }

                                setAreasPagination({
                                    currentIndex: 0, // Default to first area if no surveyId
                                    totalAreas: sortedAreas.length,
                                    areasList: sortedAreas.map((area) => ({
                                        id: area._id,
                                        name:
                                            area.structure?.structureId ||
                                            `Area ${
                                                (area.collections?.find(
                                                    (coll) =>
                                                        coll.collectionId &&
                                                        coll.collectionId.toString() ===
                                                            collectionIdParam.toString()
                                                )?.areaIndex || 0) + 1
                                            }`,
                                        refValue: area.refValue,
                                    })),
                                    collectionRef: collectionRef,
                                    collectionId: collectionIdParam,
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(
                        "[page] Error fetching collection info:",
                        error
                    );
                }
            };

            fetchCollectionInfo();
        } else {
            console.log("PAGINATION DEBUG: Skipping fetch with params:", {
                surveyId,
                collectionIdParam,
                isLoading,
            });
        }
    }, [isLoading, surveyId, collectionIdParam]);

    // Force-refresh pagination if we detect we're in a collection but don't have areas loaded
    useEffect(() => {
        // If we have a collection ID but no areas list, fetch the collection data
        const needsRefresh =
            !isLoading &&
            surveyId &&
            ((collectionIdParam && areasPagination.areasList.length <= 1) ||
                (areasPagination.collectionId &&
                    areasPagination.areasList.length <= 1));

        if (needsRefresh) {
            console.log("[page] Collection needs refresh - fetching areas");

            const refreshCollection = async () => {
                try {
                    const targetCollectionId =
                        areasPagination.collectionId || collectionIdParam;

                    if (!targetCollectionId) return;

                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll?collectionId=${targetCollectionId}`
                    );

                    if (res.ok) {
                        const json = await res.json();
                        if (
                            json.success &&
                            Array.isArray(json.data) &&
                            json.data.length > 0
                        ) {
                            // MULTI-COLLECTION: Sort by areaIndex for this specific collection
                            const sortedAreas = json.data.sort((a, b) => {
                                // Find the collection entry for this specific collection
                                const aEntry = a.collections?.find(
                                    (coll) =>
                                        coll.collectionId &&
                                        coll.collectionId.toString() ===
                                            targetCollectionId.toString()
                                );

                                const bEntry = b.collections?.find(
                                    (coll) =>
                                        coll.collectionId &&
                                        coll.collectionId.toString() ===
                                            targetCollectionId.toString()
                                );

                                // Use the areaIndex from the specific collection entry
                                const aIndex = aEntry?.areaIndex || 0;
                                const bIndex = bEntry?.areaIndex || 0;

                                return aIndex - bIndex;
                            });

                            // Find current survey's index in collection
                            const currentIndex = sortedAreas.findIndex(
                                (area) => area._id === surveyId
                            );

                            console.log(
                                "[page] Refreshed collection with",
                                sortedAreas.length,
                                "areas"
                            );

                            if (sortedAreas.length > 1) {
                                // Get collection ref from API for display
                                let collectionRef = "";
                                try {
                                    const detailRes = await fetch(
                                        `/api/surveys/collections/${targetCollectionId}`
                                    );
                                    if (detailRes.ok) {
                                        const detailJson =
                                            await detailRes.json();
                                        if (
                                            detailJson.success &&
                                            detailJson.data
                                        ) {
                                            collectionRef =
                                                detailJson.data.collectionRef;
                                        }
                                    }
                                } catch (error) {
                                    console.warn(
                                        "Could not fetch collection details",
                                        error
                                    );
                                }

                                setAreasPagination({
                                    currentIndex:
                                        currentIndex !== -1 ? currentIndex : 0,
                                    totalAreas: sortedAreas.length,
                                    areasList: sortedAreas.map((area) => ({
                                        id: area._id,
                                        name:
                                            area.structure?.structureId ||
                                            `Area ${
                                                (area.collections?.find(
                                                    (coll) =>
                                                        coll.collectionId &&
                                                        coll.collectionId.toString() ===
                                                            targetCollectionId.toString()
                                                )?.areaIndex || 0) + 1
                                            }`,
                                        refValue: area.refValue || "",
                                    })),
                                    collectionRef: collectionRef,
                                    collectionId: targetCollectionId,
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error("[page] Error refreshing collection:", error);
                }
            };

            refreshCollection();
        }
    }, [
        isLoading,
        surveyId,
        collectionIdParam,
        areasPagination.collectionId,
        areasPagination.areasList.length,
    ]);

    // This effect will run whenever surveyId changes (after navigation to a new area)
    useEffect(() => {
        if (surveyId && areasPagination.collectionId) {
            console.log(
                "PAGINATION: Refreshing after navigation, surveyId:",
                surveyId
            );

            const refreshCollectionData = async () => {
                try {
                    // First, fetch the collection info to get all surveys
                    const res = await fetch(
                        `/api/surveys/collections/${areasPagination.collectionId}`
                    );

                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            // Get all surveys in collection
                            const sortedSurveys = Array.isArray(
                                json.data.surveys
                            )
                                ? json.data.surveys.sort((a, b) => {
                                      // Try to find specific areaIndex from collections array
                                      if (a.collections && b.collections) {
                                          const aEntry = a.collections.find(
                                              (coll) =>
                                                  coll.collectionId &&
                                                  coll.collectionId.toString() ===
                                                      areasPagination.collectionId.toString()
                                          );

                                          const bEntry = b.collections.find(
                                              (coll) =>
                                                  coll.collectionId &&
                                                  coll.collectionId.toString() ===
                                                      areasPagination.collectionId.toString()
                                          );

                                          if (aEntry && bEntry) {
                                              return (
                                                  (aEntry.areaIndex || 0) -
                                                  (bEntry.areaIndex || 0)
                                              );
                                          }
                                      }

                                      // Fall back to default sort by areaIndex
                                      return (
                                          (a.areaIndex || 0) -
                                          (b.areaIndex || 0)
                                      );
                                  })
                                : [];

                            console.log(
                                "PAGINATION: Found",
                                sortedSurveys.length,
                                "areas in collection"
                            );

                            // Find current survey index
                            const currentIndex = sortedSurveys.findIndex(
                                (area) => area._id === surveyId
                            );

                            // Only update if we have valid data
                            if (sortedSurveys.length > 0) {
                                setAreasPagination((prev) => ({
                                    ...prev,
                                    currentIndex:
                                        currentIndex !== -1 ? currentIndex : 0,
                                    totalAreas: sortedSurveys.length,
                                    areasList: sortedSurveys.map((area) => {
                                        // Find the areaIndex for this specific collection
                                        let areaIndex = 0;
                                        if (area.collections) {
                                            const entry = area.collections.find(
                                                (coll) =>
                                                    coll.collectionId &&
                                                    coll.collectionId.toString() ===
                                                        areasPagination.collectionId.toString()
                                            );
                                            if (entry) {
                                                areaIndex =
                                                    entry.areaIndex || 0;
                                            }
                                        } else {
                                            areaIndex = area.areaIndex || 0;
                                        }

                                        return {
                                            id: area._id,
                                            name:
                                                area.structure?.structureId ||
                                                `Area ${areaIndex + 1}`,
                                            refValue: area.refValue || "",
                                        };
                                    }),
                                }));

                                console.log(
                                    "PAGINATION: Updated pagination data, current area index:",
                                    currentIndex
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error(
                        "PAGINATION: Error refreshing collection data:",
                        error
                    );
                }
            };

            // Add a small delay to ensure React has completed its update cycle
            const timeoutId = setTimeout(() => {
                refreshCollectionData();
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [surveyId, areasPagination.collectionId]);

    // Initialize tracking refs after data is loaded
    useEffect(() => {
        if (!initializedRef.current && !isLoading) {
            // Initialize refs with initial data for comparison
            prevSurveyDataRef.current = [...surveyData];
            prevSpecialistEquipmentRef.current = [...specialistEquipmentData];
            prevStructureTotalRef.current = structureTotal;
            prevCanopyTotalRef.current = canopyTotal;
            prevAccessRef.current = access ? { ...access } : {};
            prevVentilationRef.current = ventilation ? { ...ventilation } : {};
            prevNotesRef.current = notes ? { ...notes } : {};
            prevOperationsRef.current = operations ? { ...operations } : {};

            // NEW: Initialize structure entries ref with deep copy
            if (structureEntries && Array.isArray(structureEntries)) {
                prevStructureEntriesRef.current = structureEntries.map(
                    (entry) => ({
                        ...entry,
                        selectionData: Array.isArray(entry.selectionData)
                            ? entry.selectionData.map((row) => ({ ...row }))
                            : [],
                        dimensions: entry.dimensions
                            ? { ...entry.dimensions }
                            : {},
                    })
                );

                console.log(
                    `Page: Initialized prevStructureEntriesRef with ${prevStructureEntriesRef.current.length} entries`
                );
            } else {
                prevStructureEntriesRef.current = [];
            }

            initializedRef.current = true;
        }
    }, [
        isLoading,
        surveyData,
        specialistEquipmentData,
        structureTotal,
        canopyTotal,
        access,
        ventilation,
        notes,
        operations,
        structureEntries,
    ]);

    // Function to handle site details change
    const handleSiteDetailsChange = (newSiteDetails) => {
        // First, update the site details in state
        setSiteDetails(newSiteDetails);

        // If we don't have a survey ID yet, and we just selected a site,
        // we'll soon trigger the auto-creation of a survey via the effect above
        if (
            !surveyId &&
            !hasDraftSurvey &&
            newSiteDetails &&
            (newSiteDetails._id || newSiteDetails.id)
        ) {
            console.log("Site details updated, survey will be auto-created");
            // No need to call createMainSurveyInBackground here, the effect will trigger it
        }
    };

    // Function to manually create a survey - only called when needed
    const createMainSurveyInBackground = async () => {
        // Set flag to prevent multiple creations
        if (creatingDraftSurvey.current) return;
        creatingDraftSurvey.current = true;

        try {
            console.log(
                "Creating main survey with collection in background..."
            );

            // 1. First create a collection
            const collectionData = {
                collectionRef: refValue || "Survey Collection",
                name: `${structureId || "Area"} Collection`,
                site: siteDetails._id || siteDetails.id,
                surveys: [], // Will add survey after it's created
                totalAreas: 0,
            };

            const collRes = await fetch("/api/surveys/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(collectionData),
            });

            if (!collRes.ok) {
                throw new Error("Failed to create collection");
            }

            const collJson = await collRes.json();
            const collectionId = collJson.data._id;

            // 2. Now create the survey with reference to collection
            const initialSurveyData = {
                refValue: refValue,
                surveyDate: surveyDate || new Date(),
                site: {
                    _id: siteDetails._id || siteDetails.id,
                },
                structure: {
                    structureId: structureId || "Area 1",
                    structureTotal: 0,
                    entries: [],
                },
                // MULTI-COLLECTION: Use collections array
                collections: [
                    {
                        collectionId: collectionId,
                        areaIndex: 0,
                        collectionRef: collectionData.collectionRef,
                        isPrimary: true,
                    },
                ],
                // FIXED: Initialize with empty objects for comments
                equipmentSurvey: {
                    entries: [],
                    subcategoryComments: {},
                },
                specialistEquipmentSurvey: {
                    entries: [],
                    categoryComments: {},
                },
                equipment: {
                    subcategoryComments: {},
                    categoryComments: {},
                },
                // NEW: Initialize additional services
                additionalServices: {
                    parkingCost: 0,
                    postServiceReport: "No",
                    postServiceReportPrice: 0,
                },
            };

            const saveRes = await fetch("/api/surveys/kitchenSurveys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(initialSurveyData),
            });

            if (!saveRes.ok) {
                const errorText = await saveRes.text();
                console.error(
                    `Failed to create survey: Status ${saveRes.status}`,
                    errorText
                );
                throw new Error(`Failed to create survey: ${saveRes.status}`);
            }

            const saveData = await saveRes.json();

            // Get the new survey ID
            const newSurveyId = saveData.data._id;

            // Mark that we've created a draft survey for this site
            setHasDraftSurvey(true);

            // Update URL with both parameters
            const url = new URL(window.location);
            url.searchParams.set("id", newSurveyId);
            url.searchParams.set("collection", collectionId);
            window.history.pushState({}, "", url);

            // Show a subtle notification
            toast.current?.show({
                severity: "success",
                summary: "Survey Created",
                detail: "Survey document created successfully.",
                life: 2000,
            });

            // Update the internal state
            setInternalSurveyId(newSurveyId);

            // MULTI-COLLECTION: Update all collections state
            setSurveyCollections([
                {
                    id: collectionId,
                    collectionId: collectionId,
                    areaIndex: 0,
                    collectionRef: collectionData.collectionRef,
                    isPrimary: true,
                    name: collectionData.name,
                    totalAreas: 1,
                },
            ]);

            // Update pagination to show the new collection
            setAreasPagination({
                collectionId: collectionId,
                areasList: [
                    {
                        id: newSurveyId,
                        name: structureId || "Area 1",
                        refValue: refValue,
                    },
                ],
                currentIndex: 0,
                totalAreas: 1,
                collectionRef: refValue || "Survey Collection",
            });
        } catch (error) {
            console.error("Error creating survey:", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: `Failed to create survey: ${error.message}`,
            });
        } finally {
            // Reset flag after a short delay
            setTimeout(() => {
                creatingDraftSurvey.current = false;
            }, 500);
        }
    };

    // Toggle accordion sections
    const [accordion, setAccordion] = useState({
        access: false,
        ventilation: false,
    });

    const toggleAccordion = (section) => {
        setAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // Visible sections state
    const [visibleSections, setVisibleSections] = useState([
        "structure",
        "equipment",
        "canopy",
        "schematic",
        "specialistEquipment",
        "images",
    ]);

    // Safe handlers with circular update protection
    const handleSurveyDataChange = (newData) => {
        if (updatingSurveyDataRef.current) return;

        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(prevSurveyDataRef.current);
        if (newDataStr === prevDataStr) return;

        updatingSurveyDataRef.current = true;
        prevSurveyDataRef.current = JSON.parse(newDataStr);
        setSurveyData(newData);

        setTimeout(() => {
            updatingSurveyDataRef.current = false;
        }, 0);
    };

    const handleSpecialistEquipmentDataChange = (newData) => {
        if (updatingSpecialistEquipmentRef.current) return;

        const newDataStr = JSON.stringify(newData);
        const prevDataStr = JSON.stringify(prevSpecialistEquipmentRef.current);
        if (newDataStr === prevDataStr) return;

        updatingSpecialistEquipmentRef.current = true;
        prevSpecialistEquipmentRef.current = JSON.parse(newDataStr);
        setSpecialistEquipmentData(newData);

        setTimeout(() => {
            updatingSpecialistEquipmentRef.current = false;
        }, 0);
    };

    const handleStructureTotalChange = (total) => {
        if (updatingStructureTotalRef.current) return;
        if (total === prevStructureTotalRef.current) return;

        updatingStructureTotalRef.current = true;
        prevStructureTotalRef.current = total;
        setStructureTotal(total);

        setTimeout(() => {
            updatingStructureTotalRef.current = false;
        }, 0);
    };

    const handleCanopyTotalChange = (total) => {
        if (updatingCanopyTotalRef.current) return;
        if (total === prevCanopyTotalRef.current) return;

        updatingCanopyTotalRef.current = true;
        prevCanopyTotalRef.current = total;
        setCanopyTotal(total);

        setTimeout(() => {
            updatingCanopyTotalRef.current = false;
        }, 0);
    };

    const handleCanopyCommentsChange = (comments) => {
        setCanopyComments(comments);
    };

    // NEW: Handler for structure entries changes with protection against circular updates
    const handleStructureEntriesChange = (newEntries) => {
        // Skip if currently updating
        if (updatingStructureEntriesRef.current) return;

        console.log(
            `Page: handleStructureEntriesChange called with ${
                newEntries?.length || 0
            } entries`
        );

        // Check if data has actually changed to avoid unnecessary updates
        const newEntriesStr = JSON.stringify(newEntries);
        const prevEntriesStr = JSON.stringify(prevStructureEntriesRef.current);

        if (newEntriesStr === prevEntriesStr) {
            console.log(
                "Page: Skipping structure entries update - data unchanged"
            );
            return;
        }

        // Set flag to prevent circular updates
        updatingStructureEntriesRef.current = true;

        try {
            // Create a proper deep copy to avoid reference issues
            if (Array.isArray(newEntries)) {
                // Update previous entries reference
                prevStructureEntriesRef.current = newEntries.map((entry) => ({
                    ...entry,
                    selectionData: Array.isArray(entry.selectionData)
                        ? entry.selectionData.map((row) => ({ ...row }))
                        : [],
                    dimensions: entry.dimensions ? { ...entry.dimensions } : {},
                }));

                // Make sure all entries have proper structure
                const validatedEntries = newEntries.map((entry) => ({
                    id:
                        entry.id ||
                        `entry-${Date.now()}-${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                    selectionData: Array.isArray(entry.selectionData)
                        ? entry.selectionData.map((row) => ({
                              type: row.type || "",
                              item: row.item || "",
                              grade: row.grade || "",
                          }))
                        : [],
                    dimensions: entry.dimensions
                        ? {
                              length: Number(entry.dimensions.length) || 0,
                              width: Number(entry.dimensions.width) || 0,
                              height: Number(entry.dimensions.height) || 0,
                          }
                        : {
                              length: 0,
                              width: 0,
                              height: 0,
                          },
                    comments: entry.comments || "",
                }));

                setStructureEntries(validatedEntries);

                // Log the update
                console.log(
                    `Page: Structure entries updated: ${validatedEntries.length} entries`
                );
                if (validatedEntries.length > 0) {
                    console.log(`First entry ID: ${validatedEntries[0].id}`);
                }
            } else {
                console.warn(
                    "Page: Received invalid structure entries data (not an array)"
                );
                // Reset to empty array if invalid data received
                setStructureEntries([]);
                prevStructureEntriesRef.current = [];
            }
        } catch (error) {
            console.error("Page: Error updating structure entries:", error);
        } finally {
            // Clear update flag after a short delay to ensure React has time to process the update
            setTimeout(() => {
                updatingStructureEntriesRef.current = false;
            }, 50);
        }
    };

    // FIXED: Enhanced equipment change handler to handle dynamic category comments
    const handleEquipmentChange = (newEquipment) => {
        console.log(
            "Page: Received equipment update with keys:",
            Object.keys(newEquipment)
        );

        setEquipment((prev) => {
            const updatedEquipment = { ...prev };

            Object.keys(newEquipment).forEach((key) => {
                updatedEquipment[key] = newEquipment[key];
            });

            // FIXED: Create deep copies of objects to avoid reference issues
            if (newEquipment.subcategoryComments) {
                console.log(
                    "Page: Updating subcategoryComments with",
                    Object.keys(newEquipment.subcategoryComments).length,
                    "entries"
                );
                updatedEquipment.subcategoryComments = {};
                Object.entries(newEquipment.subcategoryComments).forEach(
                    ([key, value]) => {
                        updatedEquipment.subcategoryComments[key] = value;
                    }
                );
            }

            // CRITICAL: Handle dynamic category comments properly
            if (newEquipment.categoryComments) {
                console.log(
                    "Page: Updating categoryComments with",
                    Object.keys(newEquipment.categoryComments).length,
                    "entries:",
                    Object.keys(newEquipment.categoryComments)
                );
                updatedEquipment.categoryComments = {};
                Object.entries(newEquipment.categoryComments).forEach(
                    ([categoryName, commentValue]) => {
                        updatedEquipment.categoryComments[categoryName] = commentValue;
                        console.log(`Page: Set comment for category "${categoryName}": "${commentValue.substring(0, 50)}${commentValue.length > 50 ? '...' : ''}"`);
                    }
                );
            }

            return updatedEquipment;
        });
    };

    // Compute equipment total from main area's surveyData
    const computedEquipmentTotal = () => {
        return computeEquipmentTotal(surveyData, equipmentItems);
    };

    // Function to compute grand totals for main area only
    const computedGrandTotals = () => {
        // Create object with main area totals
        const mainTotals = {
            structureTotal: structureTotal,
            equipmentTotal: computedEquipmentTotal(),
            canopyTotal: canopyTotal,
            accessDoorPrice: accessDoorPrice,
            ventilationPrice: ventilationPrice,
            airPrice: airPrice,
            fanPartsPrice: fanPartsPrice,
            airInExTotal: airInExTotal,
            schematicItemsTotal: schematicItemsTotal,
            // NEW: Include parking cost and post-service report price in totals
            parkingCost: parkingCost,
            postServiceReportPrice: postServiceReportPrice,
        };

        // Use utility function to compute totals (with empty child areas array)
        return computeGrandTotals(mainTotals, []);
    };

    const handleVentilationPriceChange = (price) => {
        console.log(`Main page: Setting ventilation price to ${price}`);
        setVentilationPrice(price);
    };

    // NEW: Handlers for parking cost and post-service report
    const handleParkingCostChange = (cost) => {
        console.log(`Main page: Setting parking cost to ${cost}`);
        setParkingCost(cost);
    };

    const handlePostServiceReportChange = (isEnabled, price) => {
        console.log(
            `Main page: Post-service report ${isEnabled} with price ${price}`
        );
        setPostServiceReport(isEnabled);
        setPostServiceReportPrice(isEnabled === "Yes" ? price : 0);
    };

    // ENHANCED: Comprehensive sync function that matches preview exactly
    const forceSyncAllComponents = () => {
        console.log("Page: Force syncing ALL component states for save consistency");

        let syncResults = {
            structure: false,
            canopy: false,
            equipment: false,
            specialist: false,
            schematic: false
        };

        // 1. Sync structure entries (same as preview)
        if (
            typeof window !== "undefined" &&
            window.area1LogicInstance &&
            typeof window.area1LogicInstance.syncStructureEntries === "function"
        ) {
            syncResults.structure = window.area1LogicInstance.syncStructureEntries();
            console.log("Page: Structure entries synced:", syncResults.structure);
        }

        // 2. Sync canopy comments
        if (
            typeof window !== "undefined" &&
            window.area1LogicInstance &&
            typeof window.area1LogicInstance.syncCanopyComments === "function"
        ) {
            syncResults.canopy = window.area1LogicInstance.syncCanopyComments();
            console.log("Page: Canopy comments synced:", syncResults.canopy);
        }

        // 3. Sync equipment subcategory comments
        if (
            typeof window !== "undefined" &&
            window.equipmentComponentInstance &&
            typeof window.equipmentComponentInstance.syncSubcategoryComments === "function"
        ) {
            syncResults.equipment = window.equipmentComponentInstance.syncSubcategoryComments();
            console.log("Page: Equipment subcategory comments synced:", syncResults.equipment);
        }

        // 4. Sync specialist equipment category comments
        if (
            typeof window !== "undefined" &&
            window.specialistEquipmentInstance &&
            typeof window.specialistEquipmentInstance.syncChanges === "function"
        ) {
            syncResults.specialist = window.specialistEquipmentInstance.syncChanges();
            console.log("Page: Specialist equipment synced:", syncResults.specialist);
        }

        // 5. Sync schematic door prices
        if (
            typeof window !== "undefined" &&
            window.schematicInstance &&
            typeof window.schematicInstance.syncDoorPrices === "function"
        ) {
            syncResults.schematic = window.schematicInstance.syncDoorPrices();
            console.log("Page: Schematic door prices synced:", syncResults.schematic);
        }

        // Try fallback component access as needed
        if (
            !syncResults.canopy &&
            typeof window !== "undefined" &&
            window.canopyComponentInstance
        ) {
            if (
                typeof window.canopyComponentInstance.forceUpdateComments === "function"
            ) {
                syncResults.canopy = window.canopyComponentInstance.forceUpdateComments();
                console.log("Page: Canopy comments synced via fallback:", syncResults.canopy);
            }
        }

        console.log("Page: Comprehensive sync completed:", syncResults);
        return Object.values(syncResults).some(result => result);
    };

    if (isLoading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                }}
            >
                <ProgressSpinner style={{ width: "50px", height: "50px" }} />
                <div style={{ marginLeft: "1rem" }}>Loading survey data...</div>
            </div>
        );
    }

    // Add this check for navigation between areas with the refresh flag
    if (isNavigatingToNewArea) {
        return (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                }}
            >
                <div
                    style={{
                        backgroundColor: "white",
                        padding: "2rem",
                        borderRadius: "8px",
                        width: "60%",
                        maxWidth: "500px",
                    }}
                >
                    <h2>Loading New Area</h2>
                    <p>Finalizing area setup and loading resources...</p>
                    <ProgressBar
                        mode="indeterminate"
                        style={{ height: "20px", marginBottom: "1rem" }}
                    />
                    <p style={{ textAlign: "center", fontStyle: "italic" }}>
                        Please wait while we prepare your new area...
                    </p>
                </div>
            </div>
        );
    }

    // Create a consolidated survey data object to pass to components
    const surveyDataForComponents = {
        // Basic info
        surveyId: internalSurveyId,
        refValue,
        surveyDate,
        parking,
        siteDetails,

        // Contacts
        contacts,
        primaryContactIndex,
        walkAroundContactIndex,

        // Structure data
        structureId,
        structureTotal,
        structureEntries,

        // Equipment data
        surveyData,
        equipmentItems,
        specialistEquipmentData,

        // Canopy data
        canopyTotal,
        canopyEntries,
        canopyComments,

        // Pricing data
        accessDoorPrice,
        ventilationPrice,
        airPrice,
        fanPartsPrice,
        airInExTotal,
        schematicItemsTotal,
        selectedGroupId,
        modify,

        // NEW: Additional services data
        parkingCost,
        postServiceReport,
        postServiceReportPrice,

        // Form sections
        operations,
        access,
        equipment, // CRITICAL: This now includes the dynamic categoryComments

        notes,
        ventilation,

        // Images and visual data
        surveyImages,

        // Schematic visual data
        placedItems,
        specialItems,
        gridSpaces,
        cellSize,
        flexiDuctSelections,
        accessDoorSelections,
        groupDimensions,
        fanGradeSelections,

        // MULTI-COLLECTION: Include collections array
        collections: surveyCollections,
    };

    return (
        <div className="survey-container">
            <Toast ref={toast} />

            {/* Site Information Section - Always visible */}
            <div className="initial-setup-container">
                {/* Site Selection Section */}
                <div
                    className="site-selection-container"
                    style={{
                        marginBottom: "2rem",
                        padding: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        background: "#f9f9f9",
                    }}
                >
                    <h2>Site Information</h2>
                    <p style={{ fontWeight: "bold", color: "#555" }}>
                        {!siteDetails || (!siteDetails._id && !siteDetails.id)
                            ? "Please select a site"
                            : `Selected site: ${
                                  siteDetails.siteName || siteDetails.name
                              }`}
                    </p>

                    {/* SurveyInfo component */}
                    <SurveyInfo
                        initialSiteDetails={siteDetails}
                        initialContacts={contacts}
                        initialPrimaryContactIndex={primaryContactIndex}
                        initialWalkAroundContactIndex={walkAroundContactIndex}
                        initialRefValue={refValue}
                        initialSurveyDate={surveyDate}
                        initialParking={parking}
                        initialOperations={operations}
                        initialEquipment={equipment}
                        initialNotes={notes}
                        onRefValueChange={(value) => {
                            if (value !== refValue) {
                                setRefValue(value);
                            }
                        }}
                        onSurveyDateChange={setSurveyDate}
                        onParkingChange={setParking}
                        onContactsChange={setContacts}
                        onPrimaryContactChange={setPrimaryContactIndex}
                        onWalkAroundContactChange={setWalkAroundContactIndex}
                        onSiteDetailsChange={handleSiteDetailsChange}
                        onOperationsChange={(newOps) => {
                            if (updatingOperationsRef.current) return;

                            const newOpsStr = JSON.stringify(newOps);
                            const prevOpsStr = JSON.stringify(
                                prevOperationsRef.current
                            );
                            if (newOpsStr === prevOpsStr) return;

                            updatingOperationsRef.current = true;
                            prevOperationsRef.current = JSON.parse(newOpsStr);
                            setOperations(newOps);

                            setTimeout(() => {
                                updatingOperationsRef.current = false;
                            }, 0);
                        }}
                        onEquipmentChange={handleEquipmentChange}
                        onNotesChange={(newNotes) => {
                            if (updatingNotesRef.current) return;

                            const newNotesStr = JSON.stringify(newNotes);
                            const prevNotesStr = JSON.stringify(
                                prevNotesRef.current
                            );
                            if (newNotesStr === prevNotesStr) return;

                            updatingNotesRef.current = true;
                            prevNotesRef.current = JSON.parse(newNotesStr);
                            setNotes(newNotes);

                            setTimeout(() => {
                                updatingNotesRef.current = false;
                            }, 0);
                        }}
                        isEditingMode={!!internalSurveyId}
                        // Pass prop to determine whether sections should be hidden
                        // Only show certain sections if site is selected
                        hideContacts={
                            !siteDetails ||
                            (!siteDetails._id && !siteDetails.id)
                        }
                        hideOperations={
                            !siteDetails ||
                            (!siteDetails._id && !siteDetails.id)
                        }
                        hideNotes={
                            !siteDetails ||
                            (!siteDetails._id && !siteDetails.id)
                        }
                    />
                </div>
            </div>

            {/* Main Survey Content - Only show when site is selected */}
            {siteDetails && (siteDetails._id || siteDetails.id) && (
                <>
                    {/* Collection information display if in a collection - USING UPDATED COMPONENT WITH COLLECTIONS */}
                    {areasPagination.totalAreas > 1 && (
                        <CollectionInfoBanner
                            areasPagination={areasPagination}
                            structureId={structureId}
                            collections={surveyCollections}
                            onSwitchCollection={(newCollectionId) => {
                                // Handle switching to a different collection
                                if (
                                    newCollectionId &&
                                    newCollectionId !==
                                        areasPagination.collectionId
                                ) {
                                    router.push(
                                        `/surveys/kitchenSurvey?id=${surveyId}&collection=${newCollectionId}`
                                    );
                                }
                            }}
                        />
                    )}

                    {/* Main content area */}
                    <div ref={contentRef}>
                        {/* Main Area */}
                        <div ref={mainAreaRef}>
                            <div ref={schematicRef}>
                                <Area1Logic
                                    isMainArea={true}
                                    visibleSections={visibleSections}
                                    setVisibleSections={setVisibleSections}
                                    structureTotal={structureTotal}
                                    setStructureTotal={
                                        handleStructureTotalChange
                                    }
                                    structureId={structureId}
                                    setStructureId={setStructureId}
                                    // PRIMARY DATA: Structure entries with enhanced handler
                                    structureEntries={structureEntries}
                                    setStructureEntries={
                                        handleStructureEntriesChange
                                    }
                                    surveyData={surveyData}
                                    setSurveyData={handleSurveyDataChange}
                                    equipmentId={equipmentId}
                                    setEquipmentId={setEquipmentId}
                                    canopyTotal={canopyTotal}
                                    setCanopyTotal={handleCanopyTotalChange}
                                    canopyId={canopyId}
                                    setCanopyId={setCanopyId}
                                    canopyEntries={canopyEntries}
                                    setCanopyEntries={setCanopyEntries}
                                    canopyComments={canopyComments}
                                    setCanopyComments={
                                        handleCanopyCommentsChange
                                    }
                                    specialistEquipmentData={
                                        specialistEquipmentData
                                    }
                                    setSpecialistEquipmentData={
                                        handleSpecialistEquipmentDataChange
                                    }
                                    specialistEquipmentId={
                                        specialistEquipmentId
                                    }
                                    setSpecialistEquipmentId={
                                        setSpecialistEquipmentId
                                    }
                                    selectedGroupId={selectedGroupId}
                                    setSelectedGroupId={setSelectedGroupId}
                                    accessDoorPrice={accessDoorPrice}
                                    setAccessDoorPrice={setAccessDoorPrice}
                                    ventilationPrice={ventilationPrice}
                                    setVentilationPrice={
                                        handleVentilationPriceChange
                                    }
                                    airPrice={airPrice}
                                    setAirPrice={setAirPrice}
                                    fanPartsPrice={fanPartsPrice}
                                    setFanPartsPrice={setFanPartsPrice}
                                    airInExTotal={airInExTotal}
                                    setAirInExTotal={setAirInExTotal}
                                    schematicItemsTotal={schematicItemsTotal}
                                    setSchematicItemsTotal={
                                        setSchematicItemsTotal
                                    }
                                    ventilation={ventilation}
                                    setVentilation={(newVent) => {
                                        if (updatingVentilationRef.current)
                                            return;

                                        const newVentStr =
                                            JSON.stringify(newVent);
                                        const prevVentStr = JSON.stringify(
                                            prevVentilationRef.current
                                        );
                                        if (newVentStr === prevVentStr) return;

                                        updatingVentilationRef.current = true;
                                        prevVentilationRef.current =
                                            JSON.parse(newVentStr);
                                        setVentilation(newVent);

                                        setTimeout(() => {
                                            updatingVentilationRef.current = false;
                                        }, 0);
                                    }}
                                    access={access}
                                    setAccess={(newAccess) => {
                                        if (updatingAccessRef.current) return;

                                        const newAccessStr =
                                            JSON.stringify(newAccess);
                                        const prevAccessStr = JSON.stringify(
                                            prevAccessRef.current
                                        );
                                        if (newAccessStr === prevAccessStr)
                                            return;

                                        updatingAccessRef.current = true;
                                        prevAccessRef.current =
                                            JSON.parse(newAccessStr);
                                        setAccess(newAccess);

                                        setTimeout(() => {
                                            updatingAccessRef.current = false;
                                        }, 0);
                                    }}
                                    accordion={accordion}
                                    toggleAccordion={toggleAccordion}
                                    equipment={equipment}
                                    setEquipment={handleEquipmentChange}
                                    operations={operations}
                                    setOperations={setOperations}
                                    notes={notes}
                                    setNotes={setNotes}
                                    // Schematic visual data
                                    placedItems={placedItems}
                                    setPlacedItems={setPlacedItems}
                                    specialItems={specialItems}
                                    setSpecialItems={setSpecialItems}
                                    gridSpaces={gridSpaces}
                                    setGridSpaces={setGridSpaces}
                                    cellSize={cellSize}
                                    setCellSize={setCellSize}
                                    flexiDuctSelections={flexiDuctSelections}
                                    setFlexiDuctSelections={
                                        setFlexiDuctSelections
                                    }
                                    accessDoorSelections={accessDoorSelections}
                                    setAccessDoorSelections={
                                        setAccessDoorSelections
                                    }
                                    groupDimensions={groupDimensions}
                                    setGroupDimensions={setGroupDimensions}
                                    fanGradeSelections={fanGradeSelections}
                                    setFanGradeSelections={
                                        setFanGradeSelections
                                    }
                                    // Survey images
                                    surveyImages={surveyImages}
                                    setSurveyImages={(images) => {
                                        const imagesStr =
                                            JSON.stringify(images);
                                        const currImagesStr =
                                            JSON.stringify(surveyImages);
                                        if (imagesStr !== currImagesStr) {
                                            setSurveyImages(images);
                                        }
                                    }}
                                    // Site details and reference
                                    siteDetails={siteDetails}
                                    refValue={refValue}
                                    // CRITICAL: Pass the specialist equipment survey object with category comments
                                    initialSpecialistEquipmentSurvey={
                                        initialSpecialistEquipmentSurvey
                                    }
                                    equipmentItems={equipmentItems}
                                />
                            </div>
                        </div>

                        {/* NEW: Add ParkingPostServiceReport component */}
                        <div
                            style={{
                                marginBottom: "3rem",
                                border: "3px solid #ddd",
                                padding: "1rem",
                            }}
                        >
                            <ParkingPostServiceReport
                                initialParkingCost={parkingCost}
                                initialPostServiceReport={postServiceReport}
                                initialPostServiceReportPrice={
                                    postServiceReportPrice
                                }
                                onParkingCostChange={handleParkingCostChange}
                                onPostServiceReportChange={
                                    handlePostServiceReportChange
                                }
                            />
                        </div>

                        {/* PriceTables for the main area - UPDATED with parking and post-service report */}
                        <PriceTables
                            structureTotal={structureTotal}
                            structureId={structureId}
                            equipmentTotal={computedEquipmentTotal()}
                            equipmentId={equipmentId}
                            canopyTotal={canopyTotal}
                            canopyId={canopyId}
                            accessDoorPrice={accessDoorPrice}
                            ventilationPrice={ventilationPrice}
                            airPrice={airPrice}
                            fanPartsPrice={fanPartsPrice}
                            airInExTotal={airInExTotal}
                            modify={modify}
                            setModify={setModify}
                            groupingId={selectedGroupId}
                            schematicItemsTotal={schematicItemsTotal}
                            specialistEquipmentData={specialistEquipmentData}
                            // NEW: Pass parking cost and post-service report data
                            parkingCost={parkingCost}
                            postServiceReport={postServiceReport}
                            postServiceReportPrice={postServiceReportPrice}
                            areaLabel={structureId}
                        />

                        {/* Grand Total Section with main area only - UPDATED with parking and post-service report */}
                        <GrandTotalSection
                            structureTotal={structureTotal}
                            structureId={structureId}
                            computedEquipmentTotal={computedEquipmentTotal()}
                            canopyTotal={canopyTotal}
                            accessDoorPrice={accessDoorPrice}
                            ventilationPrice={ventilationPrice}
                            airPrice={airPrice}
                            fanPartsPrice={fanPartsPrice}
                            airInExTotal={airInExTotal}
                            schematicItemsTotal={schematicItemsTotal}
                            areasState={[]} // Empty array since we're removing child areas
                            modify={modify}
                            specialistEquipmentData={specialistEquipmentData}
                            // NEW: Pass parking cost and post-service report data
                            parkingCost={parkingCost}
                            postServiceReport={postServiceReport}
                            postServiceReportPrice={postServiceReportPrice}
                        />
                    </div>

                    {/* Bottom section with area pagination and save buttons */}
                    <div style={{ position: "relative", marginBottom: "4rem" }}>
                        {/* Area Pagination - UPDATED TO PASS SURVEY DATA */}
                        {areasPagination.totalAreas > 1 && (
                            <AreaPagination
                                paginationData={areasPagination}
                                currentSurveyId={internalSurveyId}
                                surveyData={surveyDataForComponents}
                                fixedPosition={true}
                            />
                        )}

                        {/* Save and Add New Area buttons - USING CONSOLIDATED COMPONENT WITH COLLECTIONS */}
                        <SurveyActionButtonsConsolidated
                            contentRef={contentRef}
                            schematicRef={schematicRef}
                            surveyData={surveyDataForComponents}
                            internalSurveyId={internalSurveyId}
                            areasPagination={areasPagination}
                            createSurveyIfNeeded={createMainSurveyInBackground}
                            fixedPosition={true}
                            forceSyncComponents={forceSyncAllComponents}
                        />
                    </div>
                </>
            )}
        </div>
    );
}