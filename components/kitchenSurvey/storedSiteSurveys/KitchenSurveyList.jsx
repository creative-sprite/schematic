// components\kitchenSurvey\storedSiteSurveys\KitchenSurveyList.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataScroller } from "primereact/datascroller";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useRouter } from "next/navigation";
import QuoteModal from "@/components/kitchenSurvey/quote/QuoteModal";

export default function KitchenSurveyList({ siteId, onCountChange }) {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [quoteModalVisible, setQuoteModalVisible] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const router = useRouter();
    const toast = useRef(null);

    // Function to fetch surveys (can be called to refresh the list)
    const fetchSurveys = async () => {
        if (!siteId) return;

        setLoading(true);
        try {
            const res = await fetch(
                `/api/surveys/kitchenSurveys/viewAll?siteId=${siteId}`
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const json = await res.json();
            if (json.success) {
                // Sort surveys by date (newest first)
                const sortedSurveys = json.data.sort(
                    (a, b) =>
                        new Date(b.surveyDate || b.createdAt || 0) -
                        new Date(a.surveyDate || a.createdAt || 0)
                );
                setSurveys(sortedSurveys);

                // Call the onCountChange prop with the count if it exists
                if (onCountChange && typeof onCountChange === "function") {
                    onCountChange(sortedSurveys.length);
                }
            } else {
                throw new Error(json.message || "Failed to fetch surveys");
            }
        } catch (error) {
            console.error("Error fetching surveys:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch surveys when component mounts or siteId changes
    useEffect(() => {
        fetchSurveys();
    }, [siteId]);

    // Function to handle creating a new version of a survey
    const handleCreateVersion = async (surveyId) => {
        setCreating(true);
        try {
            // Call the PATCH endpoint to create a new version
            const res = await fetch(
                `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const json = await res.json();

            if (json.success) {
                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: json.message || "New version created successfully",
                    life: 3000,
                });

                // Navigate to edit the newly created version
                router.push(`/surveys/kitchenSurvey?id=${json.data._id}`);
            } else {
                throw new Error(json.message || "Failed to create new version");
            }
        } catch (error) {
            console.error("Error creating survey version:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to create new version",
                life: 3000,
            });
        } finally {
            setCreating(false);
        }
    };

    // Function to handle deleting a survey
    const handleDeleteSurvey = async (surveyId) => {
        confirmDialog({
            message: "Are you sure you want to delete this survey?",
            header: "Delete Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                setDeleting(true);
                try {
                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
                        {
                            method: "DELETE",
                        }
                    );

                    if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    }

                    const json = await res.json();

                    if (json.success) {
                        toast.current.show({
                            severity: "success",
                            summary: "Success",
                            detail: "Survey deleted successfully",
                            life: 3000,
                        });

                        // Refresh the survey list
                        fetchSurveys();
                    } else {
                        throw new Error(
                            json.message || "Failed to delete survey"
                        );
                    }
                } catch (error) {
                    console.error("Error deleting survey:", error);
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: error.message || "Failed to delete survey",
                        life: 3000,
                    });
                } finally {
                    setDeleting(false);
                }
            },
        });
    };

    // Render a survey item in the list
    const surveyTemplate = (survey) => {
        // Extract the version part from the REF ID if possible
        let versionPart = "";
        if (survey.refValue) {
            const parts = survey.refValue.split("/");
            if (parts.length === 4) {
                versionPart = parts[3];
            }
        }

        return (
            <Card
                key={survey._id}
                className="survey-card"
                style={{
                    marginBottom: "1rem",
                    position: "relative",
                    height: "200px", // Fixed identical height to match QuotesList
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <div>
                        <h3>
                            {survey.refValue
                                ? `REF: ${survey.refValue}`
                                : "Survey"}
                        </h3>
                        <p>
                            Date:{" "}
                            {new Date(
                                survey.surveyDate || survey.createdAt
                            ).toLocaleDateString()}
                        </p>
                        <p>
                            <strong>Type:</strong>{" "}
                            {survey.general?.surveyType || "N/A"}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                            tooltip="Edit This Version"
                            icon="pi pi-file-edit"
                            className="p-button-primary"
                            onClick={() =>
                                router.push(
                                    `/surveys/kitchenSurvey?id=${survey._id}`
                                )
                            }
                        />
                        <Button
                            tooltip="Create New Version"
                            icon="pi pi-file-plus"
                            className="p-button-success"
                            onClick={() => handleCreateVersion(survey._id)}
                            disabled={creating}
                        />
                        <Button
                            tooltip="View Quotes"
                            icon="pi pi-file-pdf"
                            className="p-button-info"
                            onClick={() => {
                                setSelectedSurvey(survey);
                                setQuoteModalVisible(true);
                            }}
                        />
                        <Button
                            tooltip="Delete Survey"
                            icon="pi pi-trash"
                            className="p-button-danger"
                            onClick={() => handleDeleteSurvey(survey._id)}
                            disabled={deleting}
                        />
                    </div>
                </div>
            </Card>
        );
    };

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "2rem",
                }}
            >
                <ProgressSpinner style={{ width: "50px", height: "50px" }} />
            </div>
        );
    }

    if (error) {
        return <div>Error loading surveys: {error}</div>;
    }

    if (surveys.length === 0) {
        return <div>No surveys found for this site.</div>;
    }

    return (
        <div className="kitchen-survey-list">
            <Toast ref={toast} />
            <ConfirmDialog />
            <DataScroller
                value={surveys}
                itemTemplate={surveyTemplate}
                rows={5}
                inline
                scrollHeight="400px"
                emptyMessage="No surveys found for this site."
            />

            {/* Quote Modal */}
            {selectedSurvey && (
                <QuoteModal
                    visible={quoteModalVisible}
                    onHide={() => setQuoteModalVisible(false)}
                    surveyId={selectedSurvey._id}
                    surveyRef={selectedSurvey.refValue}
                />
            )}
        </div>
    );
}
