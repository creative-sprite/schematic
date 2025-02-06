"use client";
import React, { useEffect } from "react";

function SchematicList(props) {
  const {
    placedItems,
    groupDimensions,
    setGroupDimensions,
    handleDimensionChange,
  } = props;

  // separate out pieces/panels, ignoring fixtures
  const pieceItems = placedItems.filter((it) => it.type === "piece");
  const panelItems = placedItems.filter((it) => it.type === "panel");

  const sortedPanelItems = [...panelItems].sort((a, b) => a.id - b.id);

  // group pieces
  const groupedPieces = pieceItems.reduce((acc, it) => {
    const key = it.type + "-" + it.originalId;
    if (!acc[key]) {
      acc[key] = {
        type: it.type,
        id: it.originalId,
        name: it.name,
        image: it.image,
        count: 0,
        length: it.length,
        width: it.width,
        height: it.height,
      };
    }
    acc[key].count++;
    return acc;
  }, {});
  const groupedPiecesArray = Object.values(groupedPieces);

  useEffect(() => {
    const newDims = { ...groupDimensions };
    let updated = false;

    // add keys for grouped pieces
    Object.keys(groupedPieces).forEach((k) => {
      if (!newDims[k]) {
        newDims[k] = { length: "", width: "", height: "" };
        updated = true;
      }
    });

    // add keys for each panel
    sortedPanelItems.forEach((p) => {
      const pk = `panel-${p.id}`;
      if (!newDims[pk]) {
        newDims[pk] = { length: "", width: "", height: "" };
        updated = true;
      }
    });

    // remove old keys
    const validKeys = new Set();
    Object.keys(groupedPieces).forEach((k) => validKeys.add(k));
    sortedPanelItems.forEach((p) => validKeys.add(`panel-${p.id}`));

    Object.keys(newDims).forEach((existingKey) => {
      if (!validKeys.has(existingKey)) {
        delete newDims[existingKey];
        updated = true;
      }
    });

    if (updated) {
      setGroupDimensions(newDims);
    }
  }, [groupedPieces, sortedPanelItems, groupDimensions, setGroupDimensions]);

  return (
    <div className="placed-list" style={{ marginTop: "1rem" }}>
      <h2>Placed Items</h2>
      <ul>
        {/* Grouped pieces */}
        {groupedPiecesArray.map((group) => {
          const key = group.type + "-" + group.id;
          const dims = groupDimensions[key] || {
            length: "",
            width: "",
            height: "",
          };
          return (
            <li key={key} className="placed-list-item">
              <img
                src={group.image}
                alt={group.name}
                width="30"
                height="30"
                style={{ marginRight: 4 }}
              />
              <span>{group.name}</span>
              <span> × {group.count}</span>
              <div className="dimensions" style={{ marginLeft: 8 }}>
                <label>
                  Length:
                  <input
                    type="text"
                    value={dims.length === "" ? "" : dims.length}
                    onChange={(e) =>
                      handleDimensionChange(key, "length", e.target.value)
                    }
                    style={{ width: 50, marginLeft: 4 }}
                  />
                </label>
                <label style={{ marginLeft: 8 }}>
                  Width:
                  <input
                    type="text"
                    value={dims.width === "" ? "" : dims.width}
                    onChange={(e) =>
                      handleDimensionChange(key, "width", e.target.value)
                    }
                    style={{ width: 50, marginLeft: 4 }}
                  />
                </label>
                <label style={{ marginLeft: 8 }}>
                  Height:
                  <input
                    type="text"
                    value={dims.height === "" ? "" : dims.height}
                    onChange={(e) =>
                      handleDimensionChange(key, "height", e.target.value)
                    }
                    style={{ width: 50, marginLeft: 4 }}
                  />
                </label>
              </div>
            </li>
          );
        })}

        {/* Individual panels */}
        {sortedPanelItems.map((panelItem, index) => {
          const panelIndex = index + 1;
          const panelKey = `panel-${panelItem.id}`;
          const dims = groupDimensions[panelKey] || {
            length: "",
            width: "",
            height: "",
          };
          return (
            <li key={panelItem.id} className="placed-list-item">
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={panelItem.image}
                  alt={panelItem.name}
                  width="30"
                  height="30"
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "black",
                    color: "white",
                    fontSize: "12px",
                    padding: "0 4px",
                    borderRadius: "4px 0 0 4px",
                  }}
                >
                  {panelIndex}
                </div>
              </div>
              <span style={{ marginLeft: 8 }}>{panelItem.name}</span>
              <div className="dimensions" style={{ marginLeft: 8 }}>
                <label>
                  Length:
                  <input
                    type="text"
                    value={dims.length === "" ? "" : dims.length}
                    onChange={(e) =>
                      handleDimensionChange(panelKey, "length", e.target.value)
                    }
                    style={{ width: 50, marginLeft: 4 }}
                  />
                </label>
                <label style={{ marginLeft: 8 }}>
                  Width:
                  <input
                    type="text"
                    value={dims.width === "" ? "" : dims.width}
                    onChange={(e) =>
                      handleDimensionChange(panelKey, "width", e.target.value)
                    }
                    style={{ width: 50, marginLeft: 4 }}
                  />
                </label>
                <label style={{ marginLeft: 8 }}>
                  Height:
                  <input
                    type="text"
                    value={dims.height === "" ? "" : dims.height}
                    onChange={(e) =>
                      handleDimensionChange(panelKey, "height", e.target.value)
                    }
                    style={{ width: 50, marginLeft: 4 }}
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default SchematicList;
