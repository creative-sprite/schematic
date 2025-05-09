// components\database\main\DatabaseTabs.jsx

"use client";
import React from "react";
import { TabView, TabPanel } from "primereact/tabview";
import AccordionItems from "./AccordionItems";

const DatabaseTabs = ({
    activeIndex,
    setActiveIndex,
    sites,
    contacts,
    chains,
    groups,
    suppliers,
    searchTerm,
    displayCounts,
    handleLoadMore,
}) => {
    return (
        <div className="tab-container" style={{ marginBottom: "1rem" }}>
            <TabView
                activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)}
            >
                <TabPanel header="Sites">
                    <AccordionItems
                        data={sites}
                        type="Sites"
                        searchTerm={searchTerm}
                        displayCount={displayCounts["Sites"] || 100}
                        handleLoadMore={handleLoadMore}
                    />
                </TabPanel>
                <TabPanel header="Contacts">
                    <AccordionItems
                        data={contacts}
                        type="Contacts"
                        searchTerm={searchTerm}
                        displayCount={displayCounts["Contacts"] || 100}
                        handleLoadMore={handleLoadMore}
                    />
                </TabPanel>
                <TabPanel header="Chains">
                    <AccordionItems
                        data={chains}
                        type="Chains"
                        searchTerm={searchTerm}
                        displayCount={displayCounts["Chains"] || 100}
                        handleLoadMore={handleLoadMore}
                    />
                </TabPanel>
                <TabPanel header="Groups">
                    <AccordionItems
                        data={groups}
                        type="Groups"
                        searchTerm={searchTerm}
                        displayCount={displayCounts["Groups"] || 100}
                        handleLoadMore={handleLoadMore}
                    />
                </TabPanel>
                <TabPanel header="Suppliers">
                    <AccordionItems
                        data={suppliers}
                        type="Suppliers"
                        searchTerm={searchTerm}
                        displayCount={displayCounts["Suppliers"] || 100}
                        handleLoadMore={handleLoadMore}
                    />
                </TabPanel>
            </TabView>
        </div>
    );
};

export default DatabaseTabs;
