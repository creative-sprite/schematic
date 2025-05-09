// components/kitchenSurvey/surveyInfo/primaryContactDetails/PrimaryContactDropdown.jsx
import React from "react";
import { Dropdown } from "primereact/dropdown";

export default function PrimaryContactDropdown({
    contacts,
    selectedPrimaryContactIndex,
    handlePrimaryContactSelect,
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
                value={selectedPrimaryContactIndex}
                options={options}
                onChange={(e) => handlePrimaryContactSelect(e.value)}
                placeholder="Select Primary Contact"
                style={{ minWidth: "250px", height: "40px" }}
                disabled={!siteDetails || !siteDetails._id || isSaving}
            />
        </div>
    );
}
