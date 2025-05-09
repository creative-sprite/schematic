// app\database\clients\chain\[id]\page.jsx
"use client";

import { useParams } from "next/navigation";
import EntityDetailLayout from "@/components/database/clients/common/EntityDetailLayout";
import EntityTab from "@/components/database/clients/common/EntityTab";
import EntityInfoCard from "@/components/database/clients/common/EntityInfoCard";
import RelationshipsTab from "@/components/database/clients/common/RelationshipsTab";
import NotesTab from "@/components/database/clients/common/NotesTab";
import useEntityData from "@/components/database/clients/common/useEntityData";

export default function ChainDetail() {
    const { id } = useParams();
    const {
        entity: chain,
        loading,
        groups,
        sites,
        contacts,
        handleEntityUpdate,
        relationshipOptions,
    } = useEntityData("chain", id);

    return (
        <EntityDetailLayout
            entity={chain}
            entityType="chain"
            id={id}
            loading={loading}
        >
            <EntityTab header="General">
                <EntityInfoCard
                    entity={chain}
                    entityType="chain"
                    contacts={contacts} // Pass contacts to the EntityInfoCard
                />
            </EntityTab>

            <EntityTab header="Relationships">
                <RelationshipsTab
                    entity={chain}
                    entityType="chain"
                    relationshipOptions={relationshipOptions}
                    onUpdate={handleEntityUpdate}
                    relatedGroups={groups}
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
