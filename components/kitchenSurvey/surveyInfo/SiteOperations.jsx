// components\kitchenSurvey\surveyInfo\SiteOperations.jsx

"use client";
import React, { useEffect, useRef, useCallback } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { DataView } from "primereact/dataview";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { ToggleButton } from "primereact/togglebutton";

export default function SiteOperationsAccordion({
    operations,
    setOperations,
    isOpen,
    toggleAccordion,
}) {
    // Use ref to track if operations data has been initially processed
    const initialProcessRef = useRef(false);

    // Log operations ONLY on mount for debugging
    useEffect(() => {
        if (!initialProcessRef.current) {
            console.log(
                "SiteOperations first render with operations:",
                operations
            );
            initialProcessRef.current = true;
        }
    }, []); // Empty dependency array - runs only once on mount

    // Use memoized update function to avoid creating new functions on every render
    const updateOperations = useCallback(
        (updates) => {
            console.log("SiteOperations updating with:", updates);
            setOperations((prevOps) => ({
                ...prevOps,
                ...updates,
            }));
        },
        [setOperations]
    );

    // Fields array in the desired left-to-right order:
    const fields = [
        // Field for Patron Disruption (toggle with input)
        {
            id: 1, // Unique identifier for the field
            type: "toggleWithInput",
            label: "Patron Disruption",
            toggleField: "patronDisruption",
            inputField: "patronDisruptionDetails",
            inputPlaceholder: "Enter disruption details",
        },
        // Field for 8 Hours Available (toggle with input)
        {
            id: 2,
            type: "toggleWithInput",
            label: "8 Hours Available",
            toggleField: "eightHoursAvailable",
            inputField: "eightHoursAvailableDetails",
            inputPlaceholder: "Enter details for 8 Hours Available",
        },
        // Field for Best Service Time & Day (two dropdowns)
        {
            id: 3,
            type: "bestService",
            label: "Best Service Time & Day",
        },
        // Field for Service Due & Approx.? (Calendar as month picker)
        {
            id: 4,
            type: "serviceDue",
            label: "Service Due & Approx.?",
        },
        // Field for Operational Hours (two-column layout for weekdays and weekend)
        {
            id: 5,
            type: "operationalHours",
            label: "Operational Hours",
        },
    ];

    // Unified card style for all fields.
    const cardStyle = {
        border: "1px solid #ccc",
        padding: "20px",
        margin: "0.25rem",
        boxSizing: "border-box",
        flex: "1 1 300px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
    };

    // Ensure valid operations object with default values if needed
    const safeOperations = operations || {
        patronDisruption: "No",
        patronDisruptionDetails: "",
        eightHoursAvailable: "No",
        eightHoursAvailableDetails: "",
        operationalHours: {
            weekdays: { start: "", end: "" },
            weekend: { start: "", end: "" },
        },
        typeOfCooking: "",
        coversPerDay: "",
        bestServiceTime: "",
        bestServiceDay: "Weekdays",
        serviceDue: null,
        approxServiceDue: false,
    };

    // Helper function to check if toggle is "Yes"
    const isToggleYes = (fieldName) => {
        const value = safeOperations[fieldName];
        // Strict check against "Yes" string
        return value === "Yes";
    };

    // Toggle with input - USES PROPS DIRECTLY
    const renderToggleWithInput = (item) => {
        console.log(
            `Rendering ${item.label} with value:`,
            safeOperations[item.toggleField]
        );

        return (
            <div key={item.id} style={cardStyle}>
                <label
                    style={{
                        marginBottom: "10px",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    {item.label}
                </label>
                <ToggleButton
                    checked={isToggleYes(item.toggleField)}
                    onChange={(e) => {
                        updateOperations({
                            [item.toggleField]: e.value ? "Yes" : "No",
                        });
                    }}
                    onLabel="Yes"
                    offLabel="No"
                    style={{ width: "100%", height: "40px" }}
                />
                {isToggleYes(item.toggleField) && (
                    <div style={{ marginTop: "10px" }}>
                        <InputTextarea
                            value={safeOperations[item.inputField] || ""}
                            onChange={(e) => {
                                updateOperations({
                                    [item.inputField]: e.target.value,
                                });
                            }}
                            placeholder={item.inputPlaceholder}
                            autoResize
                            rows={1}
                            style={{
                                width: "100%",
                                overflow: "hidden",
                                minHeight: "40px",
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    // Best service - USES PROPS DIRECTLY
    const renderBestService = (item) => {
        return (
            <div key={item.id} style={cardStyle}>
                <label
                    style={{
                        marginBottom: "10px",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    {item.label}
                </label>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "0.5rem",
                    }}
                >
                    <Dropdown
                        value={safeOperations.bestServiceTime}
                        options={[
                            { label: "Morning", value: "Morning" },
                            { label: "Afternoon", value: "Afternoon" },
                            { label: "Evening", value: "Evening" },
                            { label: "Night", value: "Night" },
                        ]}
                        onChange={(e) => {
                            updateOperations({
                                bestServiceTime: e.value,
                            });
                        }}
                        placeholder="Time"
                        style={{ height: "40px", width: "auto" }}
                    />
                    <Dropdown
                        value={safeOperations.bestServiceDay}
                        options={[
                            { label: "Mon - Fri", value: "Weekdays" },
                            { label: "Weekend", value: "Weekend" },
                        ]}
                        onChange={(e) => {
                            updateOperations({
                                bestServiceDay: e.value,
                            });
                        }}
                        placeholder="Day"
                        style={{ height: "40px", width: "auto" }}
                    />
                </div>
            </div>
        );
    };

    // Service due - USES PROPS DIRECTLY
    const renderServiceDue = (item) => {
        return (
            <div key={item.id} style={cardStyle}>
                <label
                    style={{
                        marginBottom: "10px",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    {item.label}
                </label>
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <Calendar
                        value={safeOperations.serviceDue}
                        onChange={(e) => {
                            updateOperations({
                                serviceDue: e.value,
                            });
                        }}
                        view="month"
                        dateFormat="mm/yy"
                        placeholder="Date"
                        style={{
                            height: "40px",
                            width: "140px",
                            gap: "0.5rem",
                        }}
                        touchUI
                        showIcon
                    />
                </div>
            </div>
        );
    };

    // Helper function to get a Date object for a time string
    const getTimeDate = (timeStr) => {
        if (!timeStr) return null;

        try {
            // Handle ISO string format
            if (typeof timeStr === "string" && timeStr.includes("T")) {
                const date = new Date(timeStr);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }

            // Handle HH:MM format
            const [hours, minutes] = timeStr.split(":").map(Number);
            if (isNaN(hours) || isNaN(minutes)) return null;

            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        } catch (e) {
            console.error("Error parsing time:", e, timeStr);
            return null;
        }
    };

    // Helper function to get time string from Date object
    const getTimeString = (date) => {
        if (!date) return "";
        return `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    };

    // Get operational hours safely
    const getOperationalHours = () => {
        const opHours = safeOperations.operationalHours || {
            weekdays: { start: "", end: "" },
            weekend: { start: "", end: "" },
        };

        // Ensure weekdays and weekend exist
        const weekdays = opHours.weekdays || { start: "", end: "" };
        const weekend = opHours.weekend || { start: "", end: "" };

        return { opHours, weekdays, weekend };
    };

    // Operational hours - USES PROPS DIRECTLY
    const renderOperationalHours = (item) => {
        const { opHours, weekdays, weekend } = getOperationalHours();

        return (
            <div key={item.id} style={{ ...cardStyle, height: "auto" }}>
                <label
                    style={{
                        marginBottom: "10px",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    {item.label}
                </label>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "20px",
                        flexWrap: "wrap",
                    }}
                >
                    {/* Weekdays group */}
                    <div style={{ textAlign: "center" }}>
                        <span
                            style={{
                                fontWeight: "bold",
                                display: "block",
                                marginBottom: "10px",
                            }}
                        >
                            Weekdays
                        </span>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            <Calendar
                                value={getTimeDate(weekdays.start)}
                                onChange={(e) => {
                                    const newHours = { ...opHours };
                                    if (!newHours.weekdays) {
                                        newHours.weekdays = {
                                            start: "",
                                            end: "",
                                        };
                                    }
                                    newHours.weekdays.start = e.value
                                        ? getTimeString(e.value)
                                        : "";

                                    updateOperations({
                                        operationalHours: newHours,
                                    });
                                }}
                                timeOnly
                                hourFormat="24"
                                placeholder="Start Time"
                                style={{ height: "40px", width: "120px" }}
                            />
                            <Calendar
                                value={getTimeDate(weekdays.end)}
                                onChange={(e) => {
                                    const newHours = { ...opHours };
                                    if (!newHours.weekdays) {
                                        newHours.weekdays = {
                                            start: "",
                                            end: "",
                                        };
                                    }
                                    newHours.weekdays.end = e.value
                                        ? getTimeString(e.value)
                                        : "";

                                    updateOperations({
                                        operationalHours: newHours,
                                    });
                                }}
                                timeOnly
                                hourFormat="24"
                                placeholder="End Time"
                                style={{ height: "40px", width: "120px" }}
                            />
                        </div>
                    </div>
                    {/* Weekend group */}
                    <div style={{ textAlign: "center" }}>
                        <span
                            style={{
                                fontWeight: "bold",
                                display: "block",
                                marginBottom: "10px",
                            }}
                        >
                            Weekend
                        </span>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                            }}
                        >
                            <Calendar
                                value={getTimeDate(weekend.start)}
                                onChange={(e) => {
                                    const newHours = { ...opHours };
                                    if (!newHours.weekend) {
                                        newHours.weekend = {
                                            start: "",
                                            end: "",
                                        };
                                    }
                                    newHours.weekend.start = e.value
                                        ? getTimeString(e.value)
                                        : "";

                                    updateOperations({
                                        operationalHours: newHours,
                                    });
                                }}
                                timeOnly
                                hourFormat="24"
                                placeholder="Start Time"
                                style={{ height: "40px", width: "120px" }}
                            />
                            <Calendar
                                value={getTimeDate(weekend.end)}
                                onChange={(e) => {
                                    const newHours = { ...opHours };
                                    if (!newHours.weekend) {
                                        newHours.weekend = {
                                            start: "",
                                            end: "",
                                        };
                                    }
                                    newHours.weekend.end = e.value
                                        ? getTimeString(e.value)
                                        : "";

                                    updateOperations({
                                        operationalHours: newHours,
                                    });
                                }}
                                timeOnly
                                hourFormat="24"
                                placeholder="End Time"
                                style={{ height: "40px", width: "120px" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render function for each card.
    const renderField = (item) => {
        switch (item.type) {
            case "toggleWithInput":
                return renderToggleWithInput(item);
            case "bestService":
                return renderBestService(item);
            case "serviceDue":
                return renderServiceDue(item);
            case "operationalHours":
                return renderOperationalHours(item);
            default:
                return null;
        }
    };

    return (
        <Accordion
            multiple
            activeIndex={isOpen ? [0] : null}
            onTabChange={() => toggleAccordion && toggleAccordion("operations")}
        >
            <AccordionTab header="Site Operations">
                <DataView
                    value={fields}
                    layout="grid"
                    itemTemplate={renderField}
                />
            </AccordionTab>
        </Accordion>
    );
}