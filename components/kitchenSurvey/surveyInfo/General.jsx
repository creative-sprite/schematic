// components\kitchenSurvey\surveyInfo\General.jsx

"use client";
import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";

// surveyTypeOptions array holds the available survey type options for the dropdown.
const surveyTypeOptions = [
    { label: "Survey type", value: "Survey type" },
    { label: "Grease Extract Deep Clean", value: "Grease Extract Deep Clean" },
    { label: "Kitchen Deep Clean", value: "Kitchen Deep Clean" },
    { label: "High Level Deep Clean", value: "High Level Deep Clean" },
    {
        label: "Air Supply & Extract Deep Clean",
        value: "Air Supply & Extract Deep Clean",
    },
    { label: "Air Supply Deep Clean", value: "Air Supply Deep Clean" },
    { label: "Air Extract Deep Clean", value: "Air Extract Deep Clean" },
    {
        label: "Laundry Extract Deep Clean",
        value: "Laundry Extract Deep Clean",
    },
    { label: "Toilet Extract Deep Clean", value: "Toilet Extract Deep Clean" },
    { label: "Builders Clean", value: "Builders Clean" },
    { label: "Sparkle Clean", value: "Sparkle Clean" },
    { label: "Specialist Deep Clean", value: "Specialist Deep Clean" },
    { label: "Sanitisation Clean", value: "Sanitisation Clean" },
    {
        label: "Unique Circumstance Clean",
        value: "Unique Circumstance Clean",
    },
    { label: "Other", value: "Other" },
];

// Function to generate a unique alphanumeric ID
// with the letter randomly placed within the numeric string
const generateUniqueId = () => {
    // Generate 6 random digits as individual characters
    const numericParts = [];
    for (let i = 0; i < 6; i++) {
        numericParts.push(Math.floor(Math.random() * 10).toString());
    }

    // Generate 1 random letter (uppercase)
    const alphabetChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const alphabeticPart = alphabetChars.charAt(
        Math.floor(Math.random() * alphabetChars.length)
    );

    // Randomly decide where to insert the letter (positions 0-6)
    const insertPosition = Math.floor(Math.random() * 7);

    // Insert the letter at the chosen position
    numericParts.splice(insertPosition, 0, alphabeticPart);

    // Join all characters to form the ID
    return numericParts.join("");
};

// Helper function to generate the next alphabetic sequence
// Examples: A -> B -> C -> ... -> Z -> AA -> AB -> ... -> ZZ -> AAA -> etc.
const generateNextAlphabeticSequence = (current) => {
    if (!current) return "A"; // Start with A if nothing provided

    // Convert to uppercase to ensure consistency
    current = current.toUpperCase();

    // Convert to array of characters
    const chars = current.split("");

    // Start from the rightmost character and increment
    let index = chars.length - 1;
    let carry = true;

    while (carry && index >= 0) {
        // If current char is Z, reset to A and carry over
        if (chars[index] === "Z") {
            chars[index] = "A";
            carry = true;
        } else {
            // Otherwise, increment the character
            chars[index] = String.fromCharCode(chars[index].charCodeAt(0) + 1);
            carry = false;
        }
        index--;
    }

    // If we still have a carry, we need to add another "A" at the beginning
    if (carry) {
        chars.unshift("A");
    }

    return chars.join("");
};

