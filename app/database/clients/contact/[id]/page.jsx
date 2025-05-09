// app\database\clients\contact\[id]\page.jsx
"use client";

import { useParams } from "next/navigation";
import EntityDetailLayout from "@/components/database/clients/common/EntityDetailLayout";
import EntityTab from "@/components/database/clients/common/EntityTab";
import EntityInfoCard from "@/components/database/clients/common/EntityInfoCard";
import RelationshipsTab from "@/components/database/clients/common/RelationshipsTab";
import NotesTab from "@/components/database/clients/common/NotesTab";
import useEntityData from "@/components/database/clients/common/useEntityData";

export default function ContactDetail() {
    const { id } = useParams();
    const {
        entity: contact,
        loading,
        groups,
        chains,
        sites,
        handleEntityUpdate,
        relationshipOptions,
    } = useEntityData("contact", id);

    return (
        <EntityDetailLayout
            entity={contact}
            entityType="contact"
            id={id}
            loading={loading}
        >
            <EntityTab header="General">
                <EntityInfoCard entity={contact} entityType="contact" />
            </EntityTab>

            <EntityTab header="Relationships">
                <RelationshipsTab
                    entity={contact}
                    entityType="contact"
                    relationshipOptions={relationshipOptions}
                    onUpdate={handleEntityUpdate}
                    relatedGroups={groups}
                    relatedChains={chains}
                    relatedSites={sites}
                />
            </EntityTab>

            <EntityTab header="Notes">
                <NotesTab entryId={id} />
            </EntityTab>
        </EntityDetailLayout>
    );
}
