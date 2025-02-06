"use client";
import React, { useRef, useEffect, useState } from "react";

const CELL_SIZE = 32; // same cell size

function SchematicCanvas(props) {
  const {
    gridSpaces,
    selectedPiece,
    selectedPanel,
    selectedFixture,
    deleteMode,
    isPlacing,
    setIsPlacing,
    isDeleting,
    setIsDeleting,
    specialItems,
    setSpecialItems,
    selectedSpecialObject,
    specialStartCell,
    setSpecialStartCell,
    specialRotation,
    placedItems,
    setPlacedItems,
  } = props;

  const canvasRef = useRef(null);
  const [pointerDownCaptured, setPointerDownCaptured] = useState(false);

  // track last cell
  const lastPlacedCell = useRef({ cellX: -1, cellY: -1 });

  const getCellFromEvent = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);
    return { cellX, cellY };
  };

  const placeItemInCell = ({ cellX, cellY }) => {
    const sObj = selectedPiece || selectedPanel || selectedFixture;
    if (!sObj) return;

    let newType = null;
    if (selectedPiece) newType = "piece";
    else if (selectedPanel) newType = "panel";
    else if (selectedFixture) newType = "fixture";

    setPlacedItems((prev) =>
      prev.filter((it) => !(it.cellX === cellX && it.cellY === cellY))
    );
    const newItem = {
      id: Date.now(),
      originalId: sObj.id,
      type: newType,
      name: sObj.name,
      image: sObj.image,
      cellX,
      cellY,
      length: sObj.length,
      width: sObj.width,
      height: sObj.height,
    };
    setPlacedItems((prev) => [...prev, newItem]);
    lastPlacedCell.current = { cellX, cellY };
  };

  const removeItemInCell = ({ cellX, cellY }) => {
    setPlacedItems((prev) =>
      prev.filter((it) => !(it.cellX === cellX && it.cellY === cellY))
    );
    setSpecialItems((prev) =>
      prev.filter(
        (sp) =>
          !(
            (sp.startCellX === cellX && sp.startCellY === cellY) ||
            (sp.endCellX === cellX && sp.endCellY === cellY)
          )
      )
    );
    lastPlacedCell.current = { cellX, cellY };
  };

  const handleSpecialCellClick = (cell) => {
    if (!specialStartCell) {
      setSpecialStartCell(cell);
    } else {
      const { cellX: sx, cellY: sy } = specialStartCell;
      const { cellX: ex, cellY: ey } = cell;
      if (sx !== ex && sy !== ey) {
        alert("Must be aligned horizontally or vertically.");
        setSpecialStartCell(null);
        return;
      }
      const valString = window.prompt("Enter numeric value:", "");
      if (!valString) {
        setSpecialStartCell(null);
        return;
      }
      const numericVal = valString.trim();
      const newSpecial = {
        id: Date.now(),
        name: "Measurement",
        startImage: selectedSpecialObject.startImage,
        endImage: selectedSpecialObject.endImage,
        numericValue: numericVal,
        startCellX: sx,
        startCellY: sy,
        endCellX: ex,
        endCellY: ey,
        rotation: specialRotation,
      };
      setSpecialItems((prev) => [...prev, newSpecial]);
      setSpecialStartCell(null);
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setPointerDownCaptured(true);

    const cell = getCellFromEvent(e);

    if (selectedSpecialObject) {
      handleSpecialCellClick(cell);
      return;
    }

    if (deleteMode) {
      setIsDeleting(true);
      removeItemInCell(cell);
    } else {
      setIsPlacing(true);
      placeItemInCell(cell);
    }
  };

  const handlePointerMove = (e) => {
    if (!pointerDownCaptured) return;
    e.preventDefault();
    const cell = getCellFromEvent(e);

    if (isDeleting) {
      if (
        cell.cellX !== lastPlacedCell.current.cellX ||
        cell.cellY !== lastPlacedCell.current.cellY
      ) {
        removeItemInCell(cell);
      }
      return;
    }
    if (isPlacing) {
      if (
        cell.cellX !== lastPlacedCell.current.cellX ||
        cell.cellY !== lastPlacedCell.current.cellY
      ) {
        placeItemInCell(cell);
      }
    }
  };

  const handlePointerUp = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setPointerDownCaptured(false);
    setIsPlacing(false);
    setIsDeleting(false);
    lastPlacedCell.current = { cellX: -1, cellY: -1 };
  };

  const handlePointerCancel = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setPointerDownCaptured(false);
    setIsPlacing(false);
    setIsDeleting(false);
    lastPlacedCell.current = { cellX: -1, cellY: -1 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
    canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
    canvas.addEventListener("pointerup", handlePointerUp, { passive: false });
    canvas.addEventListener("pointercancel", handlePointerCancel, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [
    deleteMode,
    isPlacing,
    isDeleting,
    selectedPiece,
    selectedPanel,
    selectedFixture,
    selectedSpecialObject,
    specialRotation,
    specialStartCell,
  ]);

  const canvasPixelSize = gridSpaces * CELL_SIZE;

  return (
    <div
      ref={canvasRef}
      className="canvas"
      style={{
        width: canvasPixelSize,
        height: canvasPixelSize,
        border: "2px solid #3B3B3B",
        position: "relative",
        touchAction: "none",
        userSelect: "none",
        marginTop: "1rem",
      }}
    >
      {placedItems.map((item) => {
        const cellLeft = item.cellX * CELL_SIZE;
        const cellTop = item.cellY * CELL_SIZE;

        const leftNeighbor = placedItems.find(
          (o) => o.cellX === item.cellX - 1 && o.cellY === item.cellY
        );
        const rightNeighbor = placedItems.find(
          (o) => o.cellX === item.cellX + 1 && o.cellY === item.cellY
        );
        const topNeighbor = placedItems.find(
          (o) => o.cellX === item.cellX && o.cellY === item.cellY - 1
        );
        const bottomNeighbor = placedItems.find(
          (o) => o.cellX === item.cellX && o.cellY === item.cellY + 1
        );

        const showLeftBorder =
          leftNeighbor && leftNeighbor.originalId !== item.originalId;
        const showRightBorder =
          rightNeighbor && rightNeighbor.originalId !== item.originalId;
        const showTopBorder =
          topNeighbor && topNeighbor.originalId !== item.originalId;
        const showBottomBorder =
          bottomNeighbor && bottomNeighbor.originalId !== item.originalId;

        return (
          <div
            key={item.id}
            className="placed-item-container"
            style={{
              position: "absolute",
              left: cellLeft,
              top: cellTop,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          >
            <img src={item.image} alt={item.name} className="placed-item-img" />
            {showLeftBorder && <div className="border-overlay left" />}
            {showRightBorder && <div className="border-overlay right" />}
            {showTopBorder && <div className="border-overlay top" />}
            {showBottomBorder && <div className="border-overlay bottom" />}
          </div>
        );
      })}

      {specialItems.map((spec) => {
        const {
          startCellX,
          startCellY,
          endCellX,
          endCellY,
          numericValue,
          startImage,
          endImage,
          rotation,
          id,
        } = spec;

        const startLeft = startCellX * CELL_SIZE;
        const startTop = startCellY * CELL_SIZE;
        const endLeft = endCellX * CELL_SIZE;
        const endTop = endCellY * CELL_SIZE;

        const leftX = Math.min(startLeft, endLeft);
        const rightX = Math.max(startLeft, endLeft) + CELL_SIZE;
        const topY = Math.min(startTop, endTop);
        const bottomY = Math.max(startTop, endTop) + CELL_SIZE;
        const midX = (leftX + rightX) / 2;
        const midY = (topY + bottomY) / 2;

        return (
          <React.Fragment key={id}>
            <div
              style={{
                position: "absolute",
                left: startLeft,
                top: startTop,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              <img
                src={startImage}
                alt="Start"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: endLeft,
                top: endTop,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              <img
                src={endImage}
                alt="End"
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: midX,
                top: midY,
                transform: "translate(-50%, -50%)",
                background: "rgba(255,255,255,0.8)",
                padding: "2px 4px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                pointerEvents: "none",
              }}
            >
              {numericValue}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default SchematicCanvas;
