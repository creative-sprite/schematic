# Survey PDF Template Variables Reference

This document provides a comprehensive reference for all specific variables available in the PDF generation templates. Each section includes exact code snippets showing how to access and display each piece of data from the survey.

## Survey Identification & Metadata

### Survey Type (from operations.typeOfCooking)

```javascript
${operations?.typeOfCooking || "Kitchen Survey"}
```

Displays the exact type of survey conducted (e.g., "Kitchen Deep Clean", "Extraction Duct Maintenance"). Falls back to "Kitchen Survey" if not specified.

### Survey Reference Number

```javascript
${refValue || "N/A"}
```

Displays the unique reference number assigned to this survey. Falls back to "N/A" if no reference number exists.

### Survey Date

```javascript
${new Date(surveyDate || Date.now()).toLocaleDateString()}
```

Formats and displays the date when the survey was conducted. Uses the current date as fallback if surveyDate is missing.

### PDF Generation Date (Current Date)

```javascript
${new Date().toLocaleString()}
```

Displays the current date and time when the PDF is being generated, used in footers or as "Generated on" information.

## Site Details

### Site Name (From siteDetails object)

```javascript
${siteDetails?.siteName || siteDetails?.name || "N/A"}
```

Displays the site name, checking both siteName and name properties of the siteDetails object. Falls back to "N/A" if neither exists.

### Site Address (From siteDetails object)

```javascript
${siteDetails?.address || "N/A"}
```

Displays the physical address of the surveyed site. Falls back to "N/A" if address is missing.

### Operational Hours - Weekdays (From operations.operationalHours)

```javascript
${operations?.operationalHours?.weekdays ?
  `Weekdays ${operations.operationalHours.weekdays.start || "N/A"} - ${operations.operationalHours.weekdays.end || "N/A"}` : ""}
```

Displays the weekday operational hours range, if specified in the operations.operationalHours.weekdays object.

### Operational Hours - Weekend (From operations.operationalHours)

```javascript
${operations?.operationalHours?.weekend ?
  `Weekend ${operations.operationalHours.weekend.start || "N/A"} - ${operations.operationalHours.weekend.end || "N/A"}` : ""}
```

Displays the weekend operational hours range, if specified in the operations.operationalHours.weekend object.

## Contact Information

### Primary Contact Full Name (From contacts array)

```javascript
${primaryContact?.contactFirstName || ""} ${primaryContact?.contactLastName || ""}
```

Combines the first and last name of the primary contact person. The primaryContact object is selected from the contacts array based on primaryContactIndex.

### Primary Contact Phone Number

```javascript
${primaryContact?.number || ""}
```

Displays the phone number of the primary contact. Shows nothing if number is missing.

### Primary Contact Email

```javascript
${primaryContact?.email || ""}
```

Displays the email address of the primary contact. Shows nothing if email is missing.

### Primary Contact Combined Details

```javascript
${primaryContact?.number || ""} ${primaryContact?.email ? `/ ${primaryContact.email}` : ""}
```

Shows the phone number and email address together, separated by a slash if both exist.

## Structure Details

### Structure ID

```javascript
${structureId || "N/A"}
```

Displays the ID or reference code of the structure being surveyed. Falls back to "N/A" if not specified.

### Structure Dimensions - Combined

```javascript
${structureDimensions?.length || "N/A"}m × ${structureDimensions?.width || "N/A"}m × ${structureDimensions?.height || "N/A"}m
```

Displays all three dimensions of the structure (length, width, height) in a single line with proper units.

### Structure Dimensions - Individual Values

```javascript
Length: ${structureDimensions?.length || "N/A"}m
Width: ${structureDimensions?.width || "N/A"}m
Height: ${structureDimensions?.height || "N/A"}m
```

Displays each dimension value individually with labels.

### Structure Components Table (From structureSelectionData array)

```javascript
${structureSelectionData && structureSelectionData.length > 0 ?
  structureSelectionData.map(item => `
    <tr>
      <td>${item.type || ""}</td>
      <td>${item.item || ""}</td>
      <td>${item.grade || ""}</td>
    </tr>`).join("")
  : ""}
```

Generates table rows for each structure component, displaying type, item name, and grade for each. This iterates through the structureSelectionData array.

### Structure Comments (From structureComments field)

```javascript
${structureComments ? `
  <div class="comment">
    <strong>Comments:</strong><br>
    ${structureComments}
  </div>` : ""}
```

Displays any comments about the structure, with proper formatting. Shows nothing if structureComments is empty.

## Equipment Data

### Equipment Items Table (From equipmentEntries array)

