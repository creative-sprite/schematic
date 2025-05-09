// components\database\clients\common\EntityDetailLayout.jsx
"use client";
import React, { useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Toast } from "primereact/toast";
import FunctionButtonsDB from "../EditDeleteEntry";

/**
 * Common layout component for all entity detail pages
 * Handles the structure with tabs, header, and buttons
 */
const EntityDetailLayout = ({ entity, entityType, id, children, loading }) => {
    const toast = useRef(null);

    if (loading) return <div>Loading...</div>;
    if (!entity)
        return (
            <div>
                {entityType.charAt(0).toUpperCase() + entityType.slice(1)} not
                found
            </div>
        );

    // Extract tabs from children if provided as an array
    const tabs = Array.isArray(children) ? children : [children];

    return (
        <div className="database-detail">
            <Toast ref={toast} />

            <FunctionButtonsDB
                entityType={entityType}
                entity={entity}
                id={id}
                toast={toast}
            />

            <TabView>
                {tabs.map((tab, index) => (
                    <TabPanel key={index} header={tab.props.header}>
                        {tab}
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
};

export default EntityDetailLayout;