export default function GeneralInformation({
    refValue,
    setRefValue,
    surveyDate,
    setSurveyDate,
    surveyType,
    setSurveyType,
    parking,
    setParking,
    isEditingMode = false, // Add isEditingMode prop with default value
}) {
    // Add refs for tracking updates and preventing infinite loops
    const isInitialRender = useRef(true);
    const isInternalUpdate = useRef(false);
    const prevValues = useRef({
        refValue: refValue || "",
        surveyDate: surveyDate || null,
        surveyType: surveyType || "",
        parking: parking || "",
    });

    // State for individual REF components
    const [refPart1, setRefPart1] = useState("");
    const [refPart2, setRefPart2] = useState("");
    const [uniqueId, setUniqueId] = useState("");
    const [refPart4, setRefPart4] = useState("");
    const [isGeneratingId, setIsGeneratingId] = useState(false);
    const [isLoadingLastRef, setIsLoadingLastRef] = useState(false);

    // Parse existing refValue if present
    useEffect(() => {
        if (refValue) {
            const parts = refValue.split("/");
            if (parts.length === 4) {
                setRefPart1(parts[0]);
                setRefPart2(parts[1]);
                setUniqueId(parts[2]);
                setRefPart4(parts[3]);
            }
        }
    }, [refValue]);

    // Generate a unique ID when the component mounts (only if this is a new survey)
    useEffect(() => {
        const generateAndVerifyId = async () => {
            // Skip ID generation if we're in editing mode OR if an ID is already set
            if (isEditingMode) {
                console.log("Skip ID generation - editing mode");
                return;
            }

            if (uniqueId) {
                console.log("Skip ID generation - ID already set:", uniqueId);
                return;
            }

            if (isGeneratingId) {
                return;
            }

            console.log("Generating unique ID for new survey");
            setIsGeneratingId(true);
            let isUnique = false;
            let generatedId = "";
            let attempts = 0;
            const maxAttempts = 10; // Prevent infinite loops

            while (!isUnique && attempts < maxAttempts) {
                generatedId = generateUniqueId();
                try {
                    const response = await fetch(
                        `/api/surveys/kitchenSurveys?checkUniqueId=${generatedId}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        isUnique = data.isUnique;
                        if (isUnique) {
                            console.log("Generated unique ID:", generatedId);
                            setUniqueId(generatedId);
                            break;
                        }
                    } else {
                        // If API call fails, still use the generated ID but log the error
                        console.error(
                            "Error checking unique ID:",
                            await response.text()
                        );
                        setUniqueId(generatedId);
                        break;
                    }
                } catch (error) {
                    console.error("Error checking unique ID:", error);
                    setUniqueId(generatedId);
                    break;
                }
                attempts++;
            }

            if (attempts >= maxAttempts) {
                // If we couldn't generate a unique ID after several attempts, use the last one
                setUniqueId(generatedId);
                console.warn(
                    "Could not generate a confirmed unique ID after multiple attempts"
                );
            }
            setIsGeneratingId(false);
        };

        generateAndVerifyId();
    }, [uniqueId, isGeneratingId, isEditingMode]); // Add isEditingMode to dependencies

    // Initialize version letter for new surveys
    useEffect(() => {
        // Skip if editing or if refPart4 is already set
        if (isEditingMode) {
            console.log("Skip version letter initialization - editing mode");
            return;
        }

        if (refPart4) {
            console.log(
                "Skip version letter initialization - already set:",
                refPart4
            );
            return;
        }

        // For new surveys, always set the initial version to "A"
        console.log("Setting initial version letter to A for new survey");
        setRefPart4("A");
    }, [isEditingMode, refPart4]);

    // FIXED: Initialize current date only once on mount
    useEffect(() => {
        if (isInitialRender.current && !surveyDate) {
            console.log("Initializing survey date with current date");
            setSurveyDate(new Date());
        }
        // Mark first render complete after this effect runs
        isInitialRender.current = false;
    }, []); // Empty dependency array means this runs only once on mount

    // Set defaults for parts 1 and 2 for new surveys
    useEffect(() => {
        if (!isEditingMode) {
            if (!refPart1) {
                setRefPart1("AA");
            }

            if (!refPart2) {
                setRefPart2("BB");
            }
        }
    }, [isEditingMode, refPart1, refPart2]);

    // FIXED: Effect to update the combined refValue with proper guards to prevent infinite loops
    useEffect(() => {
        // Skip if we're in the middle of an internal update
        if (isInternalUpdate.current) {
            return;
        }

        // Only proceed if we have all parts necessary to form a valid reference
        if (refPart1 && refPart2 && uniqueId && refPart4) {
            const combinedValue = `${refPart1}/${refPart2}/${uniqueId}/${refPart4}`;

            // Only update if the combined value is different from the current refValue
            if (combinedValue !== prevValues.current.refValue) {
                console.log("Updating refValue:", combinedValue);
                prevValues.current.refValue = combinedValue;

                // Mark that we're initiating an update to prevent loops
                isInternalUpdate.current = true;
                setRefValue(combinedValue);

                // Reset the flag after a short delay
                setTimeout(() => {
                    isInternalUpdate.current = false;
                }, 0);
            }
        }
    }, [refPart1, refPart2, uniqueId, refPart4, setRefValue]);

    // Handle input for part1 (2 alphabetic chars, auto-converted to uppercase)
    const handlePart1Change = (e) => {
        const value = e.target.value.replace(/[^a-zA-Z]/g, "");
        setRefPart1(value.substring(0, 2).toUpperCase());
    };

    // Handle input for part2 (2 alphabetic chars, auto-converted to uppercase)
    const handlePart2Change = (e) => {
        const value = e.target.value.replace(/[^a-zA-Z]/g, "");
        setRefPart2(value.substring(0, 2).toUpperCase());
    };

    // Handle input for part4 (up to 3 alphabetic chars, auto-converted to uppercase)
    const handlePart4Change = (e) => {
        const value = e.target.value.replace(/[^a-zA-Z]/g, "");
        setRefPart4(value.substring(0, 3).toUpperCase());
    };

    // ADDED: Safe update handlers with protection for parent state updates
    const handleSurveyDateChange = (e) => {
        const newDate = e.value;

        // Skip if no actual change
        if (newDate === prevValues.current.surveyDate) return;

        // Update local tracking
        prevValues.current.surveyDate = newDate;

        // Set internal update flag to prevent loops
        isInternalUpdate.current = true;

        // Update parent state
        setSurveyDate(newDate);

        // Reset flag after a short delay
        setTimeout(() => {
            isInternalUpdate.current = false;
        }, 0);
    };

    const handleSurveyTypeChange = (e) => {
        const newType = e.value;

        // Skip if no actual change
        if (newType === prevValues.current.surveyType) return;

        // Update local tracking
        prevValues.current.surveyType = newType;

        // Set internal update flag to prevent loops
        isInternalUpdate.current = true;

        // Update parent state
        setSurveyType(newType);

        // Reset flag after a short delay
        setTimeout(() => {
            isInternalUpdate.current = false;
        }, 0);
    };

    const handleParkingChange = (e) => {
        const newParking = e.target.value;

        // Skip if no actual change
        if (newParking === prevValues.current.parking) return;

        // Update local tracking
        prevValues.current.parking = newParking;

        // Set internal update flag to prevent loops
        isInternalUpdate.current = true;

        // Update parent state
        setParking(newParking);

        // Reset flag after a short delay
        setTimeout(() => {
            isInternalUpdate.current = false;
        }, 0);
    };

    return (
        <div
            style={{
                marginBottom: "3rem",
                border: "3px solid #ddd",
                padding: "1rem",
            }}
        >
            <h2>General</h2>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        alignItems: "center",
                    }}
                >
                    <label>REF:</label>
                    <InputText
                        value={refPart1}
                        onChange={handlePart1Change}
                        placeholder="AA"
                        style={{ width: "60px", height: "40px" }}
                        maxLength={2}
                        readOnly={isEditingMode} // Make read-only when editing
                    />
                    <span>/</span>
                    <InputText
                        value={refPart2}
                        onChange={handlePart2Change}
                        placeholder="BB"
                        style={{ width: "60px", height: "40px" }}
                        maxLength={2}
                        readOnly={isEditingMode} // Make read-only when editing
                    />
                    <span>/</span>
                    <InputText
                        value={uniqueId}
                        readOnly
                        style={{
                            width: "100px",
                            height: "40px",
                            backgroundColor: "#f5f5f5",
                        }}
                        tooltip="Automatically generated unique ID"
                    />
                    <span>/</span>
                    <InputText
                        value={refPart4}
                        onChange={handlePart4Change}
                        placeholder="XYZ"
                        style={{ width: "70px", height: "40px" }}
                        maxLength={3}
                        readOnly={isEditingMode} // Make read-only when editing
                    />
                </div>
            </div>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                }}
            >
                <Calendar
                    value={surveyDate}
                    onChange={handleSurveyDateChange} // UPDATED: Use safer handler
                    dateFormat="dd-mm-yy"
                    placeholder="Date"
                    touchUI
                    showIcon
                    prevIcon={
                        <i
                            className="pi pi-angle-left"
                            style={{ fill: "white" }}
                        />
                    }
                    nextIcon={
                        <i
                            className="pi pi-angle-right"
                            style={{ fill: "white" }}
                        />
                    }
                    icon={
                        <i
                            className="pi pi-calendar"
                            style={{
                                fill: "white",
                            }}
                        />
                    }
                    style={{ width: "150px", height: "40px", gap: "0.5rem" }}
                />
                <Dropdown
                    value={surveyType}
                    options={surveyTypeOptions}
                    onChange={handleSurveyTypeChange} // UPDATED: Use safer handler
                    placeholder="Survey Type"
                    style={{ flex: 1, minWidth: "250px", height: "40px" }}
                />
                <InputTextarea
                    value={parking}
                    placeholder="Parking"
                    onChange={handleParkingChange} // UPDATED: Use safer handler
                    autoResize
                    style={{
                        minWidth: "100%",
                        flex: "1",
                        height: "40px",
                    }}
                />
            </div>
        </div>
    );
}
