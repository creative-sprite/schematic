// components\database\clients\common\EntityTab.jsx
import React from "react";

/**
 * A wrapper component to represent a tab with a header
 * This component doesn't render anything, it's just used as a container
 * to pass data to the parent component (EntityDetailLayout)
 */
const EntityTab = ({ header, children }) => {
    // This component is just a wrapper to hold props and children
    // The actual rendering is handled by the parent TabView component
    return children;
};

export default EntityTab;
