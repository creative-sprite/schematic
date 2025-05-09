// components\kitchenSurvey\surveyInfo\AccessRequirements.jsx
"use client";
import React from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { DataView } from "primereact/dataview";
import ToggleWithInputField from "./accessRequirements/ToggleWithInputField";
import ToggleOnlyField from "./accessRequirements/ToggleOnlyField";
import InputOnlyField from "./accessRequirements/InputOnlyField";
import DropdownField from "./accessRequirements/DropdownField";
import ToggleWithWasteTankField from "./accessRequirements/ToggleWithWasteTankField";
import ToggleWithPPEField from "./accessRequirements/ToggleWithPPEField";

export default function AccessRequirements({ access, setAccess }) {
    // Options
    const dbsOptions = [
        { label: "Not Required", value: "Not Required" },
        { label: "Basic", value: "Basic" },
        { label: "Enhanced", value: "Enhanced" },
    ];
    const permitOptions = [
        { label: "Yes", value: "Yes" },
        { label: "No", value: "No" },
        { label: "Yes with SSRA", value: "Yes with SSRA" },
        {
            label: "No but SSRA are required",
            value: "No but SSRA are required",
        },
    ];
    const frequencyOptions = [
        { label: "Annually", value: "Annually" },
        { label: "6 monthly", value: "6 monthly" },
        { label: "3 monthly", value: "3 monthly" },
        { label: "2 monthly", value: "2 monthly" },
        { label: "monthly", value: "monthly" },
    ];
    const ppeOptions = [
        { label: "Hi-Visibility", value: "Hi-Visibility" },
        { label: "Harness & Lanyard", value: "Harness & Lanyard" },
        { label: "Hard Hat", value: "Hard Hat" },
        { label: "Construction Site", value: "Construction Site" },
    ];

    // Define the fields array.
    const fields = [
        {
            id: 1,
            label: "M&E Engineer Required",
            type: "toggleWithInput",
            toggleField: "mechanicalEngineer",
            inputField: "mechanicalEngineerDetails",
            inputPlaceholder: "Enter engineer details",
        },
        {
            id: 2,
            label: "Roof Access Required",
            type: "toggleWithInput",
            toggleField: "roofAccess",
            inputField: "roofAccessDetails",
            inputPlaceholder: "Enter roof access details",
        },
        {
            id: 3,
            label: "System to be Isolated Before Service",
            type: "toggleOnly",
            toggleField: "systemIsolated",
        },
        {
            id: 4,
            label: "Manning",
            type: "inputOnly",
            inputField: "manning",
            inputPlaceholder: "Enter Manning",
            inputType: "number",
            vertical: true,
        },
        {
            id: 5,
            label: "Frequency of Service",
            type: "dropdown",
            field: "frequencyOfService",
            options: frequencyOptions,
            placeholder: "Select Frequency",
            vertical: true,
        },
        {
            id: 6,
            label: "Keys Required",
            type: "toggleOnly",
            toggleField: "keysrequired",
        },
        {
            id: 7,
            label: "DBS",
            type: "dropdown",
            field: "dbs",
            options: dbsOptions,
            placeholder: "Select DBS Option",
            vertical: true,
        },
        {
            id: 8,
            label: "Permit to Work",
            type: "dropdown",
            field: "permit",
            options: permitOptions,
            placeholder: "Select Permit Option",
            vertical: true,
        },
        {
            id: 9,
            label: "Induction Needed",
            type: "toggleWithInput",
            toggleField: "inductionNeeded",
            inputField: "inductionDetails",
            inputPlaceholder: "Enter induction details",
            multiline: true,
        },
        {
            id: 10,
            label: "Waste Tank Required",
            type: "toggleWithWasteTank",
            toggleField: "wasteTankToggle",
            dropdownField: "wasteTankSelection",
            dropdownPlaceholder: "Select Waste Tank Option",
            inputField: "wasteTankDetails",
            inputPlaceholder: "Enter waste tank details",
            options: [
                { label: "N/A", value: "N/A" },
                { label: "Waste Drum", value: "Waste Drum" },
                { label: "IBC Tank", value: "IBC Tank" },
            ],
        },
        {
            id: 11,
            label: "PPE",
            type: "toggleWithPPE",
            toggleField: "ppeToggle",
            multiSelectField: "ppeMulti",
            multiSelectPlaceholder: "Select PPE Options",
            options: ppeOptions,
            inputField: "ppeDetails",
            inputPlaceholder: "Enter PPE details",
        },
        {
            id: 12,
            label: "Waste Management Requirements",
            type: "toggleWithInput",
            toggleField: "wasteManagementRequired",
            inputField: "wasteManagementDetails",
            inputPlaceholder: "Enter waste management requirements",
            multiline: true,
        },
        {
            id: 13,
            label: "Other Comments",
            type: "inputOnly",
            inputField: "otherComments",
            inputPlaceholder: "Enter comments",
            multiline: true,
        },
    ];

    const renderField = (item) => {
        switch (item.type) {
            case "toggleWithInput":
                return (
                    <ToggleWithInputField
                        key={item.id}
                        item={item}
                        access={access}
                        setAccess={setAccess}
                    />
                );
            case "toggleOnly":
                return (
                    <ToggleOnlyField
                        key={item.id}
                        item={item}
                        access={access}
                        setAccess={setAccess}
                    />
                );
            case "inputOnly":
                return (
                    <InputOnlyField
                        key={item.id}
                        item={item}
                        access={access}
                        setAccess={setAccess}
                    />
                );
            case "dropdown":
                return (
                    <DropdownField
                        key={item.id}
                        item={item}
                        access={access}
                        setAccess={setAccess}
                    />
                );
            case "toggleWithWasteTank":
                return (
                    <ToggleWithWasteTankField
                        key={item.id}
                        item={item}
                        access={access}
                        setAccess={setAccess}
                    />
                );
            case "toggleWithPPE":
                return (
                    <ToggleWithPPEField
                        key={item.id}
                        item={item}
                        access={access}
                        setAccess={setAccess}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Accordion multiple>
            <AccordionTab header="Access / Requirements">
                <DataView
                    value={fields}
                    layout="grid"
                    itemTemplate={renderField}
                />
            </AccordionTab>
        </Accordion>
    );
}
