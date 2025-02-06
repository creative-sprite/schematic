"use client"; // Ensure this component is rendered on the client side (Next.js)

/************************************************************
 * SchematicDropdowns.jsx
 *
 * This component renders:
 *   - A grid size slider (now included as a flex item)
 *   - Four dropdowns: Pieces, Panels, Fixtures, and Special (Measurement)
 *   - The Rotate button (visible only when a special object is selected)
 *     and the Delete button.
 *
 * All these elements are wrapped inside a flex container (.dropdown-group)
 * so that they are vertically centered and display in one row on wide screens,
 * then wrap on smaller screens.
 ************************************************************/
import React from "react";

function SchematicDropdowns(props) {
  // Destructure props
  const {
    gridSpaces,
    setGridSpaces,
    pieces,
    panels,
    fixtures,
    selectedPiece,
    setSelectedPiece,
    selectedPanel,
    setSelectedPanel,
    selectedFixture,
    setSelectedFixture,
    selectedSpecialObject,
    setSelectedSpecialObject,
    specialRotation,
    handleRotateSpecial,
    deleteMode,
    handleDeleteMode,
    setSpecialStartCell,
  } = props;

  // Handler for Pieces dropdown
  const handleDropdownPiece = (e) => {
    if (deleteMode) handleDeleteMode();
    setSelectedPanel(null);
    setSelectedFixture(null);
    setSelectedSpecialObject(null);
    const value = e.target.value;
    if (value === "none") setSelectedPiece(null);
    else {
      const pieceObj = pieces.find((p) => p.id === parseInt(value, 10));
      setSelectedPiece(pieceObj);
    }
  };

  // Handler for Panels dropdown
  const handleDropdownPanel = (e) => {
    if (deleteMode) handleDeleteMode();
    setSelectedPiece(null);
    setSelectedFixture(null);
    setSelectedSpecialObject(null);
    const value = e.target.value;
    if (value === "none") setSelectedPanel(null);
    else {
      const panelObj = panels.find((p) => p.id === parseInt(value, 10));
      setSelectedPanel(panelObj);
    }
  };

  // Handler for Fixtures dropdown
  const handleDropdownFixture = (e) => {
    if (deleteMode) handleDeleteMode();
    setSelectedPiece(null);
    setSelectedPanel(null);
    setSelectedSpecialObject(null);
    const value = e.target.value;
    if (value === "none") setSelectedFixture(null);
    else {
      const fixObj = fixtures.find((f) => f.id === parseInt(value, 10));
      setSelectedFixture(fixObj);
    }
  };

  // Handler for Special measurement dropdown
  const handleDropdownSpecial = (e) => {
    if (deleteMode) handleDeleteMode();
    setSelectedPiece(null);
    setSelectedPanel(null);
    setSelectedFixture(null);
    const value = e.target.value;
    if (value === "none") {
      setSelectedSpecialObject(null);
      setSpecialStartCell(null);
    } else {
      setSelectedSpecialObject({
        name: "Measurement",
        startImage: "/start.svg", // Images in public/ folder
        endImage: "/end.svg",
      });
      setSpecialStartCell(null);
    }
  };

  return (
    // The "dropdown-group" flex container holds all controls in one row.
    <div className="dropdown-group">
      {/* Grid Size Slider as a flex item */}
      <div className="dropdown-container">
        <label style={{ marginRight: "0.5rem" }}>
          Grid Spaces (W/H): {gridSpaces}
        </label>
        <input
          type="range"
          min="20"
          max="100"
          value={gridSpaces}
          onChange={(e) => setGridSpaces(parseInt(e.target.value, 10))}
        />
      </div>

      {/* Pieces Dropdown */}
      <div className="dropdown-container">
        <label style={{ marginRight: "0.5rem" }}>Pieces: </label>
        <select onChange={handleDropdownPiece} value={selectedPiece ? selectedPiece.id : "none"}>
          <option value="none">None</option>
          {pieces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="selected-image" style={{ marginLeft: "0.5rem" }}>
          {selectedPiece ? (
            <img src={selectedPiece.image} alt={selectedPiece.name} width="30" height="30" />
          ) : (
            <div className="empty-box"></div>
          )}
        </div>
      </div>

      {/* Panels Dropdown */}
      <div className="dropdown-container">
        <label style={{ marginRight: "0.5rem" }}>Panels: </label>
        <select onChange={handleDropdownPanel} value={selectedPanel ? selectedPanel.id : "none"}>
          <option value="none">None</option>
          {panels.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="selected-image" style={{ marginLeft: "0.5rem" }}>
          {selectedPanel ? (
            <img src={selectedPanel.image} alt={selectedPanel.name} width="30" height="30" />
          ) : (
            <div className="empty-box"></div>
          )}
        </div>
      </div>

      {/* Fixtures Dropdown */}
      <div className="dropdown-container">
        <label style={{ marginRight: "0.5rem" }}>Fixtures: </label>
        <select onChange={handleDropdownFixture} value={selectedFixture ? selectedFixture.id : "none"}>
          <option value="none">None</option>
          {fixtures.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <div className="selected-image" style={{ marginLeft: "0.5rem" }}>
          {selectedFixture ? (
            <img src={selectedFixture.image} alt={selectedFixture.name} width="30" height="30" />
          ) : (
            <div className="empty-box"></div>
          )}
        </div>
      </div>

      {/* Special Measurement Dropdown with Preview */}
      <div className="dropdown-container">
        <label style={{ marginRight: "0.5rem" }}>Special: </label>
        <select onChange={handleDropdownSpecial} value={selectedSpecialObject ? "special" : "none"}>
          <option value="none">None</option>
          <option value="special">Measurement</option>
        </select>
        <div className="selected-image" style={{ marginLeft: "0.5rem" }}>
          {selectedSpecialObject ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                src={selectedSpecialObject.startImage}
                alt="Start"
                width="30"
                height="30"
                style={{ transform: `rotate(${specialRotation}deg)`, marginRight: "8px" }}
              />
              <img
                src={selectedSpecialObject.endImage}
                alt="End"
                width="30"
                height="30"
                style={{ transform: `rotate(${specialRotation}deg)` }}
              />
            </div>
          ) : (
            <div className="empty-box"></div>
          )}
        </div>
      </div>

      {/* Rotate and Delete Buttons */}
      {selectedSpecialObject && (
        <button onClick={handleRotateSpecial} style={{ marginLeft: "1rem" }}>
          Rotate
        </button>
      )}
      <button onClick={handleDeleteMode} style={{ marginLeft: "1rem" }}>
        {deleteMode ? "Exit Delete Mode" : "Delete"}
      </button>
    </div>
  );
}

export default SchematicDropdowns;