```javascript
${equipmentEntries && equipmentEntries.length > 0 ?
  equipmentEntries.map(item => `
    <tr>
      <td>${item.subcategory || "N/A"}</td>
      <td>${item.name || item.item || "N/A"}</td>
      <td class="text-center">${item.quantity || 1}</td>
    </tr>`).join("")
  : "<p>No equipment items specified</p>"}
```

Generates table rows for each equipment item, displaying subcategory, name/item, and quantity. Falls back to a message if no equipment items exist.

### Equipment Total Calculation (From equipmentEntries array)

```javascript
const equipmentTotal = (equipmentEntries || []).reduce(
    (total, item) => total + (item.price || 0),
    0
);
```

Calculates the total cost of all equipment items by summing the price property of each item in the equipmentEntries array.

### Specialist Equipment Table (From specialistEquipmentData array)

```javascript
${specialistEquipmentData && specialistEquipmentData.length > 0 ?
  specialistEquipmentData.map(item => `
    <tr>
      <td>${item.name || item.item || "Unnamed Item"}</td>
      <td>${item.category || "N/A"}</td>
    </tr>`).join("")
  : ""}
```

Generates table rows for specialist equipment items, displaying the name/item and category. This iterates through the specialistEquipmentData array.

## Canopy Information

### Canopy Details (From canopyEntries array)

```javascript
${canopyEntries && canopyEntries.length > 0 ?
  canopyEntries.map((entry, index) => `
    <div class="mb-10">
      <h3>Canopy ${index + 1}</h3>

      <!-- Canopy Type, Grade, Dimensions -->
      ${entry.canopy ? `
      <div class="info-row">
        <span class="label">Type:</span>
        <span class="data">${entry.canopy.type || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="label">Grade:</span>
        <span class="data">${entry.canopy.grade || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="label">Dimensions:</span>
        <span class="data">
          ${entry.canopy.length || "N/A"}m ×
          ${entry.canopy.width || "N/A"}m ×
          ${entry.canopy.height || "N/A"}m
        </span>
      </div>` : ""}

      <!-- Filter Type and Grade -->
      ${entry.filter ? `
      <div class="info-row">
        <span class="label">Filter Type:</span>
        <span class="data">${entry.filter.type || "N/A"}</span>
      </div>
      <div class="info-row">
        <span class="label">Filter Grade:</span>
        <span class="data">${entry.filter.grade || "N/A"}</span>
      </div>` : ""}
    </div>`).join("")
  : "<p>No canopy entries specified</p>"}
```

Displays detailed information for each canopy, including type, grade, dimensions, and filter details. This iterates through each entry in the canopyEntries array.

### Canopy Comments (From canopyComments object)

```javascript
${canopyComments && Object.keys(canopyComments).length > 0 ?
  Object.entries(canopyComments)
    .filter(([key, comment]) => comment && comment.trim().length > 0)
    .map(([key, comment]) => `
      <div class="comment">
        <strong>${key}:</strong> ${comment}
      </div>`).join("")
  : ""}
```

Displays all non-empty comments about canopy components. This processes the canopyComments object, which has comment categories as keys and the actual comments as values.

## Price Breakdown Items

### Structure Total Price

