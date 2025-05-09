// components\kitchenSurvey\SurveyArea.jsx

"use client";
import React, { useState, useRef, useEffect } from "react";
import Structure from "./Structure";
import Equipment from "./Equipment";
import Canopy from "./Canopy";
import Schematic from "./Schematic/Schematic.jsx";
import Images from "./Images";

export default function SurveyArea({ areaIndex }) {
    const areaRef = useRef(null);

    // Scroll to the top of this area when it mounts.
    useEffect(() => {
        if (areaRef.current) {
            areaRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, []);

    // Local state for this survey area.
    const [structureTotal, setStructureTotal] = useState(0);
    const [structureId, setStructureId] = useState("");
    const [surveyData, setSurveyData] = useState([]);
    const [equipmentId, setEquipmentId] = useState("");
    const [canopyTotal, setCanopyTotal] = useState(0);
    const [canopyId, setCanopyId] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [accessDoorPrice, setAccessDoorPrice] = useState(0);
    const [ventilationPrice, setVentilationPrice] = useState(0);
    const [airPrice, setAirPrice] = useState(0);
    const [fanPartsPrice, setFanPartsPrice] = useState(0);
    const [airInExTotal, setAirInExTotal] = useState(0);
    const [schematicItemsTotal, setSchematicItemsTotal] = useState(0);

    // Track if this area has Flexi-Duct/Flexi Hose with ventilation products
    const [hasFlexiDuctProducts, setHasFlexiDuctProducts] = useState(false);

    // Handler for ventilation price from Flexi-Duct/Flexi Hose
    const handleVentilationPriceChange = (price) => {
        setVentilationPrice(price);
        setHasFlexiDuctProducts(price > 0);
    };

    // Alternate background color: even-indexed areas white, odd-indexed areas light gray.
    const backgroundColor = areaIndex % 2 === 0 ? "#ffffff" : "#f2f2f2";

    return (
        <div
            ref={areaRef}
            style={{
                marginBottom: "2rem",
                border: "1px solid #ddd",
                padding: "1rem",
                backgroundColor: backgroundColor,
            }}
        >
            <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>
                Area {areaIndex + 1}
            </h1>
            <Structure
                onStructureTotalChange={(total) => setStructureTotal(total)}
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
            />
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
            />
            <Images />

            {/* Optional debug information for Flexi-Duct ventilation */}
            {hasFlexiDuctProducts && (
                <div
                    style={{
                        marginTop: "1rem",
                        padding: "0.5rem",
                        backgroundColor: "rgba(144, 238, 144, 0.2)",
                        border: "1px solid rgba(144, 238, 144, 0.5)",
                        borderRadius: "4px",
                    }}
                >
                    <p style={{ margin: "0", fontSize: "0.9rem" }}>
                        <strong>Note:</strong> This area includes
                        Flexi-Duct/Flexi Hose with added ventilation products.
                        Total ventilation price: £{ventilationPrice.toFixed(2)}
                    </p>
                </div>
            )}
        </div>
    );
}
