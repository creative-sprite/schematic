// app\database\clients\supplier\[id]\page.jsx
"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import EntityDetailLayout from "@/components/database/clients/common/EntityDetailLayout";
import EntityTab from "@/components/database/clients/common/EntityTab";
import EntityInfoCard from "@/components/database/clients/common/EntityInfoCard";
import NotesTab from "@/components/database/clients/common/NotesTab";
import SupplierProductsTab from "@/components/database/supplier/SupplierProductsTab";

export default function SupplierDetail() {
    const { id } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSupplier() {
            try {
                // Updated API path to match new route structure
                const res = await fetch(
                    `/api/database/clients/suppliers/${id}`
                );
                const json = await res.json();
                if (json.success) {
                    setSupplier(json.data);
                } else {
                    console.error("Failed to fetch supplier:", json);
                }
            } catch (error) {
                console.error("Error fetching supplier:", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchSupplier();
    }, [id]);

    return (
        <EntityDetailLayout
            entity={supplier}
            entityType="supplier"
            id={id}
            loading={loading}
        >
            <EntityTab header="General">
                <EntityInfoCard entity={supplier} entityType="supplier" />
            </EntityTab>
            <EntityTab header="Products">
                <SupplierProductsTab supplier={supplier} />
            </EntityTab>
            <EntityTab header="Notes">
                <NotesTab entryId={id} />
            </EntityTab>
        </EntityDetailLayout>
    );
}
