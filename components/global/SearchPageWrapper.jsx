// components\global\SearchPageWrapper.jsx

import React from "react";
import GlobalSearch from "./GlobalSearch";

export default function SearchPageWrapper({
    data,
    renderItem,
    getSearchText,
    containerStyle,
    children,
}) {
    return (
        <div>
            <GlobalSearch
                data={data}
                renderItem={renderItem}
                getSearchText={getSearchText}
                containerStyle={containerStyle}
            />
            {children}
        </div>
    );
}
