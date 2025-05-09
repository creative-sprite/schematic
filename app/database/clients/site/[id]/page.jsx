// app\database\clients\site\[id]\page.jsx
"use client";

import { useParams } from "next/navigation";
import { Card } from "primereact/card";
import { useState, useEffect } from "react";
import EntityDetailLayout from "@/components/database/clients/common/EntityDetailLayout";
import EntityTab from "@/components/database/clients/common/EntityTab";
import EntityInfoCard from "@/components/database/clients/common/EntityInfoCard";
import RelationshipsTab from "@/components/database/clients/common/RelationshipsTab";
import NotesTab from "@/components/database/clients/common/NotesTab";
import useEntityData from "@/components/database/clients/common/useEntityData";
import KitchenSurveyList from "@/components/kitchenSurvey/storedSiteSurveys/KitchenSurveyList";
import QuotesList from "@/components/kitchenSurvey/storedQuotes/QuotesList";

export default function SiteDetail() {
    const { id } = useParams();
    const [surveyCount, setSurveyCount] = useState(0);
    const [quoteCount, setQuoteCount] = useState(0);
    const {
        entity: site,
        loading,
        groups,
        chains,
        contacts,
        handleEntityUpdate,
        relationshipOptions,
    } = useEntityData("site", id);

    // Fetch survey count
    useEffect(() => {
        if (site && site._id) {
            const fetchSurveyCount = async () => {
                try {
                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll?siteId=${site._id}`
                    );
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && Array.isArray(json.data)) {
                            setSurveyCount(json.data.length);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching survey count:", error);
                }
            };

            const fetchQuoteCount = async () => {
                try {
                    const res = await fetch(`/api/quotes?siteId=${site._id}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            setQuoteCount(data.length);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching quote count:", error);
                }
            };

            fetchSurveyCount();
            fetchQuoteCount();
        }
    }, [site]);

    // Custom header renderer for Kitchen Surveys card
    const renderSurveyHeader = () => {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span>Kitchen Surveys</span>
                <span style={{ fontSize: "0.9rem", color: "#666" }}>
                    {surveyCount} {surveyCount === 1 ? "Survey" : "Surveys"}
                </span>
            </div>
        );
    };

    // Custom header renderer for Quotes card
    const renderQuotesHeader = () => {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span>Quotes</span>
                <span style={{ fontSize: "0.9rem", color: "#666" }}>
                    {quoteCount} {quoteCount === 1 ? "Quote" : "Quotes"}
                </span>
            </div>
        );
    };

    return (
        <EntityDetailLayout
            entity={site}
            entityType="site"
            id={id}
            loading={loading}
        >
            <EntityTab header="General">
                <EntityInfoCard
                    entity={site}
                    entityType="site"
                    contacts={contacts} // Pass contacts to the EntityInfoCard
                />
            </EntityTab>

            <EntityTab header="Documents">
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1rem",
                        maxHeight: "800px",
                        overflowY: "auto",
                    }}
                >
                    <Card
                        title={renderSurveyHeader()}
                        style={{
                            flex: "1 1 300px",
                            minWidth: "300px",
                            maxWidth: "100%",
                            marginBottom: "1rem",
                        }}
                    >
                        {site && site._id && (
                            <KitchenSurveyList
                                siteId={site._id}
                                onCountChange={setSurveyCount}
                            />
                        )}
                    </Card>

                    <Card
                        title={renderQuotesHeader()}
                        style={{
                            flex: "1 1 300px",
                            minWidth: "300px",
                            maxWidth: "100%",
                            marginBottom: "1rem",
                        }}
                    >
                        {site && site._id && (
                            <QuotesList
                                siteId={site._id}
                                onCountChange={setQuoteCount}
                            />
                        )}
                    </Card>
                </div>
            </EntityTab>

            <EntityTab header="Notes">
                <NotesTab entryId={id} />
            </EntityTab>

            <EntityTab header="Relationships">
                <RelationshipsTab
                    entity={site}
                    entityType="site"
                    relationshipOptions={relationshipOptions}
                    onUpdate={handleEntityUpdate}
                    relatedGroups={groups}
                    relatedChains={chains}
                    relatedContacts={contacts}
                />
            </EntityTab>
        </EntityDetailLayout>
    );
}
