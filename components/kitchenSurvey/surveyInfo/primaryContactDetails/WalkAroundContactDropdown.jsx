// components/kitchenSurvey/surveyInfo/primaryContactDetails/WalkAroundContactDropdown.jsx
import React from "react";
import { Dropdown } from "primereact/dropdown";

export default function WalkAroundContactDropdown({
    contacts,
    selectedWalkAroundContactIndex,
    handleWalkAroundContactSelect,
    isSaving,
    siteDetails,
}) {
    const contactsWithIndex = contacts.map((c, index) => ({ ...c, index }));
    const options = contactsWithIndex.map((c) => ({
        label: `${c.contactFirstName} ${c.contactLastName}`,
        value: c.index,
    }));

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "10px",
            }}
        >
            <Dropdown
                value={selectedWalkAroundContactIndex}
                options={options}
                onChange={(e) => handleWalkAroundContactSelect(e.value)}
                placeholder="Select Walk Around Contact"
                style={{ minWidth: "250px", height: "40px" }}
                disabled={!siteDetails || !siteDetails._id || isSaving}
            />
        </div>
    );
}
