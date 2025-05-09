// app\surveys\kitchenSurvey\storedKitchenSurveys\[id]\page.jsx
"use client";
import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ExportPDF from "../../../../../components/PDF/export";
import Equipment from "../../../../../components/kitchenSurvey/Equipment";
import HamburgerMenu from "../../../../../components/global/HamburgerMenu";
import Schematic from "../../../../../components/kitchenSurvey/Schematic/Schematic.jsx";
import Structure from "../../../../../components/kitchenSurvey/Structure";
import Canopy from "../../../../../components/kitchenSurvey/Canopy";
import PriceTables from "../../../../../components/kitchenSurvey/prices";
import SurveyInfo from "../../../../../components/kitchenSurvey/surveyInfo";
import SiteSelect from "../../../../../components/kitchenSurvey/surveyInfo/siteSelect";
import Images from "../../../../../components/kitchenSurvey/Images";
import { Toast } from "primereact/toast";
import "../../../styles/surveyForm.css";

export default function EditSurveyForm() {
    const { id } = useParams();
    const router = useRouter();
    const contentRef = useRef(null);
    const toast = useRef(null);

    // States for survey data
    const [surveyDate, setSurveyDate] = useState(new Date());
    const [refValue, setRefValue] = useState("");
    const [parking, setParking] = useState("");
    const [surveyData, setSurveyData] = useState([]);
    const [equipmentItems, setEquipmentItems] = useState([]);
    const [structureTotal, setStructureTotal] = useState(0);
    const [canopyTotal, setCanopyTotal] = useState(0);
    const [accessDoorPrice, setAccessDoorPrice] = useState(0);
    const [ventilationPrice, setVentilationPrice] = useState(0);
    const [airPrice, setAirPrice] = useState(0);
    const [fanPartsPrice, setFanPartsPrice] = useState(0);
    const [airInExTotal, setAirInExTotal] = useState(0);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [groupDimensions, setGroupDimensions] = useState({});

    // Separate state for images with loading indicator
    const [surveyImages, setSurveyImages] = useState({});
    const [imagesLoading, setImagesLoading] = useState(true);
    const [surveyDataLoaded, setSurveyDataLoaded] = useState(false);

    // Operations, equipment, notes
    const [operations, setOperations] = useState({
        patronDisruption: "No",
        eightHoursAvailable: "No",
        operationalHours: {
            weekdays: { start: "", end: "" },
            weekend: { start: "", end: "" },
        },
    });
    const [equipment, setEquipment] = useState({});
    const [notes, setNotes] = useState({});

    // Contacts
    const [contacts, setContacts] = useState([]);
    const [primaryContactIndex, setPrimaryContactIndex] = useState(null);
    const [walkAroundContactIndex, setWalkAroundContactIndex] = useState(null);

    // Site details
    const [siteDetails, setSiteDetails] = useState({
        siteName: "",
        addresses: [
            {
                addressNameNumber: "",
                addressLine1: "",
                addressLine2: "",
                town: "",
                county: "",
                postCode: "",
            },
        ],
    });

    // IDs for grouping totals
    const [structureId, setStructureId] = useState("");
    const [equipmentId, setEquipmentId] = useState("");
    const [canopyId, setCanopyId] = useState("");

    // Modification factor for pricing
    const [modify, setModify] = useState(0);

    // Fetch the stored survey data
    useEffect(() => {
        async function fetchSurvey() {
            try {
                const res = await fetch(
                    `/api/surveys/kitchenSurveys/viewAll/${id}`
                );
                if (!res.ok) {
                    throw new Error("Survey not found");
                }

                const json = await res.json();
                if (json.success) {
                    const survey = json.data;
                    console.log("LOADED SURVEY:", survey);

                    // Set basic info
                    setSurveyDate(
                        survey.surveyDate
                            ? new Date(survey.surveyDate)
                            : new Date()
                    );
                    setRefValue(survey.refValue || "");

                    // Set site details
                    if (survey.site) {
                        setSiteDetails(survey.site);
                    }

                    // Set parking from general section
                    if (
                        survey.general &&
                        survey.general.parking !== undefined
                    ) {
                        setParking(survey.general.parking);
                    }

                    // Set structure data
                    if (survey.structure) {
                        setStructureId(survey.structure.structureId || "");
                        setStructureTotal(survey.structure.structureTotal || 0);
                    }

                    // Set equipment data
                    if (survey.equipmentSurvey) {
                        // Set equipment entries
                        if (survey.equipmentSurvey.entries) {
                            setSurveyData(survey.equipmentSurvey.entries || []);
                        }

                        // If equipment has subcategoryComments, include them in equipment state
                        if (survey.equipmentSurvey.subcategoryComments) {
                            console.log(
                                "Loading subcategoryComments from survey:",
                                survey.equipmentSurvey.subcategoryComments
                            );
                            setEquipment((prevEquipment) => ({
                                ...prevEquipment,
                                subcategoryComments:
                                    survey.equipmentSurvey.subcategoryComments,
                            }));
                        }

                        // If equipment has notes, include them in equipment state
                        if (survey.equipmentSurvey.notes) {
                            setEquipment((prevEquipment) => ({
                                ...prevEquipment,
                                notes: survey.equipmentSurvey.notes,
                            }));
                        }
                    }

                    // Set canopy data
                    if (
                        survey.canopySurvey &&
                        survey.canopySurvey.entries &&
                        survey.canopySurvey.entries.length > 0
                    ) {
                        setCanopyTotal(
                            survey.canopySurvey.entries[0].canopyTotal || 0
                        );
                    }

                    // Set schematic data
                    if (survey.schematic) {
                        setAccessDoorPrice(
                            survey.schematic.accessDoorPrice || 0
                        );
                        setVentilationPrice(
                            survey.schematic.ventilationPrice || 0
                        );
                        setAirPrice(survey.schematic.airPrice || 0);
                        setFanPartsPrice(survey.schematic.fanPartsPrice || 0);
                        setAirInExTotal(survey.schematic.airInExTotal || 0);
                        setSelectedGroupId(
                            survey.schematic.selectedGroupId || ""
                        );

                        // Load group dimensions for proper dimension inputs
                        if (survey.schematic.groupDimensions) {
                            console.log(
                                "Loading saved group dimensions:",
                                survey.schematic.groupDimensions
                            );
                            setGroupDimensions(
                                survey.schematic.groupDimensions
                            );
                        }
                    }

                    // Enhanced operations data handling with full normalization
                    if (survey.operations) {
                        // Log raw data for debugging
                        console.log(
                            "Raw operations data from API:",
                            survey.operations
                        );

                        // Create a proper structure with defaults and normalized values
                        const normalizedOps = {
                            // Default values
                            patronDisruption: "No",
                            patronDisruptionDetails: "",
                            eightHoursAvailable: "No",
                            eightHoursAvailableDetails: "",
                            typeOfCooking: "",
                            coversPerDay: "",
                            bestServiceTime: "",
                            bestServiceDay: "Weekdays",
                            operationalHours: {
                                weekdays: { start: "", end: "" },
                                weekend: { start: "", end: "" },
                            },
                            serviceDue: null,
                            approxServiceDue: false,

                            // Spread loaded data on top of defaults
                            ...survey.operations,
                        };

                        // Strictly normalize toggle values to "Yes"/"No"
                        // This is critical for the UI components to work correctly
                        normalizedOps.patronDisruption =
                            normalizedOps.patronDisruption === true ||
                            normalizedOps.patronDisruption === "true" ||
                            normalizedOps.patronDisruption === "yes" ||
                            normalizedOps.patronDisruption === "Yes" ||
                            normalizedOps.patronDisruption === 1 ||
                            normalizedOps.patronDisruption === "1"
                                ? "Yes"
                                : "No";

                        normalizedOps.eightHoursAvailable =
                            normalizedOps.eightHoursAvailable === true ||
                            normalizedOps.eightHoursAvailable === "true" ||
                            normalizedOps.eightHoursAvailable === "yes" ||
                            normalizedOps.eightHoursAvailable === "Yes" ||
                            normalizedOps.eightHoursAvailable === 1 ||
                            normalizedOps.eightHoursAvailable === "1"
                                ? "Yes"
                                : "No";

                        // Ensure complete operationalHours structure
                        if (!normalizedOps.operationalHours) {
                            normalizedOps.operationalHours = {
                                weekdays: { start: "", end: "" },
                                weekend: { start: "", end: "" },
                            };
                        } else {
                            // Ensure nested structures
                            normalizedOps.operationalHours.weekdays =
                                normalizedOps.operationalHours.weekdays || {
                                    start: "",
                                    end: "",
                                };
                            normalizedOps.operationalHours.weekend =
                                normalizedOps.operationalHours.weekend || {
                                    start: "",
                                    end: "",
                                };
                        }

                        // Format serviceDue if it exists
                        if (normalizedOps.serviceDue) {
                            try {
                                normalizedOps.serviceDue = new Date(
                                    normalizedOps.serviceDue
                                );
                            } catch (e) {
                                console.error(
                                    "Error parsing serviceDue date:",
                                    e
                                );
                                normalizedOps.serviceDue = null;
                            }
                        }

                        console.log(
                            "Setting normalized operations:",
                            normalizedOps
                        );
                        setOperations(normalizedOps);
                    }

                    // Set equipment data
                    if (survey.specialistEquipment) {
                        setEquipment(survey.specialistEquipment);
                    }

                    // Set notes data
                    if (survey.notes) {
                        // Make sure obstructions is an array
                        const processedNotes = { ...survey.notes };
                        if (!Array.isArray(processedNotes.obstructions)) {
                            processedNotes.obstructions =
                                processedNotes.obstructions
                                    ? String(processedNotes.obstructions)
                                          .split(",")
                                          .map((s) => s.trim())
                                    : [];
                        }
                        setNotes(processedNotes);
                    }

                    // Set contacts data
                    if (survey.contacts && Array.isArray(survey.contacts)) {
                        setContacts(survey.contacts);

                        // Find primary contact by flag
                        const primaryIndex = survey.contacts.findIndex(
                            (c) => c.isPrimaryContact
                        );
                        if (primaryIndex !== -1) {
                            setPrimaryContactIndex(primaryIndex);
                        }

                        // Find walk around contact by flag
                        const walkAroundIndex = survey.contacts.findIndex(
                            (c) => c.isWalkAroundContact
                        );
                        if (walkAroundIndex !== -1) {
                            setWalkAroundContactIndex(walkAroundIndex);
                        }
                    }

                    // Set modification factor
                    if (survey.totals && survey.totals.modify !== undefined) {
                        setModify(survey.totals.modify || 0);
                    }

                    // Show success message
                    toast.current.show({
                        severity: "success",
                        summary: "Survey Loaded",
                        detail: "The survey has been loaded successfully",
                    });

                    // Mark survey data as loaded to trigger delayed image loading
                    setSurveyDataLoaded(true);
                } else {
                    console.error("Failed to fetch survey:", json.message);
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: "Failed to load survey",
                    });
                }
            } catch (err) {
                console.error("Error fetching survey:", err);
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Error loading survey: " + err.message,
                });
            }
        }

        if (id) {
            fetchSurvey();
        }
    }, [id]);

    // Delayed image loading after main survey data is loaded
    useEffect(() => {
        if (!surveyDataLoaded || !id) return;

        async function fetchImagesWithDelay() {
            // Set loading state
            setImagesLoading(true);

            console.log(
                "Starting delayed image fetch after survey data loaded"
            );

            // Add a longer delay to ensure main survey data is fully processed
            setTimeout(async () => {
                try {
                    console.log(
                        "Executing delayed image fetch for survey:",
                        id
                    );
                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll/${id}`
                    );

                    if (!res.ok) {
                        throw new Error("Failed to fetch survey images");
                    }

                    const json = await res.json();

                    if (json.success && json.data) {
                        // Check all possible locations for images with priority on standardized location
                        let images;

                        // First check for images at the top-level standardized location
                        if (json.data.images) {
                            images = json.data.images;
                            console.log(
                                "Found images in standardized top-level location:",
                                Object.keys(images).map(
                                    (cat) =>
                                        `${cat}: ${
                                            images[cat]?.length || 0
                                        } images`
                                )
                            );
                        }
                        // Legacy fallback 1: Check in specialistEquipment.images
                        else if (
                            json.data.specialistEquipment &&
                            json.data.specialistEquipment.images
                        ) {
                            images = json.data.specialistEquipment.images;
                            console.log(
                                "Found images in specialistEquipment (legacy location):",
                                Object.keys(images).map(
                                    (cat) =>
                                        `${cat}: ${
                                            images[cat]?.length || 0
                                        } images`
                                )
                            );
                        }
                        // Legacy fallback 2: Check in equipmentSurvey.images
                        else if (
                            json.data.equipmentSurvey &&
                            json.data.equipmentSurvey.images
                        ) {
                            images = json.data.equipmentSurvey.images;
                            console.log(
                                "Found images in equipmentSurvey (legacy location):",
                                Object.keys(images).map(
                                    (cat) =>
                                        `${cat}: ${
                                            images[cat]?.length || 0
                                        } images`
                                )
                            );
                        }

                        if (images && Object.keys(images).length > 0) {
                            console.log(
                                "Successfully loaded images in delayed fetch:",
                                Object.keys(images).map(
                                    (cat) =>
                                        `${cat}: ${
                                            images[cat]?.length || 0
                                        } images`
                                )
                            );

                            // Update images state
                            setSurveyImages(images);

                            // Also update equipment state to include images
                            setEquipment((prevEquipment) => ({
                                ...prevEquipment,
                                images: images,
                            }));

                            toast.current.show({
                                severity: "info",
                                summary: "Images Loaded",
                                detail: "Survey images have been successfully loaded",
                                life: 3000,
                            });
                        } else {
                            console.log(
                                "No images found in any location during delayed fetch"
                            );
                        }
                    }
                } catch (error) {
                    console.error("Error in delayed image fetch:", error);
                } finally {
                    setImagesLoading(false);
                }
            }, 3000); // 3 second delay - increased from 1.5s to ensure everything is ready
        }

        fetchImagesWithDelay();
    }, [surveyDataLoaded, id, toast]);

    // Fetch equipment items
    useEffect(() => {
        async function fetchEquipmentItems() {
            try {
                const res = await fetch("/api/priceList");
                const json = await res.json();
                if (json.success) {
                    const equipment = json.data
                        .filter((item) => item.category === "Equipment")
                        .map((item) => {
                            const newPrices = {};
                            if (item.prices) {
                                Object.keys(item.prices).forEach((grade) => {
                                    newPrices[grade] = Number(
                                        item.prices[grade]
                                    );
                                });
                            }
                            return { ...item, prices: newPrices };
                        });
                    setEquipmentItems(equipment);
                } else {
                    console.error("Failed to fetch equipment items:", json);
                }
            } catch (error) {
                console.error("Error fetching equipment items:", error);
            }
        }
        fetchEquipmentItems();
    }, []);

    // Compute equipment total from surveyData
    const computedEquipmentTotal = surveyData.reduce((sum, entry) => {
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

    // Save Survey Handler
    const handleSaveSurvey = async () => {
        const finalSurveyDate =
            surveyDate || new Date().toISOString().slice(0, 10);

        const surveyPayload = {
            surveyDate: finalSurveyDate,
            refValue: refValue,
            site: siteDetails._id || siteDetails,
            general: {
                surveyType: operations?.typeOfCooking || "Kitchen Deep Clean",
                parking: parking || "",
                dbs: "Not Required",
                permit: "No",
            },
            structure: { structureId, structureTotal },
            // Store all images in the standardized top-level images field
            images: surveyImages || equipment?.images || {},

            equipmentSurvey: {
                entries: surveyData,
                // Include equipment notes and subcategory comments if they exist
                notes: equipment?.notes || "",
                subcategoryComments: equipment?.subcategoryComments || {},
                // No longer store images here - using top-level field instead
            },
            canopySurvey: { entries: canopyTotal ? [{ canopyTotal }] : [] },
            schematic: {
                accessDoorPrice,
                ventilationPrice,
                airPrice,
                fanPartsPrice,
                airInExTotal,
                gridSpaces: undefined,
                groupDimensions, // Include dimensions in save payload
            },
            operations: operations,
            specialistEquipment: {
                ...equipment,
                // No longer store images here - using top-level field instead
            },
            notes: notes,
            contacts: contacts,
            totals: {
                structureTotal,
                equipmentTotal: computedEquipmentTotal,
                canopyTotal,
                accessDoorPrice,
                ventilationPrice,
                airPrice,
                fanPartsPrice,
                airInExTotal,
                modify,
            },
        };

        try {
            console.log("Saving survey with payload:", surveyPayload);
            const res = await fetch(
                `/api/surveys/kitchenSurveys/viewAll/${id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(surveyPayload),
                }
            );
            const json = await res.json();
            if (json.success) {
                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Survey updated successfully!",
                });
                setTimeout(() => {
                    router.push(`/database/clients/site/${siteDetails._id}`);
                }, 1500);
            } else {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to update survey: " + json.message,
                });
            }
        } catch (error) {
            console.error("Error saving survey:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Error saving survey: " + error.message,
            });
        }
    };

    // Log state for debugging
    useEffect(() => {
        console.log("Operations State:", operations);
    }, [operations]);

    return (
        <div className="survey-container">
            <Toast ref={toast} />
            <HamburgerMenu />
            <SiteSelect
                onSiteSelect={(site) => {
                    setSiteDetails(site);
                }}
            />
            <div ref={contentRef}>
                <>
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
                        onRefValueChange={setRefValue}
                        onSurveyDateChange={setSurveyDate}
                        onContactsChange={setContacts}
                        onPrimaryContactChange={setPrimaryContactIndex}
                        onWalkAroundContactChange={setWalkAroundContactIndex}
                        onOperationsChange={setOperations}
                        onEquipmentChange={setEquipment}
                        onNotesChange={setNotes}
                        onSiteDetailsChange={setSiteDetails}
                        onParkingChange={setParking}
                        isEditingMode={true}
                    />
                    <Structure
                        onStructureTotalChange={(total) =>
                            setStructureTotal(total)
                        }
                        onStructureIdChange={(id) => setStructureId(id)}
                    />
                    <Canopy
                        onCanopyTotalChange={setCanopyTotal}
                        structureIds={structureId ? [structureId] : []}
                        onCanopyIdChange={setCanopyId}
                    />
                    <Equipment
                        onSurveyListChange={(data) => setSurveyData(data)}
                        structureIds={structureId ? [structureId] : []}
                        onEquipmentIdChange={setEquipmentId}
                        initialSurveyData={surveyData}
                        equipment={equipment}
                        initialNotes={equipment.notes}
                        initialSubcategoryComments={
                            equipment.subcategoryComments
                        }
                        onEquipmentChange={(updatedEquipment) =>
                            setEquipment(updatedEquipment)
                        }
                        onNotesChange={(notes) =>
                            setEquipment((prev) => ({ ...prev, notes }))
                        }
                    />
                    <Schematic
                        structureIds={structureId ? [structureId] : []}
                        groupingId={selectedGroupId}
                        onGroupIdChange={(val) => setSelectedGroupId(val)}
                        onAccessDoorPriceChange={(price) =>
                            setAccessDoorPrice((prev) => prev + price)
                        }
                        onVentilationPriceChange={setVentilationPrice}
                        onFanPartsPriceChange={setFanPartsPrice}
                        onAirInExPriceChange={setAirInExTotal}
                        initialGroupDimensions={groupDimensions}
                    />
                    <Images
                        initialImages={surveyImages}
                        surveyRef={refValue}
                        siteName={siteDetails?.name || siteDetails?.siteName}
                    />
                    {/* Enhanced loading indicator for images */}
                    {imagesLoading && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "15px",
                                marginTop: "15px",
                                marginBottom: "15px",
                                border: "1px dashed #ccc",
                                borderRadius: "5px",
                                backgroundColor: "#f9f9f9",
                            }}
                        >
                            <h3 style={{ margin: "0 0 10px 0" }}>
                                Loading Images
                            </h3>
                            <p>
                                Please wait while survey images are being loaded
                                from Cloudinary...
                            </p>
                        </div>
                    )}
                </>
            </div>

            <PriceTables
                structureTotal={structureTotal}
                structureId={structureId}
                equipmentTotal={computedEquipmentTotal}
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
            />

            {/* Save Survey Button fixed at bottom-right */}
            <div
                style={{
                    position: "fixed",
                    bottom: "1rem",
                    right: "1rem",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={handleSaveSurvey}
                    style={{
                        padding: "0.75rem 1.5rem",
                        fontSize: "1rem",
                        backgroundColor: "#3B3B3B",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    Save Survey
                </button>
            </div>

            <div style={{ marginTop: "1rem" }}>
                <ExportPDF
                    targetRef={contentRef}
                    fileName="survey.pdf"
                    buttonText="Save as PDF"
                />
            </div>
        </div>
    );
}
