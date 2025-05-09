// components\kitchenSurvey\Schematic\Specials.jsx
"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";

const Specials = forwardRef((props, ref) => {
    const {
        placedItems,
        setPlacedItems,
        specialItems,
        setSpecialItems,
        specialStartCell,
        setSpecialStartCell,
    } = props;

    // Ref to store the measurement marker id
    const measurementMarkerRef = useRef(null);
    // **** NEW CODE: Add a ref to store pending connector for pairing ****
    const pendingConnectorRef = useRef(null);
    // **** NEW CODE END ****

    // Connector and Label functions remain unchanged...
    // **** NEW CODE START ****
    const handleConnectorsPlacement = (cell) => {
        // Prevent placing a connector if one already exists at this cell.
        const existing = placedItems.find(
            (it) =>
                it.type === "connectors" &&
                it.cellX === cell.cellX &&
                it.cellY === cell.cellY
        );
        if (existing) {
            // Do not allow placement over an existing connector.
            return;
        }
        if (pendingConnectorRef.current) {
            // There is a pending connector, so complete the pair.
            const firstConnector = pendingConnectorRef.current;
            const pairNumber = firstConnector.pairNumber;
            const timestamp = Date.now();
            const secondConnector = {
                id: timestamp + "-2",
                type: "connectors",
                pairNumber: pairNumber,
                cellX: cell.cellX,
                cellY: cell.cellY,
                borderColor: firstConnector.borderColor,
                textColor: firstConnector.textColor,
                name: "Connectors",
            };
            setPlacedItems((prev) => [...prev, secondConnector]);
            pendingConnectorRef.current = null;
        } else {
            let maxPair = 0;
            placedItems.forEach((item) => {
                if (
                    item.type === "connectors" &&
                    item.pairNumber &&
                    item.pairNumber > maxPair
                ) {
                    maxPair = item.pairNumber;
                }
            });
            const newPairNumber = maxPair + 1;
            // Generate a random color for border and font.
            const randomColor =
                "#" + Math.floor(Math.random() * 16777215).toString(16);
            const timestamp = Date.now();
            const newConnector = {
                id: timestamp + "-1",
                type: "connectors",
                pairNumber: newPairNumber,
                cellX: cell.cellX,
                cellY: cell.cellY,
                borderColor: randomColor,
                textColor: randomColor,
                name: "Connectors",
            };
            setPlacedItems((prev) => [...prev, newConnector]);
            pendingConnectorRef.current = newConnector;
        }
    };
    // **** NEW CODE END ****

    const handleMeasurement = (
        cell,
        selectedSpecialObject,
        specialRotation
    ) => {
        console.log("[Measurement] Click at cell:", cell);
        if (!specialStartCell) {
            // First click: set start cell and create marker with start image.
            const newMarker = {
                id: Date.now(),
                type: "measurement",
                startCellX: cell.cellX,
                startCellY: cell.cellY,
                endCellX: cell.cellX, // initially same as start
                endCellY: cell.cellY,
                numericValue: "", // not set yet
                rotation: specialRotation,
                startImage: selectedSpecialObject.startImage,
                endImage: selectedSpecialObject.endImage,
                name: "Measurement",
            };
            console.log(
                "[Measurement] Setting start cell and marker:",
                newMarker
            );
            measurementMarkerRef.current = newMarker.id;
            setSpecialItems((prev) => [...prev, newMarker]);
            setSpecialStartCell(cell);
            return;
        }
        // Second click: check alignment.
        const { cellX: sx, cellY: sy } = specialStartCell;
        if (sx !== cell.cellX && sy !== cell.cellY) {
            alert("Measurement must be aligned horizontally or vertically.");
            console.log(
                "[Measurement] Misaligned: start",
                specialStartCell,
                "end",
                cell
            );
            // Remove the temporary marker.
            setSpecialItems((prev) =>
                prev.filter((item) => item.id !== measurementMarkerRef.current)
            );
            setSpecialStartCell(null);
            measurementMarkerRef.current = null;
            return;
        }
        console.log(
            "[Measurement] Aligned measurement. Prompting for value..."
        );
        const value = window.prompt("Enter numeric value for measurement:");
        if (!value) {
            console.log("[Measurement] No value entered. Removing marker.");
            setSpecialItems((prev) =>
                prev.filter((item) => item.id !== measurementMarkerRef.current)
            );
            setSpecialStartCell(null);
            measurementMarkerRef.current = null;
            return;
        }
        // Update the measurement marker with the end cell and numeric value.
        setSpecialItems((prev) =>
            prev.map((item) => {
                if (item.id === measurementMarkerRef.current) {
                    return {
                        ...item,
                        endCellX: cell.cellX,
                        endCellY: cell.cellY,
                        numericValue: value.trim(),
                    };
                }
                return item;
            })
        );
        console.log(
            "[Measurement] Measurement marker updated with end cell and value:",
            cell,
            value
        );
        setSpecialStartCell(null);
        measurementMarkerRef.current = null;
    };

    const handleLabel = (cell) => {
        const labelText = window.prompt("Enter label text:");
        if (!labelText) return;
        const labelItem = {
            id: Date.now(),
            type: "label",
            labelText: labelText.trim(),
            cellX: cell.cellX,
            cellY: cell.cellY,
            name: "Label",
        };
        setSpecialItems((prev) => [...prev, labelItem]);
    };

    const handleSpecialCellClick = (
        cell,
        selectedSpecialObject,
        specialRotation
    ) => {
        console.log(
            "[Special] handleSpecialCellClick called with:",
            cell,
            selectedSpecialObject
        );
        if (selectedSpecialObject.type === "measurement") {
            handleMeasurement(cell, selectedSpecialObject, specialRotation);
        } else if (selectedSpecialObject.type === "label") {
            handleLabel(cell);
        }
    };

    const removeSpecialItems = (cell) => {
        // Try to locate a connector at the cell with exact grid coordinates.
        const connectorAtCell = placedItems.find(
            (it) =>
                it.type === "connectors" &&
                it.cellX === cell.cellX &&
                it.cellY === cell.cellY
        );
        if (connectorAtCell) {
            // If the connector being removed is pending, clear the pending reference.
            if (
                pendingConnectorRef.current &&
                pendingConnectorRef.current.id === connectorAtCell.id
            ) {
                pendingConnectorRef.current = null;
            }
            // Remove both connectors in the pair by filtering on pairNumber.
            setPlacedItems((prev) =>
                prev.filter(
                    (it) =>
                        !(
                            it.type === "connectors" &&
                            it.pairNumber === connectorAtCell.pairNumber
                        )
                )
            );
        } else {
            // Fallback: remove any item exactly at the cell, and also remove special items.
            setPlacedItems((prev) =>
                prev.filter(
                    (it) =>
                        !(it.cellX === cell.cellX && it.cellY === cell.cellY)
                )
            );
            setSpecialItems((prev) =>
                prev.filter((sp) => {
                    if (sp.type === "label") {
                        return !(
                            sp.cellX === cell.cellX && sp.cellY === cell.cellY
                        );
                    } else if (sp.type === "measurement") {
                        return !(
                            (sp.startCellX === cell.cellX &&
                                sp.startCellY === cell.cellY) ||
                            (sp.endCellX === cell.cellX &&
                                sp.endCellY === cell.cellY)
                        );
                    }
                    return true;
                })
            );
        }
    };

    useImperativeHandle(ref, () => ({
        handleConnectorsPlacement,
        handleSpecialCellClick,
        removeSpecialItems,
    }));

    return null;
});

export default Specials;
