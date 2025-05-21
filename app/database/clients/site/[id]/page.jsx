// app\database\clients\site\[id]\page.jsx
"use client";

import { useParams } from "next/navigation";
import { Card } from "primereact/card";
import { useState, useEffect, useCallback } from "react"; // Add useCallback
import EntityDetailLayout from "@/components/database/clients/common/EntityDetailLayout";
import EntityTab from "@/components/database/clients/common/EntityTab";
import EntityInfoCard from "@/components/database/clients/common/EntityInfoCard";
import StartSurveyButton from "@/components/kitchenSurvey/storedSiteSurveys/StartSurveyButton";
import RelationshipsTab from "@/components/database/clients/common/RelationshipsTab";
import NotesTab from "@/components/database/clients/common/NotesTab";
import useEntityData from "@/components/database/clients/common/useEntityData";
import KitchenSurveyList from "@/components/kitchenSurvey/storedSiteSurveys/KitchenSurveyList";
import AreaSurveyList from "@/components/kitchenSurvey/storedAreaSurveys/AreaSurveyList";
import QuotesList from "@/components/kitchenSurvey/storedQuotes/QuotesList";
import CombineAreas from "@/components/kitchenSurvey/storedAreaSurveys/CombineAreas";

export default function SiteDetail() {
    const { id } = useParams();
    const [surveyCount, setSurveyCount] = useState(0);
    const [areaCount, setAreaCount] = useState(0);
    const [quoteCount, setQuoteCount] = useState(0);
    const [collections, setCollections] = useState([]);
    // State for area selection and combining
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAreas, setSelectedAreas] = useState({});

    const {
        entity: site,
        loading,
        groups,
        chains,
        contacts,
        handleEntityUpdate,
        relationshipOptions,
    } = useEntityData("site", id);

    // Function to toggle selection mode - Wrapped in useCallback
    const handleToggleSelectionMode = useCallback((mode) => {
        setIsSelectionMode(mode);
        // Reset selections when exiting selection mode
        if (!mode) {
            setSelectedAreas({});
        }
    }, []); // Empty dependency array since we only need to create this once

    // Function to toggle area selection
    const handleAreaSelection = (areaId, collection) => {
        setSelectedAreas((prev) => {
            const updated = { ...prev };
            if (updated[areaId]) {
                delete updated[areaId];
            } else {
                updated[areaId] = {
                    areaId,
                    collectionId: collection._id,
                    firstAreaName: collection.firstAreaName,
                    collectionRef: collection.collectionRef,
                };
            }
            return updated;
        });
    };

    // Rest of the component remains the same...

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

            const fetchAreaCount = async () => {
                try {
                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll?siteId=${site._id}`
                    );
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && Array.isArray(json.data)) {
                            setAreaCount(json.data.length);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching area count:", error);
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

            const fetchCollections = async () => {
                try {
                    const res = await fetch(
                        `/api/surveys/collections?siteId=${site._id}`
                    );
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && Array.isArray(json.data)) {
                            setCollections(json.data);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching collections:", error);
                }
            };

            fetchSurveyCount();
            fetchAreaCount();
            fetchQuoteCount();
            fetchCollections();
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
                <span>Surveys</span>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                    }}
                >
                    {site && site._id && (
                        <StartSurveyButton
                            siteId={site._id}
                            className="p-button-sm"
                        />
                    )}
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
                        {surveyCount} {surveyCount === 1 ? "Survey" : "Surveys"}
                    </span>
                </div>
            </div>
        );
    };

    // Custom header renderer for Areas card
    const renderAreasHeader = () => {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span>Areas</span>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                    }}
                >
                    {site && site._id && (
                        <CombineAreas
                            siteId={site._id}
                            collections={collections || []}
                            onToggleSelectionMode={handleToggleSelectionMode}
                            selectedAreas={selectedAreas}
                        />
                    )}
                    <span style={{ fontSize: "0.9rem", color: "#666" }}>
                        {areaCount} {areaCount === 1 ? "Area" : "Areas"}
                    </span>
                </div>
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
                        flexDirection: "column",
                        gap: "1rem",
                        width: "100%",
                    }}
                >
                    <Card
                        title={renderSurveyHeader()}
                        style={{
                            width: "100%",
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
                        title={renderAreasHeader()}
                        style={{
                            width: "100%",
                            marginBottom: "1rem",
                        }}
                    >
                        {site && site._id && (
                            <AreaSurveyList
                                siteId={site._id}
                                onCountChange={setAreaCount}
                                isSelectionMode={isSelectionMode}
                                selectedAreas={selectedAreas}
                                onToggleAreaSelection={handleAreaSelection}
                            />
                        )}
                    </Card>

                    <Card
                        title={renderQuotesHeader()}
                        style={{
                            width: "100%",
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
