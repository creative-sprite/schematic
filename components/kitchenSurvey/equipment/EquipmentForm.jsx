// components\kitchenSurvey\equipment\EquipmentForm.jsx
"use client";
import React, { useRef, useMemo } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataView } from "primereact/dataview";
import "primeicons/primeicons.css";

export default function EquipmentForm(props) {
    const {
        surveyForm,
        uniqueSubcategories,
        sortedFilteredItems,
        specialItems,
        isWalkIn,
        isVolumeItem,
        handleSurveyChange,
        handleNumberFocus,
        handleNumberBlur,
        handleAddSurvey,
        subcategoryOrder,
        surveyList = [],
    } = props;

    // Use React.useState with a factory function that runs once for initial value
    // This eliminates unnecessary renders caused by frequent initializations
    const [gradeSelections, setGradeSelections] = React.useState(() => ({}));
    const [dimensionInputs, setDimensionInputs] = React.useState(() => ({}));

    // Prevent additional renders by using refs to track state
    const updatingTabRef = useRef(false);

    // Create the ordered subcategories using useMemo to prevent recreating on each render
    const orderedSubcategories = useMemo(() => {
        const customOrder = Array.isArray(subcategoryOrder)
            ? subcategoryOrder
            : [];
        const trimmedUniqueSubs = uniqueSubcategories.map((s) => s.trim());
        const remaining = trimmedUniqueSubs.filter(
            (sub) => !customOrder.includes(sub)
        );
        return [...customOrder, ...remaining];
    }, [uniqueSubcategories, subcategoryOrder]);

    // Calculate the active tab index based on surveyForm.subcategory
    // We don't store this in state to avoid circular updates
    const activeTabIndex = useMemo(() => {
        const index = orderedSubcategories.indexOf(surveyForm.subcategory);
        return index >= 0 ? index : 0;
    }, [surveyForm.subcategory, orderedSubcategories]);

    // Initialize grade selections for items - only run when items change
    React.useEffect(() => {
        setGradeSelections((prev) => {
            const newState = { ...prev };

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

    // CRITICAL FIX: Simple tab change handler without state updates
    const handleTabChange = (e) => {
        if (updatingTabRef.current) return;

        const newIndex = e.index;
        if (newIndex === activeTabIndex) return;

        const selectedSubcategory = orderedSubcategories[newIndex];
        if (!selectedSubcategory) return;

        updatingTabRef.current = true;

        // Notify parent directly without updating local state
        handleSurveyChange({
            target: { name: "subcategory", value: selectedSubcategory },
        });

        // Reset flag after a short delay
        setTimeout(() => {
            updatingTabRef.current = false;
        }, 0);
    };

    // Reorder items: normal items first, then dimension items
    const reorderedItems = useMemo(() => {
        const normalItems = sortedFilteredItems.filter(
            (item) => !(isVolumeItem(item.item) || specialItems.has(item.item))
        );

        const dimensionItems = sortedFilteredItems.filter(
            (item) => isVolumeItem(item.item) || specialItems.has(item.item)
        );

        return [...normalItems, ...dimensionItems];
    }, [sortedFilteredItems, isVolumeItem, specialItems]);

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

        // Get available grades and current grade
        const availableGrades = item.prices ? Object.keys(item.prices) : ["B"];
        const currentGrade =
            gradeSelections[item.item] ||
            (availableGrades.includes("B") ? "B" : availableGrades[0]);

        // Get dimensions
        const dims = dimensionInputs[item.item] || {
            length: "",
            width: "",
            height: "",
        };

        // Calculate quantity based on dimensions
        let computedQuantity = 0;
        if (isDimension) {
            const length = parseFloat(dims.length) || 0;
            const width = parseFloat(dims.width) || 0;
            const height = parseFloat(dims.height) || 0;
            computedQuantity = effectiveIsVolume
                ? length * width * height
                : length * width;
        }

        // Handle dimension change
        const handleDimensionChange = (e, field) => {
            const { value } = e.target;
            setDimensionInputs((prev) => ({
                ...prev,
                [item.item]: { ...dims, [field]: value },
            }));
        };

        // Handle grade cycling
        const cycleGrade = () => {
            const currentIndex = availableGrades.indexOf(currentGrade);
            const nextIndex = (currentIndex + 1) % availableGrades.length;
            setGradeSelections((prev) => ({
                ...prev,
                [item.item]: availableGrades[nextIndex],
            }));
        };

        // Handle add button click
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

            // Create new entry
            const newEntry = {
                id: Date.now() + Math.random(),
                item: item.item,
                grade: currentGrade,
                subcategory: surveyForm.subcategory,
            };

            // Add dimensions if needed
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

            // Add item to survey list
            handleAddSurvey(newEntry);

            // Clear dimension inputs after adding item
            if (isDimension) {
                setDimensionInputs((prev) => ({
                    ...prev,
                    [item.item]: { length: "", width: "", height: "" },
                }));
            }
        };

        // Calculate item count
        const itemCount = (surveyList || []).reduce((acc, entry) => {
            if (
                entry.item === item.item &&
                entry.grade === currentGrade &&
                entry.subcategory.trim() === item.subcategory.trim()
            ) {
                return acc + (entry.number || 1);
            }
            return acc;
        }, 0);

        // Render item template
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
                        backgroundColor: itemCount > 0 ? "#f1f1f1" : "#fff",
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
                            <h4 style={{ margin: "0 0 0.2rem 0" }}>
                                {item.item}
                            </h4>
                            {itemCount > 0 && (
                                <h4
                                    style={{
                                        margin: "0 0 0.2rem 0",
                                        backgroundColor: "#F9C400",
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
