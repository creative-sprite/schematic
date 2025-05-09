// app\database\clients\group\[id]\page.jsx
"use client";

import { useParams } from "next/navigation";
import EntityDetailLayout from "@/components/database/clients/common/EntityDetailLayout";
import EntityTab from "@/components/database/clients/common/EntityTab";
import EntityInfoCard from "@/components/database/clients/common/EntityInfoCard";
import RelationshipsTab from "@/components/database/clients/common/RelationshipsTab";
import NotesTab from "@/components/database/clients/common/NotesTab";
import useEntityData from "@/components/database/clients/common/useEntityData";

export default function GroupDetail() {
    const { id } = useParams();
    const {
        entity: group,
        loading,
        chains,
        sites,
        contacts,
        handleEntityUpdate,
        relationshipOptions,
    } = useEntityData("group", id);

    return (
        <EntityDetailLayout
            entity={group}
            entityType="group"
            id={id}
            loading={loading}
        >
            <EntityTab header="General">
                <EntityInfoCard
                    entity={group}
                    entityType="group"
                    contacts={contacts} // Pass contacts to the EntityInfoCard
                />
            </EntityTab>

            <EntityTab header="Relationships">
                <RelationshipsTab
                    entity={group}
                    entityType="group"
                    relationshipOptions={relationshipOptions}
                    onUpdate={handleEntityUpdate}
                    relatedChains={chains}
                    relatedSites={sites}
                    relatedContacts={contacts}
                />
            </EntityTab>

            <EntityTab header="Notes">
                <NotesTab entryId={id} />
            </EntityTab>
        </EntityDetailLayout>
    );
}
