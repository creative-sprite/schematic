// components/kitchenSurvey/save/savePDF/sections/schematicSection.js

import { generateAllCanvases } from './schematicCanvasGenerator';

/**
 * Generates the schematic items section of the PDF
 * @param {Object} data - Survey data
 * @returns {String} HTML for the schematic section
 */
export const generateSchematicSection = (data) => {
  const { 
    placedItems = [], 
    specialItems = [],
    accessDoorSelections = {},
    flexiDuctSelections = {},
    schematic = {},
    gridSpaces = 26,
    cellSize = 40
  } = data || {};

  // Helper function to check if a field has meaningful content
  const hasContent = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  };

  // Extract placed items from schematic object if not directly available
  const items = placedItems.length > 0 ? placedItems : (schematic?.placedItems || []);
  const specials = specialItems.length > 0 ? specialItems : (schematic?.specialItems || []);
  const doorSelections = Object.keys(accessDoorSelections).length > 0 ? accessDoorSelections : (schematic?.accessDoorSelections || {});
  const flexiSelections = Object.keys(flexiDuctSelections).length > 0 ? flexiDuctSelections : (schematic?.flexiDuctSelections || {});
  const finalCellSize = schematic?.cellSize || cellSize;

  // Check if any schematic content exists
  const hasSchematicItems = hasContent(items);
  const hasSpecialItems = hasContent(specials);
  const hasDoorSelections = Object.keys(doorSelections).length > 0;
  const hasFlexiSelections = Object.keys(flexiSelections).length > 0;

  // If no schematic content, return empty string
  if (!hasSchematicItems && !hasSpecialItems && !hasDoorSelections && !hasFlexiSelections) {
    return '';
  }

  // Generate the visual canvases
  const canvasesHTML = generateAllCanvases(items, specials, finalCellSize);

  // Create display list similar to SchematicList.jsx logic for the legend
  const createDisplayList = () => {
    const aggregated = {};
    const nonAggregated = [];
    const seenConnectors = new Set();

    items.forEach((item) => {
      if (item.type === "connectors") {
        if (seenConnectors.has(item.pairNumber)) {
          return;
        }
        seenConnectors.add(item.pairNumber);
        nonAggregated.push(item);
        return;
      }

      // Group items with the same aggregation key if aggregateEntry is true
      if (item.aggregateEntry) {
        // Use item name and original ID as a composite key
        const key = (item.name?.toLowerCase() || 'unnamed') + "-" + (item.originalId || item.id);

        if (!aggregated[key]) {
          aggregated[key] = item;
        }
      } else {
        nonAggregated.push(item);
      }
    });

    return [...Object.values(aggregated), ...nonAggregated];
  };

  const displayList = createDisplayList();

  // Group display items by category
  const groupedItems = {};
  displayList.forEach(item => {
    const category = item.category || 'Other';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  // Helper function to get access door sequence number
  const getAccessDoorSeqNum = (item) => {
    return items
      .filter(it => 
        it.category && 
        it.category.toLowerCase() === "access doors" && 
        it.name.toLowerCase() === item.name.toLowerCase()
      )
      .findIndex(it => it.id === item.id) + 1;
  };

  // Helper function to format dimensions
  const formatDimensions = (item) => {
    if (!item.requiresDimensions) return '';
    
    const dims = [];
    if (item.length) dims.push(`L:${item.length}`);
    if (item.width) dims.push(`W:${item.width}`);
    if (item.height) dims.push(`H:${item.height}`);
    if (item.inaccessible) dims.push(`Inac:${item.inaccessible}`);
    
    return dims.length > 0 ? dims.join(' × ') : '';
  };

  // Helper function to render item cards similar to SchematicListGrid
  const renderItemCard = (item) => {
    const isAccessDoor = item.category && item.category.toLowerCase() === "access doors";
    const seqNum = isAccessDoor ? getAccessDoorSeqNum(item) : null;
    const dimensions = formatDimensions(item);
    const selectedDoor = doorSelections[item.id];
    const flexiSelectionList = flexiSelections[item.id] || [];

    // Handle different item types like in SchematicListGrid
    if (item.type === "connectors") {
      return `
        <div style="display: flex; align-items: center; margin: 8px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <div style="margin-right: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 4px solid ${item.borderColor || '#000'}; background: #fff; color: ${item.borderColor || '#000'}; font-weight: bold;">
            ${item.pairNumber || '?'}
          </div>
          <div>
            <div style="font-weight: bold;">${item.name || 'Connectors'}</div>
            <div style="font-size: 0.9rem; color: #666;">Pair ${item.pairNumber || '?'}</div>
          </div>
        </div>
      `;
    }

    return `
      <div style="margin: 8px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; position: relative;">
        <div style="display: flex; align-items: center; margin-bottom: 4px;">
          ${item.image ? `
            <img src="${item.image}" alt="${item.name || 'Item'}" width="30" height="30" style="margin-right: 8px;" />
          ` : `
            <div style="width: 30px; height: 30px; margin-right: 8px; background: #f0f0f0; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px;">
              N/A
            </div>
          `}
          <div style="flex: 1;">
            <div style="font-weight: bold;">${item.name || 'Unnamed Item'}</div>
            ${dimensions ? `<div style="font-size: 0.9rem; color: #666;">Dimensions: ${dimensions}</div>` : ''}
          </div>
          ${isAccessDoor && seqNum ? `
            <div style="position: absolute; top: 2px; right: 2px; background: rgba(255,255,255,0.8); padding: 2px 4px; border-radius: 4px; font-size: 10px; border: 1px solid #ccc;">
              ${seqNum}
            </div>
          ` : ''}
        </div>
        
        ${selectedDoor ? `
          <div style="margin-top: 8px; padding: 6px; border-radius: 4px; border-left: 3px solid #F9C400;">
            <div style="font-weight: bold; font-size: 0.9rem;">Selected Door:</div>
            <div style="font-size: 0.85rem;">${selectedDoor.name || 'Unknown Door'}</div>
            ${selectedDoor.type ? `<div style="font-size: 0.8rem; color: #666;">Type: ${selectedDoor.type}</div>` : ''}
            ${selectedDoor.dimensions ? `<div style="font-size: 0.8rem; color: #666;">${selectedDoor.dimensions}</div>` : ''}
          </div>
        ` : ''}
        
        ${flexiSelectionList.length > 0 ? `
          <div style="margin-top: 8px; padding: 6px; border-radius: 4px; border-left: 3px solid #F9C400;">
            <div style="font-weight: bold; font-size: 0.9rem;">Flexi-Duct (${flexiSelectionList.length}):</div>
            ${flexiSelectionList.map(selection => `
              <div style="font-size: 0.8rem; margin: 2px 0;">
                • ${selection.name || 'Unknown Product'}
                ${selection.diameter ? ` (Dia: ${selection.diameter})` : ''}
                ${selection.quantity > 1 ? ` × ${selection.quantity}` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  };

  // Helper function to render special items
  const renderSpecialItems = () => {
    if (!hasContent(specials)) return '';

    const measurements = specials.filter(item => item.type === 'measurement');
    const labels = specials.filter(item => item.type === 'label');

    let specialHtml = '';

    if (measurements.length > 0) {
      specialHtml += `
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Measurements</h4>
        ${measurements.map(item => `
          <div style="display: flex; align-items: center; margin: 6px 0; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <div style="margin-right: 8px; display: flex; gap: 4px;">
              <img src="${item.startImage || '/start.svg'}" alt="Start" width="20" height="20" style="transform: rotate(${item.rotation || 0}deg);" />
              <img src="${item.endImage || '/end.svg'}" alt="End" width="20" height="20" style="transform: rotate(${item.rotation || 0}deg);" />
            </div>
            <div>
              <div style="font-weight: bold;">Measurement: ${item.numericValue || 'N/A'}</div>
              <div style="font-size: 0.8rem; color: #666;">From (${item.startCellX || 0},${item.startCellY || 0}) to (${item.endCellX || 0},${item.endCellY || 0})</div>
            </div>
          </div>
        `).join('')}
      `;
    }

    if (labels.length > 0) {
      specialHtml += `
        <h4 style="margin-top: 20px; margin-bottom: 10px;">Labels</h4>
        ${labels.map(item => `
          <div style="display: flex; align-items: center; margin: 6px 0; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <div style="margin-right: 8px; width: 30px; height: 20px; border: 1px solid #ccc; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px;">
              Label
            </div>
            <div>
              <div style="font-weight: bold;">"${item.labelText || 'Empty Label'}"</div>
              <div style="font-size: 0.8rem; color: #666;">Position: (${item.cellX || 0},${item.cellY || 0})</div>
            </div>
          </div>
        `).join('')}
      `;
    }

    return specialHtml;
  };

  return `
    <!-- Schematic Visual and Legend -->
    <div class="p-card">
        <div class="p-card-body">
            <div class="p-card-title">Schematic</div>
            <div class="p-card-content">
                
                <!-- Visual Schematic Canvases -->
                ${canvasesHTML}
                
                <!-- Items Legend -->
                <div style="margin-top: 30px;">
                    <h3 style="margin-bottom: 15px; color: #333; border-bottom: 2px solid #F9C400; padding-bottom: 4px;">
                        Schematic Legend
                    </h3>

                    ${Object.keys(groupedItems).length > 0 ? `
                      ${Object.entries(groupedItems).map(([category, categoryItems]) => `
                        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #333;">
                          ${category} (${categoryItems.length})
                        </h4>
                        <div style="margin-left: 10px;">
                          ${categoryItems.map(item => renderItemCard(item)).join('')}
                        </div>
                      `).join('')}
                    ` : ''}
                    
                    ${renderSpecialItems()}
                    
                    ${Object.keys(groupedItems).length === 0 && !hasContent(specials) ? `
                      <p style="color: #666; font-style: italic;">No items were placed on the schematic.</p>
                    ` : ''}
                </div>
                
            </div>
        </div>
    </div>
  `;
};

export default generateSchematicSection;