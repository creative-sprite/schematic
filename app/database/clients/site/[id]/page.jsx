// app\database\clients\site\[id]\page.jsx
"use client";

import { useParams } from "next/navigation";
import { Card } from "primereact/card";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ConfirmDialog } from "primereact/confirmdialog";
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

    // Stable callback handlers
    const handleToggleSelectionMode = useCallback((mode) => {
        setIsSelectionMode(mode);
        // Reset selections when exiting selection mode
        if (!mode) {
            setSelectedAreas({});
        }
    }, []);

    const handleAreaSelection = useCallback((areaId, collection) => {
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
    }, []);

    const handleSurveyCountChange = useCallback((count) => {
        setSurveyCount(count);
    }, []);

    const handleAreaCountChange = useCallback((count) => {
        setAreaCount(count);
    }, []);

    const handleQuoteCountChange = useCallback((count) => {
        setQuoteCount(count);
    }, []);

    // Fetch survey count and other data
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

    // Memoized header renderers to prevent unnecessary re-renders
    const surveyHeader = useMemo(() => {
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
    }, [site, surveyCount]);

    const areasHeader = useMemo(() => {
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
    }, [
        site,
        areaCount,
        collections,
        handleToggleSelectionMode,
        selectedAreas,
    ]);

    const quotesHeader = useMemo(() => {
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
    }, [quoteCount]);

    // Memoize the site ID to prevent unnecessary re-renders
    const siteId = useMemo(() => site?._id, [site?._id]);

    return (
        <>
            {/* SINGLE ConfirmDialog instance for entire page */}
            <ConfirmDialog />

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
                        contacts={contacts}
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
                            title={surveyHeader}
                            style={{
                                width: "100%",
                                marginBottom: "1rem",
                            }}
                        >
                            {siteId && (
                                <KitchenSurveyList
                                    siteId={siteId}
                                    onCountChange={handleSurveyCountChange}
                                />
                            )}
                        </Card>

                        <Card
                            title={areasHeader}
                            style={{
                                width: "100%",
                                marginBottom: "1rem",
                            }}
                        >
                            {siteId && (
                                <AreaSurveyList
                                    siteId={siteId}
                                    onCountChange={handleAreaCountChange}
                                    isSelectionMode={isSelectionMode}
                                    selectedAreas={selectedAreas}
                                    onToggleAreaSelection={handleAreaSelection}
                                />
                            )}
                        </Card>

                        <Card
                            title={quotesHeader}
                            style={{
                                width: "100%",
                                marginBottom: "1rem",
                            }}
                        >
                            {siteId && (
                                <QuotesList
                                    siteId={siteId}
                                    onCountChange={handleQuoteCountChange}
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
        </>
    );
}
