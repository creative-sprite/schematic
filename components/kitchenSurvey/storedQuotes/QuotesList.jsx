// components\kitchenSurvey\storedQuotes\QuotesList.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataScroller } from "primereact/datascroller";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";

// Configuration to control behavior
const FETCH_SURVEY_REFS = true; // Enable survey reference checking to identify removed surveys

export default function QuotesList({ siteId, onCountChange }) {
    const [quotes, setQuotes] = useState([]);
    const [visibleQuotes, setVisibleQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [surveyModalVisible, setSurveyModalVisible] = useState(false);
    const [quoteModalVisible, setQuoteModalVisible] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [loadingSurvey, setLoadingSurvey] = useState(false);
    const [surveyRefs, setSurveyRefs] = useState({});
    const [orphanedQuotes, setOrphanedQuotes] = useState({});
    const [noteText, setNoteText] = useState("");
    const [notesModalVisible, setNotesModalVisible] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [currentQuoteId, setCurrentQuoteId] = useState(null);
    const router = useRouter();
    const toast = useRef(null);

    // Add CSS for horizontal layout and card styling
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            .horizontal-container {
                width: 100%;
                overflow-x: auto;
                display: flex;
                flex-wrap: nowrap;
                padding: 1rem 0;
            }
            
            .quote-card-container {
                width: 250px;
                flex: 0 0 auto;
                height: 280px;
                margin: 0 1rem;
                position: relative;
            }
            
            .vertical-buttons {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                z-index: 5;
            }
            
            .quote-info {
                margin-left: 3.5rem;
                padding: 0.5rem;
            }
            
            .quote-card {
                height: 100%;
                position: relative;
            }
            
            .orphaned-quote {
                border: 1px solid #FFA500;
                box-shadow: 0 2px 4px rgba(255, 165, 0, 0.2);
            }
            
            .note-indicator {
                position: absolute;
                top: 10px;
                right: 10px;
                color: #6366F1;
                font-size: 0.8rem;
            }
            
            .p-datascroller-content {
                overflow-y: hidden !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Cache for storing IDs of surveys we know don't exist to avoid 404 errors
    // Load from localStorage (if available) to persist across page refreshes
    const [missingSurveyIds, setMissingSurveyIds] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const cache = localStorage.getItem("missingSurveyIds");
                return cache ? new Set(JSON.parse(cache)) : new Set();
            } catch (e) {
                return new Set();
            }
        }
        return new Set();
    });

    // Update localStorage when missingSurveyIds changes
    useEffect(() => {
        if (typeof window !== "undefined" && missingSurveyIds.size > 0) {
            try {
                localStorage.setItem(
                    "missingSurveyIds",
                    JSON.stringify(Array.from(missingSurveyIds))
                );
            } catch (e) {
                // Ignore storage errors
            }
        }
    }, [missingSurveyIds]);

    // Safe fetch function that doesn't make requests for known missing surveys
    const safeFetch = async (url, surveyId, options = {}) => {
        // If we already know this survey doesn't exist, don't make a request
        if (surveyId && missingSurveyIds.has(surveyId)) {
            // Return a fake 404 response without making a network request
            return {
                ok: false,
                status: 404,
                json: async () => ({
                    success: false,
                    message: "Survey known to be missing",
                }),
            };
        }

        // For all other requests, make the actual API call
        try {
            const response = await fetch(url, options);

            // If we get a 404, remember this survey is missing
            if (surveyId && response.status === 404) {
                setMissingSurveyIds((prev) => {
                    const updated = new Set(prev);
                    updated.add(surveyId);
                    return updated;
                });
            }

            return response;
        } catch (error) {
            // For network errors, also mark as missing if it's a survey
            if (surveyId) {
                setMissingSurveyIds((prev) => {
                    const updated = new Set(prev);
                    updated.add(surveyId);
                    return updated;
                });
            }

            // Return a fake error response
            return {
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    message: "Network error",
                }),
            };
        }
    };

    // Function to fetch quotes (can be called to refresh the list)
    const fetchQuotes = async () => {
        if (!siteId) return;

        setLoading(true);
        try {
            // We want quotes that belong to this site's surveys
            const res = await fetch(`/api/quotes?siteId=${siteId}`);

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();

            // Sort quotes by date (newest first)
            const sortedQuotes = data.sort(
                (a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );

            setQuotes(sortedQuotes);
            // Show all quotes since we're using horizontal scrolling
            setVisibleQuotes(sortedQuotes);

            // Call the onCountChange prop with the count if it exists
            if (onCountChange && typeof onCountChange === "function") {
                onCountChange(sortedQuotes.length);
            }

            // Skip orphaned quote notes API calls to prevent 404 errors
            // await fetchOrphanedQuoteNotes(sortedQuotes);

            // Only fetch survey refs if the feature flag is enabled
            if (FETCH_SURVEY_REFS && sortedQuotes.length > 0) {
                // Fetch survey references for each quote
                const surveyIds = [
                    ...new Set(
                        sortedQuotes.map((q) => q.surveyId).filter(Boolean)
                    ),
                ];
                if (surveyIds.length > 0) {
                    // Use setTimeout to delay API calls slightly
                    setTimeout(() => {
                        fetchSurveyRefs(surveyIds, sortedQuotes);
                    }, 50);
                }
            } else {
                // If FETCH_SURVEY_REFS is disabled, manually create refs for all quotes
                // This ensures quotes display properly without making problematic API calls
                const manualRefs = {};
                sortedQuotes.forEach((quote) => {
                    if (quote.surveyId && quote.refValue) {
                        manualRefs[quote.surveyId] = quote.refValue;
                    }
                });
                setSurveyRefs(manualRefs);
            }
        } catch (error) {
            // Only log errors in development to keep production console clean
            if (process.env.NODE_ENV !== "production") {
                // Use console.warn instead of console.error to reduce visual noise
                console.warn(
                    "Error fetching quotes (suppressed in production):",
                    error
                );
            }
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch orphaned quote notes
    const fetchOrphanedQuoteNotes = async (quotes) => {
        try {
            // Skip API call if we know the endpoint likely doesn't exist to avoid 404s
            // This assumes the orphanedQuotes API is optional and may not be implemented yet
            // Return empty object instead of making the API call that will likely 404
            return {};

            /* Commented out to prevent unnecessary 404 errors
            // Use silent fetch to prevent 404 errors in console
            const res = await silentFetch(
                `/api/orphanedQuotes?siteId=${siteId}`
            );

            if (!res.ok) {
                // If the endpoint doesn't exist yet, don't error out
                if (res.status === 404) {
                    return {};
                }
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();

            // Create a map of quote ID to notes
            const notesMap = {};
            data.forEach((item) => {
                notesMap[item.quoteId] = item.notes;
            });

            setOrphanedQuotes(notesMap);
            return notesMap;
            */
        } catch (error) {
            // Return empty object without logging
            return {};
        }
    };

    // Function to fetch survey references without causing 404 errors
    const fetchSurveyRefs = async (surveyIds, quotesData) => {
        if (!surveyIds || !surveyIds.length) return;

        const refsMap = {};
        let newMissingSurveys = false;

        // Filter out survey IDs that we already know are missing
        const surveyIdsToCheck = surveyIds.filter(
            (id) => id && !missingSurveyIds.has(id)
        );

        // If all surveys are known to be missing, skip API calls entirely
        if (surveyIdsToCheck.length === 0) {
            setSurveyRefs(refsMap);
            return;
        }

        // Process remaining survey IDs in sequential batches
        const batchSize = 3;
        for (let i = 0; i < surveyIdsToCheck.length; i += batchSize) {
            const batch = surveyIdsToCheck.slice(i, i + batchSize);

            // Process each batch in parallel
            const promises = batch.map(async (id) => {
                if (!id) return; // Skip if id is null or undefined

                // Use safeFetch that won't make requests for known missing surveys
                const res = await safeFetch(
                    `/api/surveys/kitchenSurveys/viewAll/${id}`,
                    id
                );

                // Only process successful responses
                if (res.ok) {
                    try {
                        const json = await res.json();
                        if (json.success && json.data && json.data.refValue) {
                            refsMap[id] = json.data.refValue;
                        }
                    } catch (e) {
                        // Silently ignore JSON parsing errors
                    }
                } else if (res.status === 404) {
                    // Mark this survey as missing for future reference
                    newMissingSurveys = true;
                }
            });

            await Promise.all(promises);

            // Small delay between batches
            if (i + batchSize < surveyIdsToCheck.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        // Update the survey references
        setSurveyRefs(refsMap);
    };

    // Function to save a note for an orphaned quote
    const saveOrphanedQuoteNote = async () => {
        if (!currentQuoteId || !noteText.trim()) return;

        setSavingNote(true);
        try {
            const res = await fetch("/api/orphanedQuotes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quoteId: currentQuoteId,
                    siteId: siteId,
                    notes: noteText,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            // Update the local state
            setOrphanedQuotes((prev) => ({
                ...prev,
                [currentQuoteId]: noteText,
            }));

            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Note saved successfully",
                life: 3000,
            });

            setNotesModalVisible(false);
        } catch (error) {
            // Only log in development
            if (process.env.NODE_ENV !== "production") {
                console.warn(
                    "Error saving note (suppressed in production):",
                    error
                );
            }

            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to save note: " + error.message,
                life: 3000,
            });
        } finally {
            setSavingNote(false);
        }
    };

    // Function to open the notes modal
    const handleOpenNotes = (quote) => {
        setCurrentQuoteId(quote._id);
        setNoteText(orphanedQuotes[quote._id] || "");
        setNotesModalVisible(true);
    };

    // Function to view PDF directly
    const handleViewPdf = (quote) => {
        if (!quote) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Quote information not available",
                life: 3000,
            });
            return;
        }

        // Get the PDF URL - prefer Cloudinary storage but fall back to direct pdfData
        const hasPdf = quote.cloudinary?.url || quote.pdfData;

        if (!hasPdf) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "PDF not available for this quote",
                life: 3000,
            });
            return;
        }

        setSelectedQuote(quote);
        setPdfModalVisible(true);
    };

    // Fetch quotes when component mounts or siteId changes
    useEffect(() => {
        fetchQuotes();
    }, [siteId]);

    // Function to fetch survey by ID with 404 prevention
    const fetchSurvey = async (surveyId) => {
        if (!surveyId) return null;

        // If we already know this survey doesn't exist, don't make a request
        if (missingSurveyIds.has(surveyId)) {
            toast.current.show({
                severity: "warning",
                summary: "Warning",
                detail: "The linked survey could not be found. It may have been deleted.",
                life: 5000,
            });
            return null;
        }

        setLoadingSurvey(true);
        try {
            // Skip the API call if feature flag is disabled
            if (!FETCH_SURVEY_REFS) {
                // Instead of making the API call, just show a message and return default data
                setTimeout(() => {
                    // Find quote reference if available
                    const quoteRef = selectedQuote?.refValue || "Unknown";

                    // Show a toast with more helpful information
                    toast.current.show({
                        severity: "info",
                        summary: "Info",
                        detail: `Viewing quote ${quoteRef}`,
                        life: 3000,
                    });
                }, 500);

                // Return minimal survey data to avoid UI errors
                return {
                    _id: surveyId,
                    refValue: selectedQuote?.refValue || "Unknown",
                    createdAt: new Date().toISOString(),
                    general: { surveyType: "Kitchen Survey" },
                };
            }

            // Use safeFetch to avoid 404 network errors
            const res = await safeFetch(
                `/api/surveys/kitchenSurveys/viewAll/${surveyId}`,
                surveyId
            );

            // Handle survey not found
            if (res.status === 404) {
                toast.current.show({
                    severity: "warning",
                    summary: "Warning",
                    detail: "The linked survey could not be found. It may have been deleted.",
                    life: 5000,
                });
                return null;
            }

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const json = await res.json();
            if (json.success) {
                return json.data;
            } else {
                throw new Error(json.message || "Failed to fetch survey");
            }
        } catch (error) {
            // No console logging
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: error.message || "Failed to fetch survey",
                life: 3000,
            });
            return null;
        } finally {
            setLoadingSurvey(false);
        }
    };

    // Function to handle viewing a survey
    const handleViewSurvey = async (quote) => {
        setSelectedQuote(quote);
        const survey = await fetchSurvey(quote.surveyId);
        if (survey) {
            setSelectedSurvey(survey);
            setSurveyModalVisible(true);
        }
    };

    // Function to handle viewing a quote
    const handleViewQuote = (quote) => {
        setSelectedQuote(quote);
        setQuoteModalVisible(true);
    };

    // Function to handle deleting a quote
    const handleDeleteQuote = async (quoteId) => {
        confirmDialog({
            message: "Are you sure you want to delete this quote?",
            header: "Delete Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                setDeleting(true);
                try {
                    const res = await fetch(`/api/quotes/${quoteId}`, {
                        method: "DELETE",
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    }

                    toast.current.show({
                        severity: "success",
                        summary: "Success",
                        detail: "Quote deleted successfully",
                        life: 3000,
                    });

                    // Refresh the quotes list
                    fetchQuotes();
                } catch (error) {
                    // Only log in development
                    if (process.env.NODE_ENV !== "production") {
                        console.warn(
                            "Error deleting quote (suppressed in production):",
                            error
                        );
                    }

                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: error.message || "Failed to delete quote",
                        life: 3000,
                    });
                } finally {
                    setDeleting(false);
                }
            },
        });
    };

    // Get PDF URL from quote - prioritize Cloudinary URL but fall back to direct pdfData
    const getQuotePdfUrl = (quote) => {
        if (!quote) return null;
        return quote.cloudinary?.url || quote.pdfData || null;
    };

    // Render a quote item in the list
    const quoteTemplate = (quote) => {
        // Get the survey ref for this quote
        const surveyRef = surveyRefs[quote.surveyId];
        const isSurveyMissing = !surveyRef;
        const hasNotes = orphanedQuotes[quote._id];

        // Check if the quote has a PDF via Cloudinary or direct storage
        const hasPdf = !!getQuotePdfUrl(quote);

        return (
            <div className="quote-card-container">
                <Card
                    className={`quote-card ${
                        isSurveyMissing ? "orphaned-quote" : ""
                    }`}
                >
                    {/* Vertical buttons on the left side */}
                    <div className="vertical-buttons">
                        <Button
                            tooltip="View Quote Details"
                            icon="pi pi-file-pdf"
                            className="p-button-success"
                            onClick={() => handleViewQuote(quote)}
                        />
                        {isSurveyMissing ? (
                            <Button
                                tooltip="Add Notes"
                                icon="pi pi-pencil"
                                className="p-button-warning"
                                onClick={() => handleOpenNotes(quote)}
                            />
                        ) : (
                            <Button
                                tooltip="View Related Survey"
                                icon="pi pi-file-edit"
                                className="p-button-primary"
                                onClick={() => handleViewSurvey(quote)}
                            />
                        )}
                        <Button
                            tooltip="Delete Quote"
                            icon="pi pi-trash"
                            className="p-button-danger"
                            onClick={() => handleDeleteQuote(quote._id)}
                            disabled={deleting}
                        />
                    </div>

                    {/* Note indicator */}
                    {hasNotes && (
                        <span
                            className="pi pi-file-edit note-indicator"
                            title="This quote has notes"
                        ></span>
                    )}

                    {/* Quote information */}
                    <div className="quote-info">
                        <h3>
                            {surveyRef ? (
                                `REF: ${surveyRef}`
                            ) : (
                                <span style={{ color: "red" }}>
                                    Survey removed
                                </span>
                            )}
                        </h3>
                        <p>
                            Date:{" "}
                            {new Date(quote.createdAt).toLocaleDateString()}
                        </p>
                        <p>
                            <strong>Amount:</strong>{" "}
                            {quote.totalPrice
                                ? `£${quote.totalPrice.toFixed(2)}`
                                : "N/A"}
                        </p>
                        {quote.cloudinary?.publicId && (
                            <p>
                                <span
                                    className="pi pi-cloud-upload"
                                    style={{ color: "#4CAF50" }}
                                ></span>{" "}
                                Stored in Cloudinary
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        );
    };

    // Render content for the survey modal
    const renderSurveyContent = () => {
        if (loadingSurvey) {
            return (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "2rem",
                    }}
                >
                    <ProgressSpinner
                        style={{ width: "50px", height: "50px" }}
                    />
                </div>
            );
        }

        if (!selectedSurvey) {
            return (
                <div>
                    <p>
                        The survey associated with this quote could not be
                        found.
                    </p>
                    <p>It may have been deleted or moved.</p>
                </div>
            );
        }

        return (
            <div>
                <h3>Survey Details</h3>
                <p>
                    <strong>REF:</strong> {selectedSurvey.refValue || "N/A"}
                </p>
                <p>
                    <strong>Date:</strong>{" "}
                    {new Date(
                        selectedSurvey.surveyDate || selectedSurvey.createdAt
                    ).toLocaleDateString()}
                </p>
                <p>
                    <strong>Type:</strong>{" "}
                    {selectedSurvey.general?.surveyType || "N/A"}
                </p>

                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                    <Button
                        label="View Full Survey"
                        icon="pi pi-external-link"
                        onClick={() => {
                            router.push(
                                `/surveys/kitchenSurvey?id=${selectedSurvey._id}`
                            );
                            setSurveyModalVisible(false);
                        }}
                    />
                </div>
            </div>
        );
    };

    // Render content for the quote modal
    const renderQuoteContent = () => {
        if (!selectedQuote) {
            return <p>No quote information available.</p>;
        }

        // Get the survey ref for this quote
        const surveyRef = surveyRefs[selectedQuote.surveyId];
        const hasNotes = orphanedQuotes[selectedQuote._id];

        // Check if the quote has a PDF via Cloudinary or direct storage
        const pdfUrl = getQuotePdfUrl(selectedQuote);
        const isCloudinaryPdf = !!selectedQuote.cloudinary?.url;

        return (
            <div>
                <h3>Quote Details</h3>
                <p>
                    <strong>Survey REF:</strong>{" "}
                    {surveyRef || "Missing Reference"}
                </p>
                <p>
                    <strong>Title:</strong> {selectedQuote.name || "N/A"}
                </p>
                <p>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedQuote.createdAt).toLocaleDateString()}
                </p>
                <p>
                    <strong>Amount:</strong>{" "}
                    {selectedQuote.totalPrice
                        ? `£${selectedQuote.totalPrice.toFixed(2)}`
                        : "N/A"}
                </p>
                {isCloudinaryPdf && (
                    <p>
                        <strong>Storage:</strong> Cloudinary (optimized)
                    </p>
                )}

                {selectedQuote.description && (
                    <div>
                        <h4>Description</h4>
                        <p>{selectedQuote.description}</p>
                    </div>
                )}

                {/* Display notes for orphaned quotes */}
                {!surveyRef && hasNotes && (
                    <div>
                        <h4>Notes</h4>
                        <p>{orphanedQuotes[selectedQuote._id]}</p>
                        <div style={{ marginTop: "1rem", textAlign: "center" }}>
                            <Button
                                label="Edit Notes"
                                icon="pi pi-pencil"
                                className="p-button-warning"
                                onClick={() => {
                                    setQuoteModalVisible(false);
                                    setCurrentQuoteId(selectedQuote._id);
                                    setNoteText(
                                        orphanedQuotes[selectedQuote._id] || ""
                                    );
                                    setNotesModalVisible(true);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Add Notes button for orphaned quotes without notes */}
                {!surveyRef && !hasNotes && (
                    <div style={{ marginTop: "1rem", textAlign: "center" }}>
                        <Button
                            label="Add Notes"
                            icon="pi pi-pencil"
                            className="p-button-warning"
                            onClick={() => {
                                setQuoteModalVisible(false);
                                setCurrentQuoteId(selectedQuote._id);
                                setNoteText("");
                                setNotesModalVisible(true);
                            }}
                        />
                    </div>
                )}

                {/* PDF actions */}
                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                    {pdfUrl ? (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: "1rem",
                            }}
                        >
                            <Button
                                label="View PDF"
                                icon="pi pi-file-pdf"
                                className="p-button-success"
                                onClick={() => {
                                    setQuoteModalVisible(false);
                                    setPdfModalVisible(true);
                                }}
                            />
                            <Button
                                label="Download PDF"
                                icon="pi pi-download"
                                className="p-button-primary"
                                onClick={() => {
                                    // Create a temporary link to download the PDF
                                    const link = document.createElement("a");
                                    link.href = pdfUrl;
                                    link.download = `Quote_${
                                        selectedQuote.refValue ||
                                        selectedQuote._id
                                    }.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            />
                        </div>
                    ) : (
                        <p>No PDF available for this quote.</p>
                    )}
                </div>
            </div>
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
        return <div>Error loading quotes: {error}</div>;
    }

    if (quotes.length === 0) {
        return <div>No quotes found for this site.</div>;
    }

    return (
        <div className="quotes-list">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="horizontal-container">
                {visibleQuotes.map((quote) => (
                    <div key={quote._id}>{quoteTemplate(quote)}</div>
                ))}
            </div>

            {/* Survey Modal */}
            <Dialog
                header="Survey Details"
                visible={surveyModalVisible}
                style={{ width: "50vw" }}
                onHide={() => setSurveyModalVisible(false)}
            >
                {renderSurveyContent()}
            </Dialog>

            {/* Quote Modal */}
            <Dialog
                header="Quote Details"
                visible={quoteModalVisible}
                style={{ width: "50vw" }}
                onHide={() => setQuoteModalVisible(false)}
            >
                {renderQuoteContent()}
            </Dialog>

            {/* PDF Viewer Modal */}
            <Dialog
                header={`PDF Quote - ${selectedQuote?.name || "Quote"}`}
                visible={pdfModalVisible}
                style={{ width: "80vw", height: "80vh" }}
                onHide={() => setPdfModalVisible(false)}
                maximizable
                modal
                blockScroll
            >
                {selectedQuote && getQuotePdfUrl(selectedQuote) ? (
                    <iframe
                        src={getQuotePdfUrl(selectedQuote)}
                        style={{
                            width: "100%",
                            height: "calc(80vh - 120px)",
                            border: "none",
                        }}
                        title="PDF Viewer"
                    />
                ) : (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <p>No PDF available for this quote.</p>
                    </div>
                )}
            </Dialog>

            {/* Notes Modal */}
            <Dialog
                header="Quote Notes"
                visible={notesModalVisible}
                style={{ width: "50vw" }}
                onHide={() => setNotesModalVisible(false)}
                footer={
                    <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setNotesModalVisible(false)}
                            disabled={savingNote}
                        />
                        <Button
                            label="Save"
                            icon="pi pi-check"
                            onClick={saveOrphanedQuoteNote}
                            loading={savingNote}
                        />
                    </div>
                }
            >
                <div>
                    <p>
                        This quote's original survey is no longer available. Add
                        notes to help track its context:
                    </p>
                    <InputTextarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={5}
                        cols={30}
                        autoResize
                        style={{ width: "100%" }}
                        placeholder="Add notes about this quote..."
                    />
                </div>
            </Dialog>
        </div>
    );
}
