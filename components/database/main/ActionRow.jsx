// components\database\main\ActionRow.jsx
"use client";
import React from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

// This component renders the action row with the "Add New Entry" button and search input.
const ActionRow = ({ openDialog, searchTerm, setSearchTerm }) => {
    return (
        <div
            className="action-row"
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
            }}
        >
            <Button
                label="Add New Entry"
                icon="pi pi-plus"
                onClick={openDialog}
            />
            <span className="p-input-icon-left" style={{ marginLeft: "1rem" }}>
                <i className="pi pi-search" />
                <InputText
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    style={{ width: "200px" }}
                />
            </span>
        </div>
    );
};

export default ActionRow;
