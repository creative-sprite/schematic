// components/kitchenSurvey/save/savePDF/sections/schematicCanvasGenerator.js

/**
 * Generates visual schematic canvases for PDF with smart distance-based grouping and cropping
 */

// Target width for all canvases to match PDF card width
const TARGET_CANVAS_WIDTH = 750; // pixels - adjust to match your PDF card width

/**
 * Find connected groups using distance-based clustering instead of flood-fill
 * @param {Array} placedItems - Array of placed items
 * @param {Array} specialItems - Array of special items (measurements, labels)
 * @returns {Array} Array of groups, each containing connected items
 */
const findConnectedGroups = (placedItems, specialItems) => {
  // Combine all items with their positions
  const allItems = [];
  
  // Add placed items
  placedItems.forEach(item => {
    if (item.cellX !== undefined && item.cellY !== undefined) {
      allItems.push({
        ...item,
        x: item.cellX,
        y: item.cellY,
        type: 'placed'
      });
    }
  });
  
  // Add special items
  specialItems.forEach(item => {
    if (item.type === 'label' && item.cellX !== undefined && item.cellY !== undefined) {
      allItems.push({
        ...item,
        x: item.cellX,
        y: item.cellY,
        type: 'special'
      });
    } else if (item.type === 'measurement') {
      // Add both start and end points for measurements
      if (item.startCellX !== undefined && item.startCellY !== undefined) {
        allItems.push({
          ...item,
          x: item.startCellX,
          y: item.startCellY,
          type: 'special',
          measurementPoint: 'start'
        });
      }
      if (item.endCellX !== undefined && item.endCellY !== undefined) {
        allItems.push({
          ...item,
          x: item.endCellX,
          y: item.endCellY,
          type: 'special',
          measurementPoint: 'end'
        });
      }
    }
  });
  
  if (allItems.length === 0) return [];
  
  // Distance-based clustering algorithm
  const groups = [];
  const assigned = new Set();
  
  // Helper function to calculate maximum distance between two items (Chebyshev distance)
  const calculateDistance = (item1, item2) => {
    return Math.max(
      Math.abs(item1.x - item2.x),
      Math.abs(item1.y - item2.y)
    );
  };
  
  // For each unassigned item, create a new group and find all items within distance
  allItems.forEach((item, index) => {
    if (assigned.has(index)) return;
    
    const group = [];
    const toProcess = [index];
    
    // Process all items that should be in this group
    while (toProcess.length > 0) {
      const currentIndex = toProcess.pop();
      
      if (assigned.has(currentIndex)) continue;
      
      assigned.add(currentIndex);
      group.push(allItems[currentIndex]);
      
      // Find all unassigned items within 5 spaces of this item
      allItems.forEach((otherItem, otherIndex) => {
        if (assigned.has(otherIndex) || toProcess.includes(otherIndex)) return;
        
        const distance = calculateDistance(allItems[currentIndex], otherItem);
        
        // If within 5 spaces, add to this group
        if (distance <= 5) {
          toProcess.push(otherIndex);
        }
      });
    }
    
    if (group.length > 0) {
      groups.push(group);
    }
  });
  
  return groups;
};

/**
 * Calculate bounding box for a group with padding, make it square, and scale to target width
 * @param {Array} group - Group of connected items
 * @param {Number} cellSize - Size of each grid cell in pixels
 * @returns {Object} Bounding box with dimensions, scaling, and translation info
 */
