"use client"; // Ensure this component is rendered on the client
/************************************************************
 * Schematic.jsx
 *
 * This is the main container component for your schematic.
 * It stores all top-level state (data arrays, selections,
 * placed items, special measurements, etc.) and passes
 * props and handlers down to child components.
 ************************************************************/
import React, { useState } from "react";
import SchematicDropdowns from "./SchematicDropdowns";
import SchematicCanvas from "./SchematicCanvas";
import SchematicList from "./SchematicList";
import "./schematic.css"; // Import external CSS for styling

// --- Data Arrays ---
// These arrays store the items for your dropdowns.
// Note: In Next.js, static assets (images) should be placed in the public/ folder.
// Hence, image paths begin with a "/" to indicate the public folder.
const pieces = [
  { id: 1, name: "Canopy", image: "./schematic/ductwork/canopy.svg", length: 30, width: 30, height: 30 },
  { id: 2, name: "Fan unit", image: "./schematic/ductwork/fan-unit.svg", length: 30, width: 30, height: 30 },
  { id: 3, name: "Square duct", image: "./schematic/ductwork/square-duct.svg", length: 30, width: 30, height: 30 },
  { id: 4, name: "Square duct toward viewer", image: "./schematic/ductwork/square-duct-toward.svg", length: 30, width: 30, height: 30 },
  { id: 5, name: "Square duct away from viewer", image: "./schematic/ductwork/square-duct-away.svg", length: 30, width: 30, height: 30 },
  { id: 6, name: "Circular duct", image: "./schematic/ductwork/circular-duct.svg", length: 30, width: 30, height: 30 },
  { id: 7, name: "Circular duct toward viewer", image: "./schematic/ductwork/circular-duct-toward.svg", length: 30, width: 30, height: 30 },
  { id: 8, name: "Circular duct away from viewer", image: "./schematic/ductwork/circular-duct-away.svg", length: 30, width: 30, height: 30 },
  { id: 9, name: "Air handling unit", image: "./schematic/ductwork/air-handling.svg", length: 30, width: 30, height: 30 },
  { id: 10, name: "Atmosphere point", image: "./schematic/ductwork/atmosphere-point.svg", length: 30, width: 30, height: 30 },
  { id: 11, name: "Red duct", image: "./schematic/ductwork/red-duct.svg", length: 30, width: 30, height: 30 },
  { id: 12, name: "Red duct toward viewer", image: "./schematic/ductwork/red-duct-toward.svg", length: 30, width: 30, height: 30 },
  { id: 13, name: "Red duct away from viewer", image: "./schematic/ductwork/red-duct-away.svg", length: 30, width: 30, height: 30 },
  { id: 14, name: "Cream duct", image: "./schematic/ductwork/cream-duct.svg", length: 30, width: 30, height: 30 },
  { id: 15, name: "Cream duct toward viewer", image: "./schematic/ductwork/cream-duct-toward.svg", length: 30, width: 30, height: 30 },
  { id: 16, name: "Cream duct away from viewer", image: "./schematic/ductwork/cream-duct-away.svg", length: 30, width: 30, height: 30 },
  { id: 17, name: "Flexi hose", image: "./schematic/ductwork/flexi-hose.svg", length: 30, width: 30, height: 30 },
  { id: 18, name: "Inaccessible duct can be overcome", image: "./schematic/ductwork/inaccessible-duct-obstacles-can-be-overcome.svg", length: 30, width: 30, height: 30 },
  { id: 19, name: "Inaccessible duct can't be overcome", image: "./schematic/ductwork/inaccessible-duct-obstables-can-not-be-overcome.svg", length: 30, width: 30, height: 30 },
  { id: 20, name: "Inaccessible duct toward viewer", image: "./schematic/ductwork/inaccessible-duct-toward.svg", length: 30, width: 30, height: 30 },
  { id: 21, name: "Inaccessible duct away from viewer", image: "./schematic/ductwork/inaccessible-duct-away.svg", length: 30, width: 30, height: 30 },
  { id: 22, name: "Inaccessible duct no access door", image: "./schematic/ductwork/inaccessible-duct-no-access-door.svg", length: 30, width: 30, height: 30 },
];

const panels = [
  { id: 1, name: "New access panel", image: "/schematic/access-panels/new-access.svg", length: 30, width: 30, height: 30 },
  { id: 2, name: "Existing access", image: "/schematic/access-panels/existing-access.svg", length: 30, width: 30, height: 30 },
  { id: 3, name: "Replace existing access", image: "/schematic/access-panels/replace-existing-access.svg", length: 30, width: 30, height: 30 },
];

