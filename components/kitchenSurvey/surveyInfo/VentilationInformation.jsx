// components/kitchenSurvey/surveyInfo/VentilationInformation.jsx

"use client";
import React, { useState } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { DataView } from "primereact/dataview";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ToggleButton } from "primereact/togglebutton";
import { Chip } from "primereact/chip";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";

export default function VentilationInformationAccordion({
    ventilation,
    setVentilation,
    isOpen,
    toggleAccordion,
}) {
    const [locationInput, setLocationInput] = useState("");

    // Custom CSS for highlighting fields with data and controlling overflow
    const customStyles = `
        .p-multiselect-has-data .p-multiselect {
            border-color: var(--primary-color) !important;
        }
        .p-inputtext-has-data {
            border-color: var(--primary-color) !important;
        }
        .p-togglebutton-has-data {
            border-color: var(--primary-color) !important;
        }
        
        /* Improved text wrapping in textareas */
        .p-inputtextarea {
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            width: 100% !important;
            resize: none !important;
        }
        
        /* Fix dropdown display */
        .p-multiselect {
            width: 100% !important;
            max-width: 100% !important;
        }
        
        .p-multiselect-label {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
        }
        
        /* Fix dropdown items to prevent expanding */
        .p-multiselect-item {
            white-space: normal !important;
            word-break: break-word !important;
        }
        
        /* Control dropdown panel width */
        .p-multiselect-panel .p-multiselect-items {
            max-width: 100% !important;
        }
        
        /* Ensure dropdown items wrap text properly */
        .p-multiselect-panel .p-multiselect-item {
            white-space: normal !important;
            word-break: break-word !important;
            padding: 0.5rem !important;
        }
    `;

    // Helper function to check if toggle is "Yes"
    const isToggleYes = (fieldName) => {
        return ventilation[fieldName] === "Yes";
    };

    // Helper function to check if field has data
    const fieldHasData = (field) => {
        const value = ventilation[field];
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return value.trim() !== "";
        if (Array.isArray(value)) return value.length > 0;
        return true;
    };

    const addLocation = () => {
        if (locationInput.trim()) {
            const updatedLocations = [
                ...(ventilation.accessLocations || []),
                locationInput.trim(),
            ];
            setVentilation({
                ...ventilation,
                accessLocations: updatedLocations,
            });
            setLocationInput("");
        }
    };

    const removeLocation = (index) => {
        const updatedLocations = [...ventilation.accessLocations];
        updatedLocations.splice(index, 1);
        setVentilation({
            ...ventilation,
            accessLocations: updatedLocations,
        });
    };

    const handleToggleChange = (field, value) => {
        setVentilation({
            ...ventilation,
            [field]: value ? "Yes" : "No",
        });
    };

    // Obstructions functions
    const handleObstructionsTextChange = (e) => {
        const manualText = e.target.value;
        setVentilation({
            ...ventilation,
            obstructionsManualText: manualText,
            obstructionsText: manualText,
        });
    };

    // FIXED: Keep selected options when appending text
    const handleMultiSelectChange = (e) => {
        const selected = e.value;
        let appendedText = "";
        if (selected && selected.length > 0) {
            appendedText = "\n\n" + selected.join("\n\n") + "\n\n";
        }
        const newManualText =
            (ventilation.obstructionsManualText || "") + appendedText;
        setVentilation({
            ...ventilation,
            obstructionsManualText: newManualText,
            obstructionsText: newManualText,
            obstructionsOptions: selected, // FIXED: Preserve selected options
        });
    };

    // Damage functions
    const handleDamageTextChange = (e) => {
        const manualText = e.target.value;
        setVentilation({
            ...ventilation,
            damageManualText: manualText,
            damageText: manualText,
        });
    };

    // FIXED: Keep selected options when appending text
    const handleDamageMultiSelectChange = (e) => {
        const selected = e.value;
        let appendedText = "";
        if (selected && selected.length > 0) {
            appendedText = "\n\n" + selected.join("\n\n") + "\n\n";
        }
        const newManualText =
            (ventilation.damageManualText || "") + appendedText;
        setVentilation({
            ...ventilation,
            damageManualText: newManualText,
            damageText: newManualText,
            damageOptions: selected, // FIXED: Preserve selected options
        });
    };

    // Inaccessible Areas functions
    const handleInaccessibleAreasTextChange = (e) => {
        const manualText = e.target.value;
        setVentilation({
            ...ventilation,
            inaccessibleAreasManualText: manualText,
            inaccessibleAreasText: manualText,
        });
    };

    // FIXED: Keep selected options when appending text
    const handleInaccessibleAreasMultiSelectChange = (e) => {
        const selected = e.value;
        let appendedText = "";
        if (selected && selected.length > 0) {
            appendedText = "\n\n" + selected.join("\n\n") + "\n\n";
        }
        const newManualText =
            (ventilation.inaccessibleAreasManualText || "") + appendedText;
        setVentilation({
            ...ventilation,
            inaccessibleAreasManualText: newManualText,
            inaccessibleAreasText: newManualText,
            inaccessibleAreasOptions: selected, // FIXED: Preserve selected options
        });
    };

    // Client Actions functions
    const handleClientActionsTextChange = (e) => {
        const manualText = e.target.value;
        setVentilation({
            ...ventilation,
            clientActionsManualText: manualText,
            clientActionsText: manualText,
        });
    };

    // FIXED: Keep selected options when appending text
    const handleClientActionsMultiSelectChange = (e) => {
        const selected = e.value;
        let appendedText = "";
        if (selected && selected.length > 0) {
            appendedText = "\n\n" + selected.join("\n\n") + "\n\n";
        }
        const newManualText =
            (ventilation.clientActionsManualText || "") + appendedText;
        setVentilation({
            ...ventilation,
            clientActionsManualText: newManualText,
            clientActionsText: newManualText,
            clientActionsOptions: selected, // FIXED: Preserve selected options
        });
    };

    // Unified card style with auto height - USING ORIGINAL LAYOUT
    const cardStyle = {
        border: "1px solid #ccc",
        padding: "20px",
        margin: "0.25rem",
        boxSizing: "border-box",
        flex: "1 1 600px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
        maxWidth: "100%", // Prevent expanding beyond container
    };

    const renderObstructions = () => {
        const obstructionsOptions = [
            {
                label: "Fire suppression system is present this will restrict access to the grease extract",
                value: "Fire suppression system is present this will restrict access to the grease extract",
            },
            {
                label: "Turning vanes obstruct full access to the system",
                value: "Turning vanes obstruct full access to the system",
            },
            {
                label: "The ceiling is fixed, client may wish to consider adding false hatches to determine whether the system can be accessed",
                value: "The ceiling is fixed, client may wish to consider adding false hatches to determine whether the system can be accessed",
            },
            {
                label: "The support structures of the false ceiling obstruct access to sections of the grease extract",
                value: "The support structures of the false ceiling obstruct access to sections of the grease extract",
            },
            {
                label: "There are silencers either side of the fan unit obstructing access",
                value: "There are silencers either side of the fan unit obstructing access",
            },
            {
                label: "Wires and other utilities obstruct access to the system",
                value: "Wires and other utilities obstruct access to the system",
            },
            {
                label: "The pitching of the roof prevents access to the atmosphere point",
                value: "The pitching of the roof prevents access to the atmosphere point",
            },
            {
                label: "The system is encased behind a solid wall and may require further assessment by the client, or a false hatch may be fitted to determine whether further access panels may be fitted",
                value: "The system is encased behind a solid wall and may require further assessment by the client, or a false hatch may be fitted to determine whether further access panels may be fitted",
            },
            {
                label: "The air intake / extract ducting is obstructing access to a section of the grease extract",
                value: "The air intake / extract ducting is obstructing access to a section of the grease extract",
            },
            {
                label: "Insulation is present on sections of the grease extract",
                value: "Insulation is present on sections of the grease extract",
            },
            {
                label: "Light fittings are obstructing access to sections of the grease extract",
                value: "Light fittings are obstructing access to sections of the grease extract",
            },
            {
                label: "The height of the grease prohibits full access",
                value: "The height of the grease prohibits full access",
            },
            {
                label: "The fan unit is inline",
                value: "The fan unit is inline",
            },
            {
                label: "None reported at time of survey",
                value: "None reported at time of survey",
            },
        ];

        return (
            <div key="obstructions" style={cardStyle}>
                <label
                    style={{
                        marginBottom: "0.5rem",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    Obstructions
                </label>
                <ToggleButton
                    checked={ventilation.obstructionsToggle === "Yes"}
                    onChange={(e) =>
                        handleToggleChange("obstructionsToggle", e.value)
                    }
                    onLabel="Yes"
                    offLabel="No"
                    style={{
                        width: "100%",
                        height: "40px",
                        pointerEvents: "auto",
                    }}
                    className={
                        isToggleYes("obstructionsToggle")
                            ? "p-togglebutton-has-data"
                            : ""
                    }
                />
                {ventilation.obstructionsToggle === "Yes" && (
                    <div style={{ marginTop: "0.5rem", width: "100%" }}>
                        <InputTextarea
                            value={ventilation.obstructionsText || ""}
                            onChange={handleObstructionsTextChange}
                            placeholder="Describe the obstructions"
                            autoResize
                            rows={2}
                            className={
                                fieldHasData("obstructionsText")
                                    ? "p-inputtext-has-data"
                                    : ""
                            }
                        />
                        <div style={{ marginTop: "0.5rem", width: "100%" }}>
                            <div
                                className={
                                    fieldHasData("obstructionsOptions")
                                        ? "p-multiselect-has-data"
                                        : ""
                                }
                                style={{ width: "100%" }}
                            >
                                <MultiSelect
                                    value={
                                        ventilation.obstructionsOptions || []
                                    }
                                    options={obstructionsOptions}
                                    onChange={handleMultiSelectChange}
                                    placeholder="Select obstructions"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDamage = () => {
        const damageOptions = [
            {
                label: "The grease filter(s) require replacing",
                value: "The grease filter(s) require replacing",
            },
            {
                label: "The system is dented",
                value: "The system is dented",
            },
            {
                label: "Access panel has been damaged and requires replacing",
                value: "Access panel has been damaged and requires replacing",
            },
            {
                label: "The intumescent sealant/silicone has degraded within the canopy and requires replacing",
                value: "The intumescent sealant/silicone has degraded within the canopy and requires replacing",
            },
            {
                label: "The ventilation is leaking and requires attention",
                value: "The ventilation is leaking and requires attention",
            },
            {
                label: "None reported at time of survey",
                value: "None reported at time of survey",
            },
        ];

        return (
            <div key="damage" style={cardStyle}>
                <label
                    style={{
                        marginBottom: "0.5rem",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    Damage
                </label>
                <ToggleButton
                    checked={ventilation.damageToggle === "Yes"}
                    onChange={(e) =>
                        handleToggleChange("damageToggle", e.value)
                    }
                    onLabel="Yes"
                    offLabel="No"
                    style={{
                        width: "100%",
                        height: "40px",
                        pointerEvents: "auto",
                    }}
                    className={
                        isToggleYes("damageToggle")
                            ? "p-togglebutton-has-data"
                            : ""
                    }
                />
                {ventilation.damageToggle === "Yes" && (
                    <div style={{ marginTop: "0.5rem", width: "100%" }}>
                        <InputTextarea
                            value={ventilation.damageText || ""}
                            onChange={handleDamageTextChange}
                            placeholder="Describe the damage"
                            autoResize
                            rows={2}
                            className={
                                fieldHasData("damageText")
                                    ? "p-inputtext-has-data"
                                    : ""
                            }
                        />
                        <div style={{ marginTop: "0.5rem", width: "100%" }}>
                            <div
                                className={
                                    fieldHasData("damageOptions")
                                        ? "p-multiselect-has-data"
                                        : ""
                                }
                                style={{ width: "100%" }}
                            >
                                <MultiSelect
                                    value={ventilation.damageOptions || []}
                                    options={damageOptions}
                                    onChange={handleDamageMultiSelectChange}
                                    placeholder="Select damage options"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderInaccessibleAreas = () => (
        <div key="inaccessibleAreas" style={cardStyle}>
            <label
                style={{
                    marginBottom: "0.5rem",
                    width: "100%",
                    textAlign: "left",
                }}
            >
                Are there any areas that cannot be accessed?
            </label>
            <ToggleButton
                checked={ventilation.inaccessibleAreasToggle === "Yes"}
                onChange={(e) =>
                    handleToggleChange("inaccessibleAreasToggle", e.value)
                }
                onLabel="Yes"
                offLabel="No"
                style={{ width: "100%", height: "40px", pointerEvents: "auto" }}
                className={
                    isToggleYes("inaccessibleAreasToggle")
                        ? "p-togglebutton-has-data"
                        : ""
                }
            />
            {ventilation.inaccessibleAreasToggle === "Yes" && (
                <div style={{ marginTop: "0.5rem", width: "100%" }}>
                    <InputTextarea
                        value={ventilation.inaccessibleAreasText || ""}
                        onChange={handleInaccessibleAreasTextChange}
                        placeholder="Describe the inaccessible areas"
                        autoResize
                        rows={2}
                        className={
                            fieldHasData("inaccessibleAreasText")
                                ? "p-inputtext-has-data"
                                : ""
                        }
                    />
                    <div style={{ marginTop: "0.5rem", width: "100%" }}>
                        <div
                            className={
                                fieldHasData("inaccessibleAreasOptions")
                                    ? "p-multiselect-has-data"
                                    : ""
                            }
                            style={{ width: "100%" }}
                        >
                            <MultiSelect
                                value={
                                    ventilation.inaccessibleAreasOptions || []
                                }
                                options={[
                                    {
                                        label: "Any areas noted above may represent an area that cannot be accessed. Further information will be available on the report",
                                        value: "Any areas noted above may represent an area that cannot be accessed. Further information will be available on the report",
                                    },
                                    {
                                        label: "None reported at time of survey",
                                        value: "None reported at time of survey",
                                    },
                                ]}
                                onChange={
                                    handleInaccessibleAreasMultiSelectChange
                                }
                                placeholder="Select inaccessible area options"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderClientActions = () => (
        <div key="clientActions" style={cardStyle}>
            <label
                style={{
                    marginBottom: "0.5rem",
                    width: "100%",
                    textAlign: "left",
                }}
            >
                Any actions the client needs to undertake?
            </label>
            <ToggleButton
                checked={ventilation.clientActionsToggle === "Yes"}
                onChange={(e) =>
                    handleToggleChange("clientActionsToggle", e.value)
                }
                onLabel="Yes"
                offLabel="No"
                style={{ width: "100%", height: "40px", pointerEvents: "auto" }}
                className={
                    isToggleYes("clientActionsToggle")
                        ? "p-togglebutton-has-data"
                        : ""
                }
            />
            {ventilation.clientActionsToggle === "Yes" && (
                <div style={{ marginTop: "0.5rem", width: "100%" }}>
                    <InputTextarea
                        value={ventilation.clientActionsText || ""}
                        onChange={handleClientActionsTextChange}
                        placeholder="Describe client actions"
                        autoResize
                        rows={2}
                        className={
                            fieldHasData("clientActionsText")
                                ? "p-inputtext-has-data"
                                : ""
                        }
                    />
                    <div style={{ marginTop: "0.5rem", width: "100%" }}>
                        <div
                            className={
                                fieldHasData("clientActionsOptions")
                                    ? "p-multiselect-has-data"
                                    : ""
                            }
                            style={{ width: "100%" }}
                        >
                            <MultiSelect
                                value={ventilation.clientActionsOptions || []}
                                options={[
                                    {
                                        label: "Remove insulation from the ventilation system to allow access panels to be fitted",
                                        value: "Remove insulation from the ventilation system to allow access panels to be fitted",
                                    },
                                    {
                                        label: "Provide sufficient accessibility to all areas the grease extract is present within the building",
                                        value: "Provide sufficient accessibility to all areas the grease extract is present within the building",
                                    },
                                    {
                                        label: "Consider organising a mechanical and engineer to be present at time of service to dismantle the fan unit",
                                        value: "Consider organising a mechanical and engineer to be present at time of service to dismantle the fan unit",
                                    },
                                    {
                                        label: "Organise chaperone for the team at time of service",
                                        value: "Organise chaperone for the team at time of service",
                                    },
                                    {
                                        label: "Provide boarding within the loft space area to make the environment safe and practicable to use",
                                        value: "Provide boarding within the loft space area to make the environment safe and practicable to use",
                                    },
                                    {
                                        label: "Provide keys to the areas the grease extract runs through",
                                        value: "Provide keys to the areas the grease extract runs through",
                                    },
                                ]}
                                onChange={handleClientActionsMultiSelectChange}
                                placeholder="Select client action options"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderDescription = () => (
        <div key="description" style={cardStyle}>
            <label
                style={{
                    marginBottom: "10px",
                    width: "100%",
                    textAlign: "left",
                }}
            >
                Description
            </label>
            <InputTextarea
                value={ventilation.description || ""}
                onChange={(e) =>
                    setVentilation({
                        ...ventilation,
                        description: e.target.value,
                    })
                }
                placeholder="Enter detailed description"
                autoResize
                rows={3}
                className={
                    fieldHasData("description") ? "p-inputtext-has-data" : ""
                }
            />
        </div>
    );

    const renderAccessLocations = () => (
        <div key="accessLocations" style={cardStyle}>
            <label
                style={{
                    marginBottom: "10px",
                    width: "100%",
                    textAlign: "left",
                }}
            >
                Locations to access system
            </label>
            <div
                style={{ display: "flex", width: "100%", marginBottom: "10px" }}
            >
                <InputText
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter location"
                    style={{
                        height: "40px",
                        width: "100%",
                        marginRight: "5px",
                        borderColor: locationInput.trim()
                            ? "var(--primary-color)"
                            : "",
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addLocation();
                        }
                    }}
                />
                <Button
                    icon="pi pi-plus"
                    onClick={addLocation}
                    style={{ height: "40px" }}
                />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {ventilation.accessLocations &&
                    ventilation.accessLocations.map((location, index) => (
                        <Chip
                            key={index}
                            label={location}
                            removable
                            onRemove={() => removeLocation(index)}
                            style={{ margin: "2px" }}
                        />
                    ))}
            </div>
        </div>
    );

    // Reorder the cards as desired.
    const fieldElements = [
        renderDamage(),
        renderInaccessibleAreas(),
        renderClientActions(),
        renderObstructions(),
        renderAccessLocations(),
        renderDescription(),
    ];

    const renderFields = () => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {fieldElements}
        </div>
    );

    return (
        <>
            <style>{customStyles}</style>
            <Accordion
                multiple
                activeIndex={isOpen ? [0] : null}
                onTabChange={(e) => toggleAccordion("ventilation")}
            >
                <AccordionTab header="Ventilation Information">
                    {renderFields()}
                </AccordionTab>
            </Accordion>
        </>
    );
}