const calculateBoundingBox = (group, cellSize = 40) => {
  if (group.length === 0) return null;
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  // Find actual bounds of all items in group
  group.forEach(item => {
    minX = Math.min(minX, item.x);
    maxX = Math.max(maxX, item.x);
    minY = Math.min(minY, item.y);
    maxY = Math.max(maxY, item.y);
  });
  
  // Add 1 square padding on each side
  const paddedMinX = minX - 1;
  const paddedMaxX = maxX + 1;
  const paddedMinY = minY - 1;
  const paddedMaxY = maxY + 1;
  
  // Calculate dimensions
  const width = paddedMaxX - paddedMinX + 1;
  const height = paddedMaxY - paddedMinY + 1;
  
  // Make it square by using the larger dimension
  let size = Math.max(width, height);
  
  // FIXED: Grid alignment logic - prevent fractional positions
  const extraX = (size - width) / 2;
  const extraY = (size - height) / 2;
  
  // Check if centering would create fractional grid positions
  if (extraX % 1 !== 0 || extraY % 1 !== 0) {
    // If we'd get fractional positions, add 1 to size to avoid them
    size += 1;
  }
  
  // Recalculate with the adjusted size (should now be integer positions)
  const finalExtraX = (size - width) / 2;
  const finalExtraY = (size - height) / 2;
  
  // Ensure we have integer positions by flooring the extras
  const integerExtraX = Math.floor(finalExtraX);
  const integerExtraY = Math.floor(finalExtraY);
  
  const finalMinX = paddedMinX - integerExtraX;
  const finalMinY = paddedMinY - integerExtraY;
  
  // SCALING LOGIC: Calculate scale factor to match target width
  const naturalPixelSize = size * cellSize;
  const scaleFactor = TARGET_CANVAS_WIDTH / naturalPixelSize;
  const scaledCellSize = cellSize * scaleFactor;
  const finalPixelSize = size * scaledCellSize; // Should equal TARGET_CANVAS_WIDTH
  
  return {
    minX: finalMinX,
    minY: finalMinY,
    size: size,
    pixelSize: finalPixelSize,
    cellSize: scaledCellSize, // Use scaled cell size
    scaleFactor: scaleFactor,
    // Translation function to convert grid coords to canvas coords (using scaled cell size)
    translateX: (gridX) => (gridX - finalMinX) * scaledCellSize,
    translateY: (gridY) => (gridY - finalMinY) * scaledCellSize
  };
};

/**
 * Generate HTML for a single canvas group
 * @param {Array} group - Group of connected items
 * @param {Object} boundingBox - Bounding box info
 * @param {Array} allPlacedItems - Original placed items for sequence numbers
 * @param {Array} allSpecialItems - Original special items for measurements
 * @returns {String} HTML for the canvas
 */
