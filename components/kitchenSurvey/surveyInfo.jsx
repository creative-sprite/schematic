// components\kitchenSurvey\surveyInfo\surveyInfo.jsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Toast } from "primereact/toast";
import GeneralInformation from "./surveyInfo/General";
import PrimaryContactDetails from "./surveyInfo/PrimaryContactDetails";
import SiteDetails from "./surveyInfo/SiteDetails";
import SiteOperationsAccordion from "./surveyInfo/SiteOperations";
import NotesAccordion from "./surveyInfo/Notes";

export default function SurveyInfo({
    initialSiteDetails,
    initialContacts = [],
    initialPrimaryContactIndex = null,
    initialWalkAroundContactIndex = null,
    initialRefValue = "",
    initialSurveyDate = new Date(),
    initialParking = "", // NEW: Added initialParking prop
    initialOperations = {},
    initialEquipment = {},
    initialNotes = {},
    onRefValueChange,
    onSurveyDateChange,
    onContactsChange,
    onPrimaryContactChange,
    onWalkAroundContactChange,
    onOperationsChange,
    onEquipmentChange,
    onNotesChange,
    onSiteDetailsChange,
    onParkingChange, // NEW: Added onParkingChange prop
    isEditingMode = false, // Add this prop with default value
}) {
    // Reference for Toast notifications
    const toast = useRef(null);
    const isFirstRender = useRef(true);
    const isInitiallyProcessed = useRef(false);

    // Add refs to store previous values for deep comparison
    const prevOperationsRef = useRef({});
    const prevEquipmentRef = useRef({});
    const prevNotesRef = useRef({});
    const prevSiteDetailsRef = useRef({});

    // State for General Information (REF and Survey Date)
    const [refValue, setRefValue] = useState(initialRefValue || "");
    const [surveyDate, setSurveyDate] = useState(
        initialSurveyDate ? new Date(initialSurveyDate) : new Date()
    );
    // NEW: Added dedicated parking state
    const [parking, setParking] = useState(initialParking || "");

    // State for site details with addresses array to match the Site.js schema
    const [siteDetails, setSiteDetails] = useState(
        initialSiteDetails || {
            siteName: "",
            addresses: [
                {
                    addressNameNumber: "",
                    addressLine1: "",
                    addressLine2: "",
                    town: "",
                    county: "",
                    country: "",
                    postCode: "",
                },
            ],
        }
    );

    // State for contact input (object) and contacts (array)
    const [contactInput, setContactInput] = useState({
        contactFirstName: "",
        contactLastName: "",
        position: "",
        number: "",
        email: "",
    });
    const [contacts, setContacts] = useState(initialContacts || []);

    // State for Primary Contact Details
    const [contactDetails, setContactDetails] = useState({});
    const [selectedPrimaryContactIndex, setSelectedPrimaryContactIndex] =
        useState(initialPrimaryContactIndex);

    // State for Walk Around Contact
    const [selectedWalkAroundContactIndex, setSelectedWalkAroundContactIndex] =
        useState(initialWalkAroundContactIndex);

    // Operations state - Using a simplified, more consistent initialization pattern
    const [operations, setOperations] = useState(() => {
        // Create default structure
        const defaultOps = {
            patronDisruption: "No",
            patronDisruptionDetails: "",
            operationalHours: {
                weekdays: { start: "", end: "" },
                weekend: { start: "", end: "" },
            },
            typeOfCooking: "",
            coversPerDay: "",
            bestServiceTime: "",
            bestServiceDay: "",
            eightHoursAvailable: "No",
            eightHoursAvailableDetails: "",
            serviceDue: null,
            approxServiceDue: false,
        };

        // If initialOperations exists, merge with defaults
        if (initialOperations && Object.keys(initialOperations).length > 0) {
            console.log(
                "SurveyInfo: Operations initialization with:",
                initialOperations
            );

            // Create a copy to avoid direct mutation
            const normalizedOps = { ...defaultOps };

            // Merge initial values, handling nesting properly
            if (initialOperations.patronDisruption !== undefined) {
                normalizedOps.patronDisruption =
                    initialOperations.patronDisruption === true ||
                    initialOperations.patronDisruption === "true" ||
                    initialOperations.patronDisruption === "yes" ||
                    initialOperations.patronDisruption === "Yes" ||
                    initialOperations.patronDisruption === 1 ||
                    initialOperations.patronDisruption === "1"
                        ? "Yes"
                        : "No";
            }

            if (initialOperations.eightHoursAvailable !== undefined) {
                normalizedOps.eightHoursAvailable =
                    initialOperations.eightHoursAvailable === true ||
                    initialOperations.eightHoursAvailable === "true" ||
                    initialOperations.eightHoursAvailable === "yes" ||
                    initialOperations.eightHoursAvailable === "Yes" ||
                    initialOperations.eightHoursAvailable === 1 ||
                    initialOperations.eightHoursAvailable === "1"
                        ? "Yes"
                        : "No";
            }

            // Copy non-toggle string values
            if (initialOperations.patronDisruptionDetails) {
                normalizedOps.patronDisruptionDetails =
                    initialOperations.patronDisruptionDetails;
            }

            if (initialOperations.eightHoursAvailableDetails) {
                normalizedOps.eightHoursAvailableDetails =
                    initialOperations.eightHoursAvailableDetails;
            }

            if (initialOperations.typeOfCooking) {
                normalizedOps.typeOfCooking = initialOperations.typeOfCooking;
            }

            if (initialOperations.coversPerDay) {
                normalizedOps.coversPerDay = initialOperations.coversPerDay;
            }

            if (initialOperations.bestServiceTime) {
                normalizedOps.bestServiceTime =
                    initialOperations.bestServiceTime;
            }

            if (initialOperations.bestServiceDay) {
                normalizedOps.bestServiceDay = initialOperations.bestServiceDay;
            }

            // Handle service due date
            if (initialOperations.serviceDue) {
                try {
                    normalizedOps.serviceDue = new Date(
                        initialOperations.serviceDue
                    );
                } catch (e) {
                    console.error("Error parsing serviceDue date:", e);
                    normalizedOps.serviceDue = null;
                }
            }

            if (initialOperations.approxServiceDue !== undefined) {
                normalizedOps.approxServiceDue =
                    !!initialOperations.approxServiceDue;
            }

            // Handle nested operational hours carefully
            if (initialOperations.operationalHours) {
                normalizedOps.operationalHours = {
                    weekdays: {
                        start:
                            initialOperations.operationalHours?.weekdays
                                ?.start || "",
                        end:
                            initialOperations.operationalHours?.weekdays?.end ||
                            "",
                    },
                    weekend: {
                        start:
                            initialOperations.operationalHours?.weekend
                                ?.start || "",
                        end:
                            initialOperations.operationalHours?.weekend?.end ||
                            "",
                    },
                };
            }

            // Store initial value in ref for comparison
            prevOperationsRef.current = JSON.parse(
                JSON.stringify(normalizedOps)
            );

            return normalizedOps;
        }

        // Store default value in ref for comparison
        prevOperationsRef.current = JSON.parse(JSON.stringify(defaultOps));

        return defaultOps;
    });

    // Specialist Equipment state
    const [equipment, setEquipment] = useState(() => {
        const equipmentData = initialEquipment || {
            acroPropsToggle: "No",
            loftBoardsToggle: "No",
            scaffBoardsToggle: "No",
            laddersToggle: "No",
            mobileScaffoldTower: "No",
            flexiHose: "No",
            flexiHoseCircumference: "",
            flexiHoseLength: "",
            mewp: "No",
        };

        // Store initial value in ref for comparison
        prevEquipmentRef.current = JSON.parse(JSON.stringify(equipmentData));

        return equipmentData;
    });

    // Notes state
    const [notes, setNotes] = useState(() => {
        const notesData = initialNotes || {
            obstructions: [],
            comments: "",
            previousIssues: "",
            damage: "",
            inaccessibleAreas: "",
            clientActions: "",
            accessLocations: "",
            clientNeedsDocument: "No",
            documentDetails: "",
        };

        // Store initial value in ref for comparison
        prevNotesRef.current = JSON.parse(JSON.stringify(notesData));

        return notesData;
    });

    // Removed redundant useEffect initialization for operations state
    // This prevents the double initialization pattern that could cause infinite loops

    // Initialize equipment and notes state only once from props
    useEffect(() => {
        // Only run this effect once
        if (!isInitiallyProcessed.current) {
            // Initialize equipment
            if (initialEquipment && Object.keys(initialEquipment).length > 0) {
                prevEquipmentRef.current = JSON.parse(
                    JSON.stringify(initialEquipment)
                );
                setEquipment(initialEquipment);
            }

            // Initialize notes
            if (initialNotes && Object.keys(initialNotes).length > 0) {
                prevNotesRef.current = JSON.parse(JSON.stringify(initialNotes));
                setNotes(initialNotes);
            }

            // Store initial site details
            if (initialSiteDetails) {
                prevSiteDetailsRef.current = JSON.parse(
                    JSON.stringify(initialSiteDetails)
                );
            }

            // Mark as processed to prevent repeating
            isInitiallyProcessed.current = true;
        }
    }, []); // Empty dependency array - only run once

    // Relay changes to parent component - but only after first render
    useEffect(() => {
        if (isFirstRender.current) return;
        if (onRefValueChange) {
            onRefValueChange(refValue);
        }
    }, [refValue, onRefValueChange]);

    useEffect(() => {
        if (isFirstRender.current) return;
        if (onSurveyDateChange) {
            onSurveyDateChange(surveyDate);
        }
    }, [surveyDate, onSurveyDateChange]);

    // NEW: Added effect for parking changes
    useEffect(() => {
        if (isFirstRender.current) return;
        if (onParkingChange) {
            onParkingChange(parking);
        }
    }, [parking, onParkingChange]);

    useEffect(() => {
        if (isFirstRender.current) return;
        if (onContactsChange) {
            onContactsChange(contacts);
        }
    }, [contacts, onContactsChange]);

    useEffect(() => {
        if (isFirstRender.current) return;
        if (onPrimaryContactChange) {
            onPrimaryContactChange(selectedPrimaryContactIndex);
        }
    }, [selectedPrimaryContactIndex, onPrimaryContactChange]);

    useEffect(() => {
        if (isFirstRender.current) return;
        if (onWalkAroundContactChange) {
            onWalkAroundContactChange(selectedWalkAroundContactIndex);
        }
    }, [selectedWalkAroundContactIndex, onWalkAroundContactChange]);

    // Add debounce timer refs
    const operationsTimerRef = useRef(null);
    const equipmentTimerRef = useRef(null);
    const notesTimerRef = useRef(null);
    const siteDetailsTimerRef = useRef(null);

    // Memoize operations update handler
    const debouncedOperationsChange = useCallback(
        (ops) => {
            if (!onOperationsChange || !ops || isFirstRender.current) return;

            // Clear any existing timer
            if (operationsTimerRef.current) {
                clearTimeout(operationsTimerRef.current);
            }

            // Setup new timer
            operationsTimerRef.current = setTimeout(() => {
                try {
                    const currentOpsStr = JSON.stringify(ops);
                    const prevOpsStr = JSON.stringify(
                        prevOperationsRef.current
                    );

                    if (currentOpsStr !== prevOpsStr) {
                        console.log(
                            "SurveyInfo: Sending operations changes to parent:",
                            ops
                        );
                        prevOperationsRef.current = JSON.parse(currentOpsStr);
                        onOperationsChange(ops);
                    }
                } catch (err) {
                    console.error("Error in operations comparison:", err);
                }
            }, 300);
        },
        [onOperationsChange]
    );

    // Update effect with memoized handler
    useEffect(() => {
        if (!isFirstRender.current) {
            debouncedOperationsChange(operations);
        }

        return () => {
            if (operationsTimerRef.current) {
                clearTimeout(operationsTimerRef.current);
            }
        };
    }, [operations, debouncedOperationsChange]);

    // IMPROVED: Modified equipment effect to use deep comparison with debouncing
    useEffect(() => {
        if (isFirstRender.current) return;

        if (onEquipmentChange && equipment) {
            // Clear any existing timer
            if (equipmentTimerRef.current) {
                clearTimeout(equipmentTimerRef.current);
            }

            // Set new timer with delay
            equipmentTimerRef.current = setTimeout(() => {
                try {
                    // Stringify for deep comparison
                    const currentEquipStr = JSON.stringify(equipment);
                    const prevEquipStr = JSON.stringify(
                        prevEquipmentRef.current
                    );

                    // Only update if different
                    if (currentEquipStr !== prevEquipStr) {
                        // Update reference
                        prevEquipmentRef.current = JSON.parse(currentEquipStr);

                        // Notify parent
                        onEquipmentChange(equipment);
                    }
                } catch (err) {
                    console.error("Error in equipment comparison:", err);
                }
            }, 300); // 300ms debounce
        }

        // Clear timeout on unmount
        return () => {
            if (equipmentTimerRef.current) {
                clearTimeout(equipmentTimerRef.current);
            }
        };
    }, [equipment, onEquipmentChange]);

    // IMPROVED: Modified notes effect to use deep comparison with debouncing
    useEffect(() => {
        if (isFirstRender.current) return;

        if (onNotesChange && notes) {
            // Clear any existing timer
            if (notesTimerRef.current) {
                clearTimeout(notesTimerRef.current);
            }

            // Set new timer with delay
            notesTimerRef.current = setTimeout(() => {
                try {
                    // Stringify for deep comparison
                    const currentNotesStr = JSON.stringify(notes);
                    const prevNotesStr = JSON.stringify(prevNotesRef.current);

                    // Only update if different
                    if (currentNotesStr !== prevNotesStr) {
                        // Update reference
                        prevNotesRef.current = JSON.parse(currentNotesStr);

                        // Notify parent
                        onNotesChange(notes);
                    }
                } catch (err) {
                    console.error("Error in notes comparison:", err);
                }
            }, 300); // 300ms debounce
        }

        // Clear timeout on unmount
        return () => {
            if (notesTimerRef.current) {
                clearTimeout(notesTimerRef.current);
            }
        };
    }, [notes, onNotesChange]);

    // IMPROVED: Modified site details effect to use deep comparison with debouncing
    useEffect(() => {
        if (isFirstRender.current) return;

        if (onSiteDetailsChange && siteDetails) {
            // Clear any existing timer
            if (siteDetailsTimerRef.current) {
                clearTimeout(siteDetailsTimerRef.current);
            }

            // Set new timer with delay
            siteDetailsTimerRef.current = setTimeout(() => {
                try {
                    // Stringify for deep comparison
                    const currentSiteStr = JSON.stringify(siteDetails);
                    const prevSiteStr = JSON.stringify(
                        prevSiteDetailsRef.current
                    );

                    // Only update if different
                    if (currentSiteStr !== prevSiteStr) {
                        // Update reference
                        prevSiteDetailsRef.current = JSON.parse(currentSiteStr);

                        // Notify parent
                        onSiteDetailsChange(siteDetails);
                    }
                } catch (err) {
                    console.error("Error in site details comparison:", err);
                }
            }, 300); // 300ms debounce
        }

        // Clear timeout on unmount
        return () => {
            if (siteDetailsTimerRef.current) {
                clearTimeout(siteDetailsTimerRef.current);
            }
        };
    }, [siteDetails, onSiteDetailsChange]);

    // Mark first render as complete
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    // Function to add a contact
    const addContact = async (newContact) => {
        // If site is not selected, show error and return
        if (!siteDetails || !siteDetails._id) {
            toast.current.show({
                severity: "error",
                summary: "Site Required",
                detail: "Please select or create a site before adding contacts",
            });
            return;
        }

        try {
            // If this is a new contact without _id, save it to database first
            if (!newContact._id) {
                // Prepare contact data for API
                const contactToSave = {
                    contactFirstName: newContact.contactFirstName,
                    contactLastName: newContact.contactLastName,
                    contactEmails: newContact.email ? [newContact.email] : [],
                    contactNumbersMobile: newContact.number
                        ? [newContact.number]
                        : [],
                    position: newContact.position || "",
                    site: siteDetails._id,
                };

                // Save to database
                const response = await fetch(
                    "/api/database/clients/contacts/surveyContact",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(contactToSave),
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Failed to save contact");
                }

                // Get saved contact with its _id
                const savedContact = result.data;

                // Update the site with this contact
                await updateSiteWithContact(siteDetails._id, savedContact._id);

                // Update newContact with the database _id
                newContact = {
                    ...newContact,
                    _id: savedContact._id,
                    site: siteDetails._id,
                };
            }

            // Add to local state
            setContacts((prevContacts) => {
                const updatedContacts = [...prevContacts, newContact];
                return updatedContacts;
            });

            // Clear input fields
            setContactInput({
                contactFirstName: "",
                contactLastName: "",
                position: "",
                number: "",
                email: "",
            });
        } catch (error) {
            console.error("Error adding contact:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message,
            });
        }
    };

    // Function to update site with contact
    const updateSiteWithContact = async (siteId, contactId) => {
        try {
            // Get current site data
            const siteResponse = await fetch(
                `/api/database/clients/sites/${siteId}`
            );
            const siteResult = await siteResponse.json();

            if (!siteResponse.ok) {
                throw new Error(siteResult.error || "Failed to fetch site");
            }

            const site = siteResult.data;

            // Add contact to site's contacts array if not already there
            let siteContacts = site.contacts || [];
            if (!siteContacts.includes(contactId)) {
                siteContacts.push(contactId);
            }

            // Update site with new contacts array
            const updateResponse = await fetch(
                `/api/database/clients/sites/${siteId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ contacts: siteContacts }),
                }
            );

            if (!updateResponse.ok) {
                const updateResult = await updateResponse.json();
                throw new Error(updateResult.error || "Failed to update site");
            }
        } catch (error) {
            console.error("Error updating site with contact:", error);
        }
    };

    // Remove contact function
    const removeContact = async (index) => {
        // Create a new array without the removed contact
        const newContacts = [...contacts];
        const removedContact = newContacts.splice(index, 1)[0];

        // Update contacts list
        setContacts(newContacts);

        // If removed contact was the primary contact, reset selection
        if (index === selectedPrimaryContactIndex) {
            setSelectedPrimaryContactIndex(null);
            setContactDetails({});
        }

        // If removed contact was the walk around contact, reset selection
        if (index === selectedWalkAroundContactIndex) {
            setSelectedWalkAroundContactIndex(null);
        }

        // If the contact has an ID and the site has an ID, ensure the relationship is removed
        // but DO NOT delete the contact from the database
        if (
            removedContact &&
            removedContact._id &&
            siteDetails &&
            siteDetails._id
        ) {
            try {
                // Get current site data
                const siteResponse = await fetch(
                    `/api/database/clients/sites/${siteDetails._id}`
                );
                const siteResult = await siteResponse.json();

                if (siteResponse.ok && siteResult.data) {
                    const site = siteResult.data;
                    let siteContacts = site.contacts || [];

                    // Filter out the contact ID from the site's contacts array
                    siteContacts = siteContacts.filter(
                        (id) => id.toString() !== removedContact._id.toString()
                    );

                    // Update site with filtered contacts array
                    await fetch(
                        `/api/database/clients/sites/${siteDetails._id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ contacts: siteContacts }),
                        }
                    );
                }
            } catch (error) {
                console.error("Error removing contact relationship:", error);
            }
        }
    };

    // Load site data from initialSiteDetails if provided
    useEffect(() => {
        if (initialSiteDetails && initialSiteDetails.siteName) {
            setSiteDetails(initialSiteDetails);
        }
    }, [initialSiteDetails]);

    // Load existing contacts for the site when site is selected - SIMPLIFIED VERSION
    useEffect(() => {
        // Skip first render to avoid initial update issues
        if (isFirstRender.current) return;

        if (siteDetails && siteDetails._id && contacts.length === 0) {
            // Define async function separately
            const fetchContacts = async () => {
                try {
                    const response = await fetch(
                        `/api/database/clients/contacts?site=${siteDetails._id}`
                    );
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            const loadedContacts = result.data;

                            // Just update the local contacts state
                            setContacts(loadedContacts);

                            // Find primary contact by flag
                            const primaryIndex = loadedContacts.findIndex(
                                (c) => c.isPrimaryContact
                            );

                            if (primaryIndex >= 0) {
                                setSelectedPrimaryContactIndex(primaryIndex);
                                setContactDetails(loadedContacts[primaryIndex]);
                            } else if (
                                initialPrimaryContactIndex !== null &&
                                initialPrimaryContactIndex >= 0 &&
                                loadedContacts[initialPrimaryContactIndex]
                            ) {
                                setSelectedPrimaryContactIndex(
                                    initialPrimaryContactIndex
                                );
                                setContactDetails(
                                    loadedContacts[initialPrimaryContactIndex]
                                );
                            }

                            // Find walk around contact by flag
                            const walkAroundIndex = loadedContacts.findIndex(
                                (c) => c.isWalkAroundContact
                            );

                            if (walkAroundIndex >= 0) {
                                setSelectedWalkAroundContactIndex(
                                    walkAroundIndex
                                );
                            } else if (
                                initialWalkAroundContactIndex !== null &&
                                initialWalkAroundContactIndex >= 0 &&
                                loadedContacts[initialWalkAroundContactIndex]
                            ) {
                                setSelectedWalkAroundContactIndex(
                                    initialWalkAroundContactIndex
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error loading site contacts:", error);
                }
            };

            fetchContacts();
        } else if (!siteDetails || !siteDetails._id) {
            // Reset contacts when no site is selected
            if (initialContacts.length === 0) {
                setContacts([]);
                setSelectedPrimaryContactIndex(null);
                setSelectedWalkAroundContactIndex(null);
                setContactDetails({});
            }
        }
    }, [
        siteDetails,
        initialContacts.length,
        initialPrimaryContactIndex,
        initialWalkAroundContactIndex,
    ]);

    // Accordion state for collapsible sections
    const [accordion, setAccordion] = useState({
        general: false,
        operations: false,
        equipment: false,
        notes: false,
    });

    const toggleAccordion = (section) => {
        setAccordion((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    return (
        <div className="survey-general">
            <Toast ref={toast} />

            <GeneralInformation
                refValue={refValue}
                setRefValue={setRefValue}
                surveyDate={surveyDate}
                setSurveyDate={setSurveyDate}
                surveyType={operations.typeOfCooking || "Kitchen Deep Clean"}
                setSurveyType={(newType) =>
                    setOperations((prev) => ({
                        ...prev,
                        typeOfCooking: newType,
                    }))
                }
                parking={parking} // CHANGED: Use dedicated parking state
                setParking={setParking} // CHANGED: Use dedicated parking setter
                isEditingMode={isEditingMode} // Pass the isEditingMode prop
            />

            <SiteDetails
                siteDetails={siteDetails}
                setSiteDetails={setSiteDetails}
            />

            <PrimaryContactDetails
                contacts={contacts}
                contactDetails={contactDetails}
                setContactDetails={setContactDetails}
                selectedPrimaryContactIndex={selectedPrimaryContactIndex}
                setSelectedPrimaryContactIndex={setSelectedPrimaryContactIndex}
                selectedWalkAroundContactIndex={selectedWalkAroundContactIndex}
                setSelectedWalkAroundContactIndex={
                    setSelectedWalkAroundContactIndex
                }
                contactInput={contactInput}
                setContactInput={setContactInput}
                addContact={addContact}
                removeContact={removeContact}
                siteDetails={siteDetails}
            />

            <div style={{ marginBottom: "3rem" }} />

            <SiteOperationsAccordion
                operations={operations}
                setOperations={setOperations}
                isOpen={accordion.operations}
                toggleAccordion={() => toggleAccordion("operations")}
            />

            <div style={{ marginBottom: "3rem" }} />

            <NotesAccordion
                notes={notes}
                setNotes={setNotes}
                isOpen={accordion.notes}
                toggleAccordion={() => toggleAccordion("notes")}
            />
            <div style={{ marginBottom: "3rem" }} />
        </div>
    );
}
