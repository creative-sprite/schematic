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

    // Helper function to check if field has data
    const fieldHasData = (value) => {
        return value !== null && value !== undefined;
    };

    // Custom CSS for highlighting fields with data
    const customStyles = `
        .p-dropdown-has-data .p-dropdown {
            border-color: var(--primary-color) !important;
        }
    `;

    return (
        <>
            <style>{customStyles}</style>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                <div
                    className={
                        fieldHasData(selectedPrimaryContactIndex)
                            ? "p-dropdown-has-data"
                            : ""
                    }
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
            </div>
        </>
    );
}