const generateCanvasHTML = (group, boundingBox, allPlacedItems, allSpecialItems) => {
  if (!boundingBox) return '';
  
  const { pixelSize, cellSize, translateX, translateY, scaleFactor } = boundingBox;
  
  // Helper to get access door sequence number
  const getAccessDoorSeqNum = (item) => {
    return allPlacedItems
      .filter(it => 
        it.category && 
        it.category.toLowerCase() === "access doors" && 
        it.name.toLowerCase() === item.name.toLowerCase()
      )
      .findIndex(it => it.id === item.id) + 1;
  };
  
  // Calculate scaled font sizes based on scale factor
  const baseFontSize = 12;
  const labelFontSize = Math.max(8, Math.min(16, baseFontSize * scaleFactor));
  const smallFontSize = Math.max(6, Math.min(12, 10 * scaleFactor));
  
  // Separate placed items and special items
  const placedInGroup = group.filter(item => item.type === 'placed');
  const specialInGroup = group.filter(item => item.type === 'special');
  
  // Get unique measurements that are in this group
  const measurementIds = new Set();
  specialInGroup.forEach(item => {
    if (item.type === 'measurement') {
      measurementIds.add(item.id);
    }
  });
  
  const uniqueMeasurements = allSpecialItems.filter(item => 
    item.type === 'measurement' && measurementIds.has(item.id)
  );
  
  // Generate placed items HTML
  const placedItemsHTML = placedInGroup.map(item => {
    const left = translateX(item.x);
    const top = translateY(item.y);
    const isAccessDoor = item.category && item.category.toLowerCase() === "access doors";
    const seqNum = isAccessDoor ? getAccessDoorSeqNum(item) : null;
    
    if (item.type === "connectors") {
      return `
        <div style="position: absolute; left: ${left}px; top: ${top}px; width: ${cellSize}px; height: ${cellSize}px;">
          <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            <div style="width: 100%; height: 100%; border: ${Math.max(2, 4 * scaleFactor)}px solid ${item.borderColor}; display: flex; align-items: center; justify-content: center; font-size: ${labelFontSize}px; color: ${item.borderColor}; background: #fff;">
              ${item.pairNumber}
            </div>
          </div>
        </div>
      `;
    }
    
    return `
      <div style="position: absolute; left: ${left}px; top: ${top}px; width: ${cellSize}px; height: ${cellSize}px;">
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
          ${item.image ? `
            <img src="${item.image}" alt="${item.name}" style="max-width: 100%; max-height: 100%;" />
          ` : `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: ${smallFontSize}px; color: #000;">
              ${item.name}
            </div>
          `}
          ${isAccessDoor && seqNum ? `
            <div style="position: absolute; top: ${Math.max(1, 2 * scaleFactor)}px; right: ${Math.max(1, 2 * scaleFactor)}px; background: rgba(255,255,255,0.8); padding: ${Math.max(1, 2 * scaleFactor)}px ${Math.max(2, 4 * scaleFactor)}px; border-radius: ${Math.max(2, 4 * scaleFactor)}px; font-size: ${smallFontSize}px;">
              ${seqNum}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  // Generate special items HTML
  const specialItemsHTML = allSpecialItems
    .filter(item => measurementIds.has(item.id) || 
      (item.type === 'label' && specialInGroup.some(g => g.id === item.id)))
    .map(item => {
      if (item.type === 'label') {
        const left = translateX(item.cellX);
        const top = translateY(item.cellY);
        return `
          <div style="position: absolute; left: ${left}px; top: ${top}px; transform: translate(-50%, -50%); background: rgba(255,255,255,0.8); padding: ${Math.max(1, 2 * scaleFactor)}px ${Math.max(2, 4 * scaleFactor)}px; border: 1px solid #ccc; border-radius: ${Math.max(2, 4 * scaleFactor)}px; pointer-events: none; font-size: ${labelFontSize}px;">
            ${item.labelText}
          </div>
        `;
      } else if (item.type === 'measurement') {
        const startLeft = translateX(item.startCellX);
        const startTop = translateY(item.startCellY);
        const endLeft = translateX(item.endCellX);
        const endTop = translateY(item.endCellY);
        
        const leftX = Math.min(startLeft, endLeft);
        const rightX = Math.max(startLeft, endLeft) + cellSize;
        const topY = Math.min(startTop, endTop);
        const bottomY = Math.max(startTop, endTop) + cellSize;
        const midX = (leftX + rightX) / 2;
        const midY = (topY + bottomY) / 2;
        
        return `
          <div style="position: absolute; left: ${startLeft}px; top: ${startTop}px; width: ${cellSize}px; height: ${cellSize}px; display: flex; align-items: center; justify-content: center;">
            <img src="${item.startImage}" alt="Start" style="width: 100%; height: 100%; transform: rotate(${item.rotation}deg);" />
          </div>
          <div style="position: absolute; left: ${endLeft}px; top: ${endTop}px; width: ${cellSize}px; height: ${cellSize}px; display: flex; align-items: center; justify-content: center;">
            <img src="${item.endImage}" alt="End" style="width: 100%; height: 100%; transform: rotate(${item.rotation}deg);" />
          </div>
          <div style="position: absolute; left: ${midX}px; top: ${midY}px; transform: translate(-50%, -50%); background: rgba(255,255,255,0.8); padding: ${Math.max(1, 2 * scaleFactor)}px ${Math.max(2, 4 * scaleFactor)}px; border: 1px solid #ccc; border-radius: ${Math.max(2, 4 * scaleFactor)}px; pointer-events: none; font-size: ${labelFontSize}px;">
            ${item.numericValue}
          </div>
        `;
      }
      return '';
    }).join('');
  
  return `
    <div style="width: ${pixelSize}px; height: ${pixelSize}px; border: 2px solid #3B3B3B; position: relative; margin: 20px auto; background-position: -0.5px -0.5px; background-image: linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px); background-size: ${cellSize}px ${cellSize}px; display: block;">
      ${placedItemsHTML}
      ${specialItemsHTML}
    </div>
  `;
};

/**
 * Main function to generate all schematic canvases
 * @param {Array} placedItems - Array of placed items
 * @param {Array} specialItems - Array of special items
 * @param {Number} cellSize - Size of each grid cell (default: 40)
 * @returns {String} HTML for all canvases
 */
export const generateAllCanvases = (placedItems = [], specialItems = [], cellSize = 40) => {
  if (!placedItems.length && !specialItems.length) {
    return '<p style="text-align: center; color: #666; font-style: italic;">No items placed on schematic.</p>';
  }
  
  // Find connected groups using distance-based clustering
  const groups = findConnectedGroups(placedItems, specialItems);
  
  if (groups.length === 0) {
    return '<p style="text-align: center; color: #666; font-style: italic;">No items placed on schematic.</p>';
  }
  
  // Generate HTML for each group
  const canvasesHTML = groups.map((group, index) => {
    const boundingBox = calculateBoundingBox(group, cellSize);
    const canvasHTML = generateCanvasHTML(group, boundingBox, placedItems, specialItems);
    
    // Add title if multiple groups
    const title = groups.length > 1 ? 
      `<h4 style="text-align: center; margin: 20px 0 10px 0;">Schematic Area ${index + 1}</h4>` : 
      '';
    
    return title + canvasHTML;
  }).join('');
  
  return `
    <div style="text-align: center;">
      ${canvasesHTML}
    </div>
  `;
};

export default generateAllCanvases;