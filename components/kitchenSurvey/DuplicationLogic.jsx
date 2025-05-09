// components/kitchenSurvey/DuplicationLogic.jsx
"use client";

import { useRef, useState, useEffect } from "react";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import Equipment from "@/components/kitchenSurvey/Equipment";
import Schematic from "@/components/kitchenSurvey/Schematic/Schematic.jsx";
import Structure from "@/components/kitchenSurvey/Structure";
import Canopy from "@/components/kitchenSurvey/Canopy";
import SpecialistEquipment from "@/components/kitchenSurvey/SpecialistEquipment";
import VentilationInformationAccordion from "@/components/kitchenSurvey/surveyInfo/VentilationInformation";
import AccessRequirementsAccordion from "@/components/kitchenSurvey/surveyInfo/AccessRequirements";
import Images from "@/components/kitchenSurvey/Images";

// Main DuplicationLogic component that manages areas
export default function DuplicationLogic({
    areas,
    setAreas,
    areasState,
    setAreasState,
    equipmentItems,
    initialAreas = [],
    areaRefs = [], // Added areaRefs prop for scrolling functionality
}) {
    // Reference to the Toast component
    const toast = useRef(null);
    const [isHovered, setIsHovered] = useState(false); // ← NEW

    // ADDED: Refs to track update status and prevent circular updates
    const isUpdatingAreasRef = useRef(false);
    const isUpdatingAreasStateRef = useRef(false);
    const prevAreasRef = useRef([]);
    const prevAreasStateRef = useRef([]);
    const initializedRef = useRef(false);

    // ADDED: Initialize refs with initial data
    useEffect(() => {
        if (!initializedRef.current) {
            prevAreasRef.current = [...areas];
            prevAreasStateRef.current = [...areasState];
            initializedRef.current = true;
        }
    }, [areas, areasState]);

    // Add a new area with toast notification
    const handleNewArea = () => {
        // Add the new area directly
        addNewArea();

        // Show a toast notification instead of a dialog
        toast.current.show({
            severity: "success",
            summary: "Confirmation",
            detail: "New area added.",
            life: 3000,
        });
    };

    // ADDED: Safe handler for areas updates
    const safeUpdateAreas = (newAreas) => {
        // Skip if already updating
        if (isUpdatingAreasRef.current) {
            return;
        }

        // Skip if no actual change
        const newAreasStr = JSON.stringify(newAreas);
        const prevAreasStr = JSON.stringify(prevAreasRef.current);
        if (newAreasStr === prevAreasStr) {
            return;
        }

        // Set flag to prevent circular updates
        isUpdatingAreasRef.current = true;

        // Update reference
        prevAreasRef.current = JSON.parse(newAreasStr);

        // Update state
        setAreas(newAreas);

        // Reset flag after a short delay
        setTimeout(() => {
            isUpdatingAreasRef.current = false;
        }, 0);
    };

    // ADDED: Safe handler for areasState updates
    const safeUpdateAreasState = (newAreasState) => {
        // Skip if already updating
        if (isUpdatingAreasStateRef.current) {
            return;
        }

        // Skip if no actual change
        const newAreasStateStr = JSON.stringify(newAreasState);
        const prevAreasStateStr = JSON.stringify(prevAreasStateRef.current);
        if (newAreasStateStr === prevAreasStateStr) {
            return;
        }

        // Set flag to prevent circular updates
        isUpdatingAreasStateRef.current = true;

        // Update reference
        prevAreasStateRef.current = JSON.parse(newAreasStateStr);

        // Update state
        setAreasState(newAreasState);

        // Reset flag after a short delay
        setTimeout(() => {
            isUpdatingAreasStateRef.current = false;
        }, 0);
    };

    // Add a new area
    const addNewArea = () => {
        const newAreaId = Date.now();
        safeUpdateAreas([...areas, { id: newAreaId }]);
        safeUpdateAreasState([...areasState, { id: newAreaId }]);
    };

    // Update a specific area's totals and data
    function updateAreaTotals(index, areaTotals) {
        // Skip if the areas state array doesn't exist yet
        if (!prevAreasStateRef.current) return;

        // Create a new array to avoid direct mutation
        const newArr = [...prevAreasStateRef.current];

        // Make sure the array has an element at this index
        while (newArr.length <= index) {
            newArr.push({});
        }

        // Preserve the ID and any other existing data
        const existingData = newArr[index] || {};

        // Create the new area state with all properties
        const updatedArea = {
            ...existingData,
            id: existingData.id || areas[index]?.id || Date.now(),
            equipmentTotal: areaTotals.equipmentTotal || 0,
            structureTotal: areaTotals.structureTotal || 0,
            canopyTotal: areaTotals.canopyTotal || 0,
            airPrice: areaTotals.airPrice || 0,
            fanPartsPrice: areaTotals.fanPartsPrice || 0,
            airInExTotal: areaTotals.airInExTotal || 0,
            accessDoorPrice: areaTotals.accessDoorPrice || 0,
            ventilationPrice: areaTotals.ventilationPrice || 0,
            schematicItemsTotal: areaTotals.schematicItemsTotal || 0,
            specialistEquipmentData: areaTotals.specialistEquipmentData || [],
            groupingId: areaTotals.groupingId || "",
            structure: areaTotals.structure || {},
            equipment: areaTotals.equipment || [],
            equipmentNotes: areaTotals.equipmentNotes || "",
            equipmentSubcategoryComments:
                areaTotals.equipmentSubcategoryComments || {},
            canopy: areaTotals.canopy || [],
            schematic: areaTotals.schematic || {},
            ventilation: areaTotals.ventilation || {},
            access: areaTotals.access || {}, // Added access data storage
            // Include top-level images if available
            images: areaTotals.images || {},
        };

        // Only update if something actually changed
        if (JSON.stringify(updatedArea) !== JSON.stringify(newArr[index])) {
            newArr[index] = updatedArea;
            safeUpdateAreasState(newArr);
        }
    }

    // Remove an area
    const handleRemoveArea = (index) => {
        confirmDialog({
            message: `Are you sure you want to remove Area ${
                index + 2
            }? This action cannot be undone.`,
            header: "Confirm Removal",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => {
                safeUpdateAreas(areas.filter((_, i) => i !== index));
                safeUpdateAreasState(areasState.filter((_, i) => i !== index));
            },
            reject: () => {},
        });
    };

    // Initialize areas from saved data if available
    useEffect(() => {
        if (initialAreas && initialAreas.length > 0 && areas.length === 0) {
            const newAreas = initialAreas.map((area) => ({
                id: area.id || Date.now(),
            }));
            safeUpdateAreas(newAreas);
            safeUpdateAreasState(initialAreas);
        }
    }, [initialAreas, areas.length]);

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            {areas.map((area, index) => (
                <div key={area.id} ref={areaRefs[index]}>
                    {" "}
                    {/* Add ref to allow scrolling to this area */}
                    <DuplicatedArea
                        areaIndex={index}
                        areaId={area.id}
                        onAreaTotalsChange={(areaTotals) =>
                            updateAreaTotals(index, areaTotals)
                        }
                        equipmentItems={equipmentItems}
                        initialData={areasState[index] || {}}
                        onRemoveArea={() => handleRemoveArea(index)}
                    />
                </div>
            ))}

            <button
                onClick={handleNewArea}
                onMouseEnter={() => setIsHovered(true)} // ← NEW
                onMouseLeave={() => setIsHovered(false)} // ← NEW
                style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1rem",
                    marginBottom: "3rem",
                    backgroundColor: isHovered ? "#F9C400" : "#7e7e7e", // UPDATED
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            >
                + Area
            </button>
        </>
    );
}

