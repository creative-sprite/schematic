// app\database\priceList\page.jsx
"use client";
import React, { useState, useEffect } from "react";
import PricingForm from "../../../components/database/priceList/PricingForm";
import PricingTable from "../../../components/database/priceList/PricingTable";
import CsvExportImport from "../../../components/database/priceList/CsvExportImport";
import PriceListSearch from "../../../components/database/priceList/PriceListSearch";
import "../../../styles/priceList.css";

export default function Pricing() {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [editingItems, setEditingItems] = useState({});
    const [submitted, setSubmitted] = useState(false);

    // Fetch items from the API.
    const fetchItems = async () => {
        try {
            const res = await fetch("/api/priceList");
            const json = await res.json();
            if (json.success) {
                setItems(json.data);
                setFilteredItems(json.data);
            } else {
                console.error("Failed to fetch items:", json);
            }
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Add new item via POST.
    const addItem = async (formData) => {
        setSubmitted(true);
        try {
            const payload = { ...formData, svgPath: formData.svgPath || "" };
            const res = await fetch("/api/priceList", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                fetchItems();
            } else {
                alert(json.message || "Error creating item");
            }
        } catch (error) {
            console.error("Error submitting new item:", error);
        }
        setSubmitted(false);
    };

    // Inline editing functions.
    const startEditing = (item) => {
        setEditingItems((prev) => ({ ...prev, [item._id]: { ...item } }));
    };

    const cancelEditing = (id) => {
        setEditingItems((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    };

    const saveEditing = async (id, newData) => {
        try {
            const payload = { ...newData, svgPath: newData.svgPath || "" };
            const res = await fetch(`/api/priceList/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                cancelEditing(id);
                fetchItems();
            } else {
                alert(json.message || "Error updating item");
            }
        } catch (error) {
            console.error("Error during update:", error);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            const res = await fetch(`/api/priceList/${id}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (json.success) {
                cancelEditing(id);
                fetchItems();
            } else {
                alert("Error deleting item");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    // Handler for inline editing changes.
    const onEditChange = (rowId, field, value, isPrice = false) => {
        setEditingItems((prev) => {
            const updated = { ...prev };
            if (updated[rowId]) {
                if (isPrice) {
                    updated[rowId].prices[field] = value;
                } else {
                    updated[rowId][field] = value;
                }
            }
            return updated;
        });
    };

    return (
        <div className="price-container">
            <PricingForm onAddItem={addItem} submitted={submitted} />
            <br />
            <CsvExportImport />
            <br />
            <PriceListSearch
                items={items}
                setFilteredItems={setFilteredItems}
            />
            <PricingTable
                items={filteredItems}
                editingItems={editingItems}
                startEditing={startEditing}
                cancelEditing={cancelEditing}
                saveEditing={saveEditing}
                deleteItem={deleteItem}
                onEditChange={onEditChange}
            />
        </div>
    );
}
