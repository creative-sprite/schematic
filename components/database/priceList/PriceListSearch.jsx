// components\database\priceList\PriceListSearch.jsx

"use client";
import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import "../../../styles/priceList.css";

export default function PriceListSearch({ items, setFilteredItems }) {
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (!searchTerm.trim()) {
                setFilteredItems(items);
                return;
            }

            const lowercasedSearch = searchTerm.toLowerCase();

            const filtered = items.filter((item) => {
                const category = item.category || "";
                const subcategory = item.subcategory || "";
                const itemName = item.item || "";
                const prices = item.prices || {};
                const priceValues = Object.values(prices).map((val) =>
                    String(val)
                );

                return (
                    category.toLowerCase().includes(lowercasedSearch) ||
                    subcategory.toLowerCase().includes(lowercasedSearch) ||
                    itemName.toLowerCase().includes(lowercasedSearch) ||
                    priceValues.some((price) =>
                        price.toLowerCase().includes(lowercasedSearch)
                    )
                );
            });

            setFilteredItems(filtered);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, items, setFilteredItems]);

    return (
        <div className="search-container" style={{ width: "25%" }}>
            <InputText
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%" }}
            />
        </div>
    );
}
