// components\kitchenSurvey\surveyInfo\siteSelect.jsx

"use client"; // This component uses React hooks

import React, { useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import "primereact/resources/primereact.min.css"; // Core CSS
import "primeicons/primeicons.css"; // Icons

export default function SiteSelect({ onSiteSelect }) {
    const [selectedSite, setSelectedSite] = useState(null);
    const [filteredSites, setFilteredSites] = useState([]);

    // Function to fetch sites from API based on the query.
    const searchSites = async (query) => {
        if (!query) {
            setFilteredSites([]);
            return;
        }
        try {
            const res = await fetch(
                `/api/database/clients/sites?search=${encodeURIComponent(
                    query
                )}`
            );
            const data = await res.json();
            if (data.success) {
                setFilteredSites(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching sites:", error);
            setFilteredSites([]);
        }
    };

    const handleComplete = (event) => {
        searchSites(event.query);
    };

    const itemTemplate = (item) => {
        const address =
            item.addresses && item.addresses[0] ? item.addresses[0] : {};
        return (
            <div>
                <strong>{item.siteName}</strong> - {address.addressLine1 || ""}{" "}
                - {address.postCode || ""}
            </div>
        );
    };

    const onSelect = (e) => {
        setSelectedSite(e.value);
        if (e.value && typeof onSiteSelect === "function") {
            // Pass the complete site object to the parent
            onSiteSelect(e.value);
        }
    };

    return (
        <div className="site-select">
            <AutoComplete
                value={selectedSite}
                field="siteName"
                suggestions={filteredSites}
                completeMethod={handleComplete}
                onChange={(e) => setSelectedSite(e.value)}
                itemTemplate={itemTemplate}
                onSelect={onSelect}
                placeholder="Search Sites..."
            />
        </div>
    );
}
