// components\kitchenSurvey\equipment\EquipmentForm.jsx
"use client"; // Added because this component uses React hooks
import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview"; // Import TabView components for subcategory tabs
// Removed the Dropdown import since item selection is now handled via DataView grid layout
import { InputText } from "primereact/inputtext"; // InputText component for numeric inputs
import { Button } from "primereact/button"; // Button component
import { DataView } from "primereact/dataview"; // DataView component for grid layout display
import "primeicons/primeicons.css";

export default function EquipmentForm(props) {
    const {
        surveyForm,
        uniqueSubcategories, // Array of unique subcategories
        sortedFilteredItems,
        gradeOptions,
        specialItems,
        isWalkIn,
        isVolumeItem,
        handleSurveyChange,
        handleNumberFocus,
        handleNumberBlur,
        handleAddSurvey,
        // Single place for custom subcategory order
        subcategoryOrder,
        // We receive the surveyList from Equipment so we can show the count
        surveyList = [],
    } = props;

    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [gradeSelections, setGradeSelections] = useState({});
    const [dimensionInputs, setDimensionInputs] = useState({});

    // Enhanced refs for preventing circular updates
    const updatingTab = useRef(false);
    const prevSubcategoryRef = useRef("");
    const prevTabIndexRef = useRef(0);
    const ignoreNextSubcategoryUpdateRef = useRef(false);
    const ignoreNextTabChangeRef = useRef(false);
    const isInitialRenderRef = useRef(true);

    // --------------------------------------------------------------------------------
    // ==== Determine ordered subcategories based on a custom order ===================
    // --------------------------------------------------------------------------------
    const orderedSubcategories = React.useMemo(() => {
        const customOrder = Array.isArray(subcategoryOrder)
            ? subcategoryOrder
            : [];
        // Trim the subcategory strings in uniqueSubcategories to avoid mismatch
        const trimmedUniqueSubs = uniqueSubcategories.map((s) => s.trim());
        // Filter out duplicates to avoid re-adding them
        const remaining = trimmedUniqueSubs.filter(
            (sub) => !customOrder.includes(sub)
        );
        // Concatenate customOrder with the remaining unique subcategories
        return [...customOrder, ...remaining];
    }, [uniqueSubcategories, subcategoryOrder]);

    // Set initial active tab index based on surveyForm.subcategory
    useEffect(() => {
        if (isInitialRenderRef.current && surveyForm.subcategory) {
            const index = orderedSubcategories.indexOf(surveyForm.subcategory);
            if (index !== -1) {
                setActiveTabIndex(index);
                prevTabIndexRef.current = index;
                prevSubcategoryRef.current = surveyForm.subcategory;
            }
            isInitialRenderRef.current = false;
        }
    }, [orderedSubcategories, surveyForm.subcategory]);

    // FIXED: Handle parent subcategory changes more robustly
    useEffect(() => {
        // Skip if we're in initial render or explicitly ignoring updates
        if (
            isInitialRenderRef.current ||
            ignoreNextSubcategoryUpdateRef.current
        ) {
            ignoreNextSubcategoryUpdateRef.current = false;
            return;
        }

        // Skip if we're already in an update cycle
        if (updatingTab.current) {
            return;
        }

        // Only update if subcategory has actually changed
        if (
            surveyForm.subcategory &&
            surveyForm.subcategory !== prevSubcategoryRef.current
        ) {
            // Find the matching tab index
            const index = orderedSubcategories.indexOf(surveyForm.subcategory);

            // Only update if the index is valid and different from current
            if (index !== -1 && index !== activeTabIndex) {
                // Mark that we're handling this update
                updatingTab.current = true;

                // Update tracking refs
                prevSubcategoryRef.current = surveyForm.subcategory;
                prevTabIndexRef.current = index;

                // Set flag to ignore next tab change since we're initiating this change
                ignoreNextTabChangeRef.current = true;

                // Update the active tab index directly
                setActiveTabIndex(index);

                // Reset the update flag after a delay
                setTimeout(() => {
                    updatingTab.current = false;
                }, 50);
            }
        }
    }, [surveyForm.subcategory, orderedSubcategories, activeTabIndex]);

    // FIXED: Handle tab changes with simpler, more robust approach
    const handleTabChange = (e) => {
        // Skip if we're told to ignore this change or if already updating
        if (ignoreNextTabChangeRef.current || updatingTab.current) {
            ignoreNextTabChangeRef.current = false;
            return;
        }

        const newIndex = e.index;

        // Skip if the index hasn't actually changed
        if (newIndex === activeTabIndex) {
            return;
        }

        // Get the subcategory for the selected tab
        const selectedSub = orderedSubcategories[newIndex] || "";

        // Skip if the subcategory is the same as current subcategory
        if (selectedSub === surveyForm.subcategory) {
            // Just update the active index without changing subcategory
            setActiveTabIndex(newIndex);
            prevTabIndexRef.current = newIndex;
            return;
        }

        // Mark that we're handling this update
        updatingTab.current = true;

        // Update tracking refs
        prevTabIndexRef.current = newIndex;
        prevSubcategoryRef.current = selectedSub;

        // Update active tab index first for immediate UI feedback
        setActiveTabIndex(newIndex);

        // Tell subsequent subcategory effect to ignore the next update
        ignoreNextSubcategoryUpdateRef.current = true;

        // Call parent's handler to update subcategory
        handleSurveyChange({
            target: { name: "subcategory", value: selectedSub },
        });

        // Reset the update flag after a delay
        setTimeout(() => {
            updatingTab.current = false;
        }, 50);
    };

    // Initialize default grade selection for items based on available grades
    useEffect(() => {
        setGradeSelections((prev) => {
            let newState = { ...prev };
            sortedFilteredItems.forEach((item) => {
                if (!newState[item.item]) {
                    const availableGrades = item.prices
                        ? Object.keys(item.prices)
                        : ["B"];
                    const defaultGrade = availableGrades.includes("B")
                        ? "B"
                        : availableGrades[0];
                    newState[item.item] = defaultGrade;
                }
            });
            return newState;
        });
    }, [sortedFilteredItems]);

    // Reorder items: normal items first (alphabetically), then dimension items.
    const reorderedItems = sortedFilteredItems
        .filter(
            (item) => !(isVolumeItem(item.item) || specialItems.has(item.item))
        )
        .concat(
            sortedFilteredItems.filter(
                (item) => isVolumeItem(item.item) || specialItems.has(item.item)
            )
        );

    // Handle item template for DataView
    const itemTemplate = (item) => {
        let effectiveIsVolume = isVolumeItem(item.item);
        let effectiveIsArea = specialItems.has(item.item) && !effectiveIsVolume;
        const isFridgeWalkInExt =
            item.item === "Fridge - Walk-In" &&
            item.subcategory.trim() === "Cold Equipment (ext)";
        if (isFridgeWalkInExt) {
            effectiveIsVolume = false;
            effectiveIsArea = false;
        }
        const isDimension = effectiveIsVolume || effectiveIsArea;

        const availableGrades = item.prices ? Object.keys(item.prices) : ["B"];
        const currentGrade =
            gradeSelections[item.item] ||
            (availableGrades.includes("B") ? "B" : availableGrades[0]);

        const dims = dimensionInputs[item.item] || {
            length: "",
            width: "",
            height: "",
        };

        let computedQuantity = 0;
        if (isDimension) {
            const length = parseFloat(dims.length) || 0;
            const width = parseFloat(dims.width) || 0;
            const height = parseFloat(dims.height) || 0;
            computedQuantity = effectiveIsVolume
                ? length * width * height
                : length * width;
        }

        const handleDimensionChange = (e, field) => {
            const { value } = e.target;
            setDimensionInputs((prev) => ({
                ...prev,
                [item.item]: { ...dims, [field]: value },
            }));
        };

        const cycleGrade = () => {
            const currentIndex = availableGrades.indexOf(currentGrade);
            const nextIndex = (currentIndex + 1) % availableGrades.length;
            setGradeSelections((prev) => ({
                ...prev,
                [item.item]: availableGrades[nextIndex],
            }));
        };

        const onAddClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (
                e.nativeEvent &&
                typeof e.nativeEvent.stopImmediatePropagation === "function"
            ) {
                e.nativeEvent.stopImmediatePropagation();
            }

            // Validate dimensions for dimension-based items
            if (isDimension) {
                if (
                    !dims.length ||
                    !dims.width ||
                    (effectiveIsVolume && !dims.height)
                ) {
                    alert(
                        "Please enter all required dimensions before adding the item"
                    );
                    return;
                }

                if (
                    parseFloat(dims.length) <= 0 ||
                    parseFloat(dims.width) <= 0 ||
                    (effectiveIsVolume && parseFloat(dims.height) <= 0)
                ) {
                    alert("Dimensions must be greater than zero");
                    return;
                }
            }

            const newEntry = {
                id: Date.now() + Math.random(),
                item: item.item,
                grade: currentGrade,
                subcategory: surveyForm.subcategory,
            };
            if (isDimension) {
                newEntry.number = computedQuantity;
                newEntry.length = dims.length;
                newEntry.width = dims.width;
                if (effectiveIsVolume) {
                    newEntry.height = dims.height;
                }
            } else {
                newEntry.number = 1;
            }
            handleAddSurvey(newEntry);

            // Clear dimension inputs after adding item for better UX
            if (isDimension) {
                setDimensionInputs((prev) => ({
                    ...prev,
                    [item.item]: { length: "", width: "", height: "" },
                }));
            }
        };

        // Calculate how many of this item (with matching subcategory & grade) are in the surveyList
        const itemCount = (surveyList || []).reduce((acc, entry) => {
            // Must match item, subcategory, and grade
            if (
                entry.item === item.item &&
                entry.grade === currentGrade &&
                entry.subcategory.trim() === item.subcategory.trim()
            ) {
                return acc + (entry.number || 1);
            }
            return acc;
        }, 0);

        return (
            <div
                style={{
                    width: "calc(33% - 1rem)",
                    margin: "0.5rem",
                    boxSizing: "border-box",
                }}
            >
                <div
                    className="p-card"
                    style={{
                        width: "100%",
                        height: "auto",
                        padding: "1rem",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        backgroundColor: itemCount > 0 ? "#f0f7ff" : "#fff", // Highlight cards that have items
                    }}
                >
                    <div>
                        <div
                            style={{
                                minHeight: "40px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            {/* Item name on the left and count (if any) right aligned */}
                            <h4 style={{ margin: "0 0 0.2rem 0" }}>
                                {item.item}
                            </h4>
                            {itemCount > 0 && (
                                <h4
                                    style={{
                                        margin: "0 0 0.2rem 0",
                                        backgroundColor: "#007ad9",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "24px",
                                        height: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {itemCount}
                                </h4>
                            )}
                        </div>
                        {isDimension && !isFridgeWalkInExt && (
                            <div>
                                <InputText
                                    type="number"
                                    value={dims.length}
                                    onChange={(e) =>
                                        handleDimensionChange(e, "length")
                                    }
                                    placeholder="Enter Length"
                                    required
                                    style={{
                                        width: "100%",
                                        height: "40px",
                                        marginBottom: "0.2rem",
                                    }}
                                />
                                <InputText
                                    type="number"
                                    value={dims.width}
                                    onChange={(e) =>
                                        handleDimensionChange(e, "width")
                                    }
                                    placeholder="Enter Width"
                                    required
                                    style={{
                                        width: "100%",
                                        height: "40px",
                                        marginBottom: "0.2rem",
                                    }}
                                />
                                {effectiveIsVolume && (
                                    <InputText
                                        type="number"
                                        value={dims.height}
                                        onChange={(e) =>
                                            handleDimensionChange(e, "height")
                                        }
                                        placeholder="Enter Height"
                                        required
                                        style={{
                                            width: "100%",
                                            height: "40px",
                                            marginBottom: "0.2rem",
                                        }}
                                    />
                                )}
                                {isDimension && dims.length && dims.width && (
                                    <div
                                        style={{
                                            fontWeight: "bold",
                                            marginTop: "0.5rem",
                                        }}
                                    >
                                        Total: {computedQuantity.toFixed(2)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <span
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "0.5rem",
                        }}
                    >
                        <Button
                            label={currentGrade}
                            onClick={cycleGrade}
                            style={{
                                width: "50px",
                                height: "40px",
                                marginRight: "0.5rem",
                            }}
                        />
                        <Button
                            type="button"
                            className="pi pi-plus"
                            onClick={onAddClick}
                            style={{
                                width: "70px",
                                height: "40px",
                                paddingRight: "12px",
                            }}
                        />
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div>
            <TabView
                activeIndex={activeTabIndex}
                onTabChange={handleTabChange}
                style={{ overflowX: "auto" }}
            >
                {orderedSubcategories.map((sub) => (
                    <TabPanel key={sub} header={sub}>
                        {/* Tab content can be left empty */}
                    </TabPanel>
                ))}
            </TabView>
            <div
                style={{
                    marginTop: "1rem",
                    height: "287px",
                    overflowY: "auto",
                }}
            >
                <DataView
                    value={reorderedItems}
                    itemTemplate={itemTemplate}
                    layout="grid"
                    style={{ margin: "0", width: "100%" }}
                />
            </div>
        </div>
    );
}
