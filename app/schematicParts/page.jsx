// app\schematicParts\page.jsx
"use client";

import { useState, useEffect } from "react";
import PartsForm from "../../components/database/parts/PartsForm";
import PartsList from "../../components/database/parts/PartsList";
import PriceListSearch from "../../components/database/priceList/PriceListSearch";
import { Button } from "primereact/button";
import "../../styles/database.css";

export default function SchematicPartsPage() {
    const [parts, setParts] = useState([]);
    const [filteredParts, setFilteredParts] = useState([]);
    const [editingItems, setEditingItems] = useState({});

    const fetchParts = async () => {
        try {
            const res = await fetch("/api/parts");
            const json = await res.json();
            if (json.success) {
                setParts(json.data);
                setFilteredParts(json.data);
            }
        } catch (error) {
            console.error("Error fetching parts:", error);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const startEditing = (part) => {
        setEditingItems((prev) => ({ ...prev, [part._id]: { ...part } }));
    };

    const cancelEditing = (id) => {
        setEditingItems((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    };

    const onEditChange = (id, field, value) => {
        setEditingItems((prev) => {
            const updated = { ...prev };
            if (updated[id]) {
                updated[id][field] = value;
            }
            return updated;
        });
    };

    const saveEditing = async (id) => {
        try {
            const updatedData = editingItems[id];
            const res = await fetch(`/api/parts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            const json = await res.json();
            if (json.success) {
                cancelEditing(id);
                fetchParts();
            } else {
                alert(json.message || "Error updating part");
            }
        } catch (error) {
            console.error("Error updating part:", error);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm("Are you sure you want to delete this part?")) return;
        try {
            const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                cancelEditing(id);
                fetchParts();
            } else {
                alert("Error deleting part");
            }
        } catch (error) {
            console.error("Error deleting part:", error);
        }
    };

    return (
        <div className="database-content">
            {/* Added Search Bar similar to Pricing */}
            <PriceListSearch
                items={parts}
                setFilteredItems={setFilteredParts}
            />
            <PartsForm
                onSave={async (data) => {
                    try {
                        const res = await fetch("/api/parts", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(data),
                        });
                        const json = await res.json();
                        if (!json.success) {
                            alert("Error adding part: " + json.message);
                        }
                    } catch (error) {
                        console.error("Error adding part:", error);
                    }
                    await fetchParts();
                }}
            />
            <PartsList
                parts={filteredParts}
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