// DuplicatedArea component for each additional area
function DuplicatedArea({
    areaIndex,
    areaId,
    onAreaTotalsChange,
    equipmentItems,
    initialData,
    onRemoveArea,
}) {
    const areaRef = useRef(null);
    const [areaInitialized, setAreaInitialized] = useState(false);

    // ADDED: Refs to track update status and prevent circular updates
    const updatingAreaTotalsRef = useRef(false);
    const prevAreaTotalsRef = useRef({});

    // ADDED: Initialize refs with initial data
    useEffect(() => {
        if (!areaInitialized && initialData) {
            prevAreaTotalsRef.current = { ...initialData };
        }
    }, [areaInitialized, initialData]);

    // Scroll to this area when it's newly created
    useEffect(() => {
        if (areaRef.current) {
            areaRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, []);

    // Add specialist equipment to visible sections
    const [visibleSections, setVisibleSections] = useState([
        "structure",
        "equipment",
        "canopy",
        "schematic",
        "specialistEquipment",
        "images",
    ]);

    // State for this duplicated area
    const [structureTotal, setStructureTotal] = useState(
        initialData?.structureTotal || 0
    );
    const [structureId, setStructureId] = useState(
        initialData?.structure?.structureId || ""
    );
    const [surveyData, setSurveyData] = useState(initialData?.equipment || []);
    const [equipmentId, setEquipmentId] = useState("");

    // Add equipment state for notes and subcategory comments
    const [equipment, setEquipment] = useState({
        notes: initialData?.equipmentNotes || "",
        subcategoryComments: initialData?.equipmentSubcategoryComments || {},
    });

    // Add separate top-level images state
    const [areaImages, setAreaImages] = useState(initialData?.images || {});

    // State for specialist equipment in duplicated area
    const [specialistEquipmentData, setSpecialistEquipmentData] = useState(
        initialData?.specialistEquipmentData || []
    );
    const [specialistEquipmentId, setSpecialistEquipmentId] = useState("");

    const [canopyTotal, setCanopyTotal] = useState(
        initialData?.canopyTotal || 0
    );
    const [canopyId, setCanopyId] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState(
        initialData?.groupingId || ""
    );
    const [accessDoorPrice, setAccessDoorPrice] = useState(
        initialData?.accessDoorPrice || 0
    );
    const [ventilationPrice, setVentilationPrice] = useState(
        initialData?.ventilationPrice || 0
    );
    const [airPrice, setAirPrice] = useState(initialData?.airPrice || 0);
    const [fanPartsPrice, setFanPartsPrice] = useState(
        initialData?.fanPartsPrice || 0
    );
    const [airInExTotal, setAirInExTotal] = useState(
        initialData?.airInExTotal || 0
    );
    const [schematicItemsTotal, setSchematicItemsTotal] = useState(
        initialData?.schematicItemsTotal || 0
    );

    // Add ventilation state for duplicated areas
    const [ventilation, setVentilation] = useState(
        initialData?.ventilation || {
            obstructionsToggle: "No",
            damageToggle: "No",
            inaccessibleAreasToggle: "No",
            clientActionsToggle: "No",
            description: "",
            accessLocations: [],
        }
    );

    // Add access state for duplicated areas - matches Area1Logic
    const [access, setAccess] = useState(
        initialData?.access || {
            inductionNeeded: "No",
            inductionDetails: "",
            maintenanceEngineer: "No",
            maintenanceContact: "",
            mechanicalEngineer: "No",
            mechanicalContact: "",
            electricalEngineer: "No",
            electricalContact: "",
            systemIsolated: "No",
            roofAccess: "No",
            roofAccessContact: "",
            wasteTankToggle: "No",
            keysrequired: "No",
            keysContact: "",
            permitToWork: "No",
            ppeToggle: "No",
            frequencyOfService: "",
        }
    );

    // Add accordion state for duplicated areas
    const [accordion, setAccordion] = useState({
        ventilation: false,
        access: false,
    });

    // Toggle accordion function for duplicated areas
    const toggleAccordion = (section) => {
        setAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // ADDED: Safe handlers for all state updates

    // Safe handler for structure total changes
    const handleStructureTotalChange = (total) => {
        if (total === structureTotal) return;
        setStructureTotal(total);
    };

    // Safe handler for structure ID changes
    const handleStructureIdChange = (id) => {
        if (id === structureId) return;
        setStructureId(id);
        // Also update selected group ID if they should stay in sync
        if (selectedGroupId === structureId) {
            setSelectedGroupId(id);
        }
    };

    // Safe handler for survey data changes
    const handleSurveyDataChange = (data) => {
        // Skip if no actual change
        const dataStr = JSON.stringify(data);
        const prevDataStr = JSON.stringify(surveyData);
        if (dataStr === prevDataStr) return;

        setSurveyData(data);
    };

    // Safe handler for equipment changes
    const handleEquipmentChange = (newEquipment) => {
        // Skip if no actual change
        const equipStr = JSON.stringify(newEquipment);
        const prevEquipStr = JSON.stringify(equipment);
        if (equipStr === prevEquipStr) return;

        setEquipment(newEquipment);
    };

    // Safe handler for specialist equipment changes
    const handleSpecialistEquipmentChange = (data) => {
        // Skip if no actual change
        const dataStr = JSON.stringify(data);
        const prevDataStr = JSON.stringify(specialistEquipmentData);
        if (dataStr === prevDataStr) return;

        setSpecialistEquipmentData(data);
    };

    // Safe handler for area images changes
    const handleAreaImagesChange = (images) => {
        // Skip if no actual change
        const imagesStr = JSON.stringify(images);
        const prevImagesStr = JSON.stringify(areaImages);
        if (imagesStr === prevImagesStr) return;

        setAreaImages(images);
    };

    // Handle ventilation price change from Flexi-Duct/Flexi Hose items
    const handleVentilationPriceChange = (price) => {
        setVentilationPrice(price);
    };

    // Initialize area with data from saved survey
    useEffect(() => {
        if (initialData && !areaInitialized) {
            if (initialData.structure) {
                setStructureTotal(initialData.structure.structureTotal || 0);
                setStructureId(initialData.structure.structureId || "");
            }

            if (initialData.equipment) {
                setSurveyData(initialData.equipment);
            }

            // Initialize equipment with notes and subcategory comments
            setEquipment({
                notes: initialData.equipmentNotes || "",
                subcategoryComments:
                    initialData.equipmentSubcategoryComments || {},
            });

            // Initialize with top-level images if available
            if (initialData.images) {
                setAreaImages(initialData.images);
            }

            if (initialData.specialistEquipmentData) {
                setSpecialistEquipmentData(initialData.specialistEquipmentData);
            }

            if (initialData.canopy) {
                setCanopyTotal(initialData.canopyTotal || 0);
            }

            setSelectedGroupId(initialData.groupingId || "");
            setAccessDoorPrice(initialData.accessDoorPrice || 0);
            setVentilationPrice(initialData.ventilationPrice || 0);
            setAirPrice(initialData.airPrice || 0);
            setFanPartsPrice(initialData.fanPartsPrice || 0);
            setAirInExTotal(initialData.airInExTotal || 0);
            setSchematicItemsTotal(initialData.schematicItemsTotal || 0);

            if (initialData.ventilation) {
                setVentilation(initialData.ventilation);
            }

            if (initialData.access) {
                setAccess(initialData.access);
            }

            setAreaInitialized(true);
        }
    }, [initialData, areaInitialized]);

    // Recompute local area's equipment total from surveyData
    const computedAreaEquipmentTotal = () => {
        return surveyData.reduce((sum, entry) => {
            const match = equipmentItems.find(
                (itm) =>
                    itm.subcategory.trim().toLowerCase() ===
                        entry.subcategory.trim().toLowerCase() &&
                    itm.item.trim().toLowerCase() ===
                        entry.item.trim().toLowerCase()
            );
            if (match && match.prices && match.prices[entry.grade] != null) {
                const price = Number(match.prices[entry.grade]);
                const qty = Number(entry.number) || 0;
                return sum + price * qty;
            }
            return sum;
        }, 0);
    };

    // ADDED: Safe handler for area totals changes with protection against circular updates
    const updateAreaTotals = () => {
        // Skip if we're already updating
        if (updatingAreaTotalsRef.current) {
            return;
        }

        // Build current area totals object
        const localEquipmentTotal = computedAreaEquipmentTotal();
        const currentTotals = {
            id: areaId,
            equipmentTotal: localEquipmentTotal,
            structureTotal,
            canopyTotal,
            airPrice,
            fanPartsPrice,
            airInExTotal,
            accessDoorPrice,
            ventilationPrice,
            schematicItemsTotal,
            specialistEquipmentData: specialistEquipmentData,
            groupingId: selectedGroupId || "",
            structure: {
                structureId,
                structureTotal,
            },
            equipment: surveyData,
            // Include equipment notes and subcategory comments
            equipmentNotes: equipment?.notes || "",
            equipmentSubcategoryComments: equipment?.subcategoryComments || {},
            canopy: canopyTotal ? [{ canopyTotal }] : [],
            schematic: {
                accessDoorPrice,
                ventilationPrice,
                airPrice,
                fanPartsPrice,
                airInExTotal,
                schematicItemsTotal,
                selectedGroupId,
            },
            ventilation: ventilation,
            access: access, // Now including access data
            // Include top-level images
            images: areaImages,
        };

        // Skip if there's no actual change
        const currentTotalsStr = JSON.stringify(currentTotals);
        const prevTotalsStr = JSON.stringify(prevAreaTotalsRef.current);
        if (currentTotalsStr === prevTotalsStr) {
            return;
        }

        // Set flag to prevent circular updates
        updatingAreaTotalsRef.current = true;

        // Update reference
        prevAreaTotalsRef.current = JSON.parse(currentTotalsStr);

        // Call parent's handler
        onAreaTotalsChange(currentTotals);

        // Reset flag after a short delay
        setTimeout(() => {
            updatingAreaTotalsRef.current = false;
        }, 0);
    };

    // Whenever any local totals change, call updateAreaTotals
    useEffect(() => {
        updateAreaTotals();
    }, [
        areaId,
        structureTotal,
        structureId,
        canopyTotal,
        surveyData,
        specialistEquipmentData,
        airPrice,
        fanPartsPrice,
        airInExTotal,
        accessDoorPrice,
        ventilationPrice,
        schematicItemsTotal,
        selectedGroupId,
        ventilation,
        access, // Now watching access changes
        equipment, // Watch equipment state changes for notes and comments
        areaImages, // Watch top-level images changes
        onAreaTotalsChange,
    ]);

    return (
        <>
            <hr
                style={{
                    borderTop: "3px solid #000",
                    width: "100%",
                    margin: "1rem 0",
                }}
            />

            {/* Header section in its own container like Area1Logic */}
            <div
                ref={areaRef}
                style={{
                    marginBottom: "3rem",
                    marginTop: "2rem",
                    border: "3px solid #ddd",
                    padding: "1rem",
                    position: "relative",
                }}
            >
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-sm"
                    onClick={onRemoveArea}
                    style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        backgroundColor: "#F44336",
                    }}
                />

                <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
                    {structureId || `Area ${areaIndex + 2}`}
                </h1>

                {/* Area ID input */}
                <div
                    style={{
                        gap: "0.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        fontSize: "0.5rem",
                        textAlign: "center",
                        marginBottom: "1rem",
                    }}
                >
                    <InputText
                        placeholder="Enter Area ID"
                        value={structureId}
                        onChange={(e) => {
                            handleStructureIdChange(e.target.value);
                            setSelectedGroupId(e.target.value);
                        }}
                        onBlur={(e) =>
                            handleStructureIdChange(e.target.value.trim())
                        }
                    />
                </div>

                <div
                    style={{
                        gap: "0.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        fontSize: "0.5rem",
                    }}
                >
                    <MultiSelect
                        id={`area-${areaIndex}-visible-sections`}
                        name={`area-${areaIndex}-visible-sections`}
                        value={visibleSections}
                        options={[
                            { label: "Structure", value: "structure" },
                            { label: "Equipment", value: "equipment" },
                            { label: "Canopy", value: "canopy" },
                            { label: "Schematic", value: "schematic" },
                            {
                                label: "Specialist Equipment",
                                value: "specialistEquipment",
                            },
                            { label: "Images", value: "images" },
                        ]}
                        onChange={(e) => setVisibleSections(e.value)}
                        placeholder="choose sections"
                        style={{ width: "100%" }}
                    />
                </div>
            </div>

            {visibleSections.includes("structure") && (
                <div
                    style={{
                        marginBottom: "3rem",
                        border: "3px solid #ddd",
                        padding: "1rem",
                    }}
                >
                    <Structure
                        onStructureTotalChange={handleStructureTotalChange}
                        onStructureIdChange={handleStructureIdChange}
                        initialStructureId={structureId}
                        initialStructureTotal={structureTotal}
                    />
                </div>
            )}

            {visibleSections.includes("canopy") && (
                <div
                    style={{
                        marginBottom: "3rem",
                        border: "3px solid #ddd",
                        padding: "1rem",
                    }}
                >
                    <Canopy
                        onCanopyTotalChange={setCanopyTotal}
                        structureIds={structureId ? [structureId] : []}
                        onCanopyIdChange={setCanopyId}
                        initialCanopyTotal={canopyTotal}
                        initialCanopyId={canopyId}
                    />
                </div>
            )}

            {visibleSections.includes("equipment") && (
                <div
                    style={{
                        marginBottom: "3rem",
                        border: "3px solid #ddd",
                        padding: "1rem",
                    }}
                >
                    <Equipment
                        onSurveyListChange={handleSurveyDataChange}
                        structureIds={structureId ? [structureId] : []}
                        onEquipmentIdChange={setEquipmentId}
                        initialSurveyData={surveyData}
                        initialEquipmentId={equipmentId}
                        equipment={equipment}
                        initialNotes={equipment?.notes || ""}
                        initialSubcategoryComments={
                            equipment?.subcategoryComments || {}
                        }
                        onNotesChange={(notes) => {
                            // Update equipment with new notes
                            handleEquipmentChange({
                                ...equipment,
                                notes: notes,
                            });
                        }}
                        onEquipmentChange={handleEquipmentChange}
                    />
                </div>
            )}

            {visibleSections.includes("schematic") && (
                <div
                    style={{
                        marginBottom: "3rem",
                        border: "3px solid #ddd",
                        padding: "1rem",
                    }}
                >
                    <Schematic
                        structureIds={structureId ? [structureId] : []}
                        groupingId={selectedGroupId}
                        onGroupIdChange={(val) => setSelectedGroupId(val)}
                        onAccessDoorPriceChange={(price) =>
                            setAccessDoorPrice((prev) => prev + price)
                        }
                        onVentilationPriceChange={handleVentilationPriceChange}
                        onFanPartsPriceChange={setFanPartsPrice}
                        onAirInExPriceChange={setAirInExTotal}
                        onSchematicItemsTotalChange={(val) =>
                            setSchematicItemsTotal(val)
                        }
                        initialAccessDoorPrice={accessDoorPrice}
                        initialVentilationPrice={ventilationPrice}
                        initialFanPartsPrice={fanPartsPrice}
                        initialAirInExTotal={airInExTotal}
                        initialSchematicItemsTotal={schematicItemsTotal}
                    />
                </div>
            )}

            {/* Ventilation Information Accordion */}
            <VentilationInformationAccordion
                ventilation={ventilation}
                setVentilation={setVentilation}
                isOpen={accordion.ventilation}
                toggleAccordion={() => toggleAccordion("ventilation")}
            />

            <div style={{ marginBottom: "3rem" }} />

            {visibleSections.includes("specialistEquipment") && (
                <div
                    style={{
                        border: "3px solid #ddd",
                        padding: "1rem",
                        marginBottom: "3rem",
                    }}
                >
                    <SpecialistEquipment
                        onSurveyListChange={handleSpecialistEquipmentChange}
                        structureIds={structureId ? [structureId] : []}
                        onEquipmentIdChange={setSpecialistEquipmentId}
                        initialSpecialistEquipmentData={specialistEquipmentData}
                        initialSpecialistEquipmentId={specialistEquipmentId}
                        equipment={equipment}
                        initialNotes={equipment?.notes || ""}
                        initialCategoryComments={
                            equipment?.categoryComments || {}
                        }
                        onNotesChange={(notes) => {
                            // Update equipment with new notes
                            handleEquipmentChange({
                                ...equipment,
                                notes: notes,
                            });
                        }}
                        onEquipmentChange={handleEquipmentChange}
                    />
                </div>
            )}

            {/* Access Requirements Accordion */}
            <AccessRequirementsAccordion
                access={access}
                setAccess={setAccess}
                isOpen={accordion.access}
                toggleAccordion={() => toggleAccordion("access")}
            />

            <div style={{ marginBottom: "3rem" }} />

            {visibleSections.includes("images") && (
                <div
                    style={{
                        marginBottom: "3rem",
                        border: "3px solid #ddd",
                        padding: "1rem",
                    }}
                >
                    {/* Images component now uses top-level areaImages state */}
                    <Images
                        initialImages={areaImages}
                        onImagesChange={handleAreaImagesChange}
                        surveyRef={`Area${areaIndex + 2}`} // Use area number for reference
                        siteName={`Area ${areaIndex + 2}`} // Use area number for site name
                    />
                </div>
            )}
        </>
    );
}