const fixtures = [
  { id: 1, name: "Roof / Wall / Ceiling", image: "/schematic/fixed/roof-wall-ceiling.svg"},
  { id: 2, name: "Damper", image: "/schematic/fixed/damper.svg"},
  { id: 3, name: "Fire damper", image: "/schematic/fixed/fire-damper.svg"},
  { id: 4, name: "Fire sensor", image: "/schematic/fixed/fire-sensor.svg"},
  { id: 5, name: "Silencer", image: "/schematic/fixed/silencer.svg"},
  { id: 6, name: "Test area", image: "/schematic/fixed/test-area.svg"},
  { id: 7, name: "Turning vane", image: "/schematic/fixed/turning-vane.svg"},
  { id: 8, name: "Existing access inaccessible", image: "/schematic/fixed/existing-access-inaccessible.svg"},
];

// Special measurement images
const SPECIAL_START_IMAGE = "/start.svg";
const SPECIAL_END_IMAGE = "/end.svg";

function Schematic() {
  /**********************************************************
   * Top-Level State
   **********************************************************/
  // Grid size (number of cells per side)
  const [gridSpaces, setGridSpaces] = useState(25);

  // Selected dropdown items
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [selectedSpecialObject, setSelectedSpecialObject] = useState(null);

  // Array of items placed on the canvas
  const [placedItems, setPlacedItems] = useState([]);

  // Flags for delete mode and dragging states
  const [deleteMode, setDeleteMode] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Special measurement state
  const [specialItems, setSpecialItems] = useState([]);
  const [specialStartCell, setSpecialStartCell] = useState(null);
  const [specialRotation, setSpecialRotation] = useState(0);

  // Dimension inputs for the final list (for pieces and panels)
  const [groupDimensions, setGroupDimensions] = useState({});

  /**********************************************************
   * Handlers for Delete and Rotate buttons
   **********************************************************/
  // Toggles delete mode and resets dropdown selections
  const handleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedPiece(null);
    setSelectedPanel(null);
    setSelectedFixture(null);
    setSelectedSpecialObject(null);
    setSpecialStartCell(null);
  };

  // Increments the rotation by 90 degrees (mod 360)
  const handleRotateSpecial = () => {
    setSpecialRotation((prev) => (prev + 90) % 360);
  };

  // Handles changes in dimension inputs for the final list
  const handleDimensionChange = (groupKey, field, rawValue) => {
    setGroupDimensions((prev) => {
      const newDims = { ...prev[groupKey] };
      if (rawValue === "") {
        newDims[field] = "";
      } else {
        const parsed = parseInt(rawValue, 10);
        newDims[field] = Number.isNaN(parsed) ? "" : parsed;
      }
      return { ...prev, [groupKey]: newDims };
    });
  };

  /**********************************************************
   * Render Child Components
   **********************************************************/
  return (
    <div className="schematic-app">
      <h1>Schematic</h1>

      {/* Dropdowns, grid size slider, rotate and delete buttons */}
      <SchematicDropdowns
        gridSpaces={gridSpaces}
        setGridSpaces={setGridSpaces}
        pieces={pieces}
        panels={panels}
        fixtures={fixtures}
        selectedPiece={selectedPiece}
        setSelectedPiece={setSelectedPiece}
        selectedPanel={selectedPanel}
        setSelectedPanel={setSelectedPanel}
        selectedFixture={selectedFixture}
        setSelectedFixture={setSelectedFixture}
        selectedSpecialObject={selectedSpecialObject}
        setSelectedSpecialObject={setSelectedSpecialObject}
        specialRotation={specialRotation}
        handleRotateSpecial={handleRotateSpecial}
        deleteMode={deleteMode}
        handleDeleteMode={handleDeleteMode}
        setSpecialStartCell={setSpecialStartCell}
      />

      {/* Canvas (grid) area */}
      <SchematicCanvas
        gridSpaces={gridSpaces}
        selectedPiece={selectedPiece}
        selectedPanel={selectedPanel}
        selectedFixture={selectedFixture}
        deleteMode={deleteMode}
        isPlacing={isPlacing}
        setIsPlacing={setIsPlacing}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        specialItems={specialItems}
        setSpecialItems={setSpecialItems}
        selectedSpecialObject={selectedSpecialObject}
        specialStartCell={specialStartCell}
        setSpecialStartCell={setSpecialStartCell}
        specialRotation={specialRotation}
        placedItems={placedItems}
        setPlacedItems={setPlacedItems}
      />

      {/* Final "Placed Items" list (only pieces and panels are shown) */}
      <SchematicList
        placedItems={placedItems}
        groupDimensions={groupDimensions}
        setGroupDimensions={setGroupDimensions}
        handleDimensionChange={handleDimensionChange}
      />
    </div>
  );
}

export default Schematic;