```javascript
${structureTotal > 0 ? `
  <tr>
    <td class="price-label">Structure Total</td>
    <td class="price-value">£${structureTotal.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the total cost for structure components if greater than zero.

### Equipment Total Price

```javascript
${equipmentTotal > 0 ? `
  <tr>
    <td class="price-label">Equipment</td>
    <td class="price-value">£${equipmentTotal.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the total cost for equipment items if greater than zero.

### Canopy Total Price

```javascript
${canopyTotal > 0 ? `
  <tr>
    <td class="price-label">Canopy</td>
    <td class="price-value">£${canopyTotal.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the total cost for canopy items if greater than zero.

### Access Door Price

```javascript
${accessDoorPrice > 0 ? `
  <tr>
    <td class="price-label">Access Door</td>
    <td class="price-value">£${accessDoorPrice.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the cost for access doors if greater than zero.

### Ventilation Price

```javascript
${ventilationPrice > 0 ? `
  <tr>
    <td class="price-label">Ventilation</td>
    <td class="price-value">£${ventilationPrice.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the cost for ventilation components if greater than zero.

### Air Supply/Extract Price

```javascript
${airPrice > 0 ? `
  <tr>
    <td class="price-label">Air Supply/Extract</td>
    <td class="price-value">£${airPrice.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the cost for air supply/extract components if greater than zero.

### Fan Parts Price

```javascript
${fanPartsPrice > 0 ? `
  <tr>
    <td class="price-label">Fan Parts</td>
    <td class="price-value">£${fanPartsPrice.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the cost for fan parts if greater than zero.

### Air In/Ex Total Price

```javascript
${airInExTotal > 0 ? `
  <tr>
    <td class="price-label">Air In/Ex</td>
    <td class="price-value">£${airInExTotal.toFixed(2)}</td>
  </tr>` : ""}
```

Displays the total cost for air in/ex components if greater than zero.

### Schematic Items Total Price

```javascript
${schematicItemsTotal ? `
  <tr>
    <td class="price-label">Schematic Items</td>
    <td class="price-value">£${(typeof schematicItemsTotal === "object" ? schematicItemsTotal.overall || 0 : schematicItemsTotal || 0).toFixed(2)}</td>
  </tr>` : ""}
```

Displays the total cost for schematic items if available. Handles both object format (with .overall property) and simple numeric format.

### Subtotal Line

```javascript
<tr class="subtotal-row">
    <td class="price-label">Subtotal</td>
    <td class="price-value">£${subtotal.toFixed(2)}</td>
</tr>
```

Displays the subtotal amount before any modifications are applied. The subtotal value must be calculated separately.

### Modification Percentage Line

```javascript
${modify ? `
  <tr>
    <td class="price-label">Modification (${modify > 0 ? "+" : ""}${modify}%)</td>
    <td class="price-value">${modify > 0 ? "+" : ""}£${((subtotal * modify) / 100).toFixed(2)}</td>
  </tr>` : ""}
```

Displays the modification percentage and calculated value if a modification (modify) is specified.

### Grand Total Line

```javascript
<tr class="total-row">
    <td class="price-label">GRAND TOTAL</td>
    <td class="price-value">£${grandTotal.toFixed(2)}</td>
</tr>
```

Displays the final total amount after all modifications. The grandTotal value must be calculated separately.

## Operations Information

### Type of Cooking (From operations object)

```javascript
${operations?.typeOfCooking ? `
  <div class="info-row">
    <span class="label">Type of Cooking:</span>
    <span class="data">${operations.typeOfCooking}</span>
  </div>` : ""}
```

Displays the type of cooking performed at the site (from operations.typeOfCooking).

### Covers Per Day (From operations object)

```javascript
${operations?.coversPerDay ? `
  <div class="info-row">
    <span class="label">Covers Per Day:</span>
    <span class="data">${operations.coversPerDay}</span>
  </div>` : ""}
```

Displays the number of meals served per day (from operations.coversPerDay).

### Best Service Time (From operations object)

```javascript
${operations?.bestServiceTime ? `
  <div class="info-row">
    <span class="label">Best Service Time:</span>
    <span class="data">${operations.bestServiceTime}</span>
  </div>` : ""}
```

Displays the optimal time for service (from operations.bestServiceTime).

### Best Service Day (From operations object)

```javascript
${operations?.bestServiceDay ? `
  <div class="info-row">
    <span class="label">Best Service Day:</span>
    <span class="data">${operations.bestServiceDay}</span>
  </div>` : ""}
```

Displays the optimal day for service (from operations.bestServiceDay).

### Service Due Date (From operations object)

```javascript
${operations?.serviceDue ? `
  <div class="info-row">
    <span class="label">Service Due:</span>
    <span class="data">${new Date(operations.serviceDue).toLocaleDateString()}</span>
  </div>` : ""}
```

Displays the date when service is due (from operations.serviceDue), formatted as a localized date string.

## Access Requirements

### Induction Needed (From access object)

```javascript
${access?.inductionNeeded ? `
  <div class="info-row">
    <span class="label">Induction Needed:</span>
    <span class="data">${access.inductionNeeded}</span>
  </div>` : ""}
```

Displays whether induction is required (from access.inductionNeeded).

### Roof Access (From access object)

```javascript
${access?.roofAccess ? `
  <div class="info-row">
    <span class="label">Roof Access:</span>
    <span class="data">${access.roofAccess}</span>
  </div>` : ""}
```

Displays roof access details (from access.roofAccess).

### Permit to Work (From access object)

```javascript
${access?.permitToWork ? `
  <div class="info-row">
    <span class="label">Permit to Work:</span>
    <span class="data">${access.permitToWork}</span>
  </div>` : ""}
```

Displays whether a permit to work is required (from access.permitToWork).

### DBS Check (From access object)

```javascript
${access?.dbs ? `
  <div class="info-row">
    <span class="label">DBS Check:</span>
    <span class="data">${access.dbs}</span>
  </div>` : ""}
```

Displays DBS check requirements (from access.dbs).

### Permit (From access object)

```javascript
${access?.permit ? `
  <div class="info-row">
    <span class="label">Permit:</span>
    <span class="data">${access.permit}</span>
  </div>` : ""}
```

Displays permit requirements (from access.permit).

## Ventilation Information

### Obstructions (From ventilation object)

```javascript
${ventilation?.obstructionsToggle ? `
  <div class="info-row">
    <span class="label">Obstructions:</span>
    <span class="data">${ventilation.obstructionsToggle}</span>
  </div>` : ""}
```

Displays whether there are obstructions (from ventilation.obstructionsToggle).

### Damage (From ventilation object)

```javascript
${ventilation?.damageToggle ? `
  <div class="info-row">
    <span class="label">Damage:</span>
    <span class="data">${ventilation.damageToggle}</span>
  </div>` : ""}
```

Displays whether there is damage (from ventilation.damageToggle).

### Inaccessible Areas (From ventilation object)

```javascript
${ventilation?.inaccessibleAreasToggle ? `
  <div class="info-row">
    <span class="label">Inaccessible Areas:</span>
    <span class="data">${ventilation.inaccessibleAreasToggle}</span>
  </div>` : ""}
```

Displays whether there are inaccessible areas (from ventilation.inaccessibleAreasToggle).

### Client Actions (From ventilation object)

```javascript
${ventilation?.clientActionsToggle ? `
  <div class="info-row">
    <span class="label">Client Actions:</span>
    <span class="data">${ventilation.clientActionsToggle}</span>
  </div>` : ""}
```

Displays whether client actions are required (from ventilation.clientActionsToggle).

### Ventilation Description (From ventilation object)

```javascript
${ventilation?.description ? `
  <div class="info-row">
    <span class="label">Description:</span>
    <span class="data">${ventilation.description}</span>
  </div>` : ""}
```

Displays the ventilation description (from ventilation.description).

## Notes Section

### General Comments (From notes object)

```javascript
${notes?.comments ? `
  <div class="comment">
    <strong>General Comments:</strong><br>
    ${notes.comments}
  </div>` : ""}
```

Displays general comments about the survey (from notes.comments).

### Previous Issues (From notes object)

```javascript
${notes?.previousIssues ? `
  <div class="comment">
    <strong>Previous Issues:</strong><br>
    ${notes.previousIssues}
  </div>` : ""}
```

Displays details of previous issues (from notes.previousIssues).

### Damage Notes (From notes object)

```javascript
${notes?.damage ? `
  <div class="comment">
    <strong>Damage:</strong><br>
    ${notes.damage}
  </div>` : ""}
```

Displays details of damage (from notes.damage).

### Inaccessible Areas Notes (From notes object)

```javascript
${notes?.inaccessibleAreas ? `
  <div class="comment">
    <strong>Inaccessible Areas:</strong><br>
    ${notes.inaccessibleAreas}
  </div>` : ""}
```

Displays details of inaccessible areas (from notes.inaccessibleAreas).

### Client Actions Notes (From notes object)

```javascript
${notes?.clientActions ? `
  <div class="comment">
    <strong>Client Actions:</strong><br>
    ${notes.clientActions}
  </div>` : ""}
```

Displays required client actions (from notes.clientActions).

## Schematic Information

### Schematic Layout (From schematicHtml variable)

```javascript
${schematicHtml ? `
  <div class="page-break"></div>
  <div class="p-card">
    <div class="p-card-body">
      <div class="p-card-title">Schematic Layout</div>
      <div class="p-card-content">
        <div class="schematic-container">
          ${schematicHtml}
        </div>
      </div>
    </div>
  </div>` : ""}
```

Includes the schematic layout HTML with proper formatting and page break. The schematicHtml variable contains the captured HTML of the schematic diagram.

## Required Calculation Functions

### Calculate Subtotal (All Price Components)

```javascript
const subtotal =
    (structureTotal || 0) +
    (equipmentTotal || 0) +
    (canopyTotal || 0) +
    (accessDoorPrice || 0) +
    (ventilationPrice || 0) +
    (airPrice || 0) +
    (fanPartsPrice || 0) +
    (airInExTotal || 0) +
    (typeof schematicItemsTotal === "object"
        ? schematicItemsTotal.overall || 0
        : schematicItemsTotal || 0);
```

Calculates the subtotal by adding all individual cost components. Handles the special case of schematicItemsTotal which can be either an object or a number.

### Calculate Grand Total (With Modification Percentage)

```javascript
const grandTotal = subtotal * (1 + (modify || 0) / 100);
```

Calculates the grand total by applying the modification percentage to the subtotal.

### Calculate Equipment Total (From equipmentEntries Array)

```javascript
const equipmentTotal = (equipmentEntries || []).reduce(
    (total, item) => total + (item.price || 0),
    0
);
```

Calculates the total cost of all equipment items by summing the price property of each item in the equipmentEntries array.
