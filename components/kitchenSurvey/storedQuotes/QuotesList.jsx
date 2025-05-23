// components/kitchenSurvey/storedQuotes/QuotesList.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataScroller } from "primereact/datascroller";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
// Import the new ViewDownloadPDF component
import ViewDownloadPDF from "./ViewDownloadPDF";
// Make sure getCloudinaryPdfUrl is imported
import { getCloudinaryPdfUrl } from "@/lib/cloudinary";

export default function QuotesList({ siteId, onCountChange }) {
    const [quotes, setQuotes] = useState([]);
    const [visibleQuotes, setVisibleQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
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
            
            .deleting-quote {
                opacity: 0.5;
                pointer-events: none;
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

            // Only fetch survey refs if we have quotes
            if (sortedQuotes.length > 0) {
                // Use setTimeout to delay API calls slightly
                setTimeout(() => {
                    fetchSurveyRefs(sortedQuotes);
                }, 50);
            }
        } catch (error) {
            // Only log errors in development to keep production console clean
            if (process.env.NODE_ENV !== "production") {
                console.warn("Error fetching quotes:", error);
            }
            setError(error.message);
        } finally {
            setLoading(false);
        }
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
                console.warn("Error saving note:", error);
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
    const handleOpenNotes = useCallback((quote, event) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        setCurrentQuoteId(quote._id);
        setNoteText(orphanedQuotes[quote._id] || "");
        setNotesModalVisible(true);
    }, [orphanedQuotes]);

    // Function to check if surveys still exist and get their references
    const fetchSurveyRefs = async (quotesData) => {
        // Get unique survey IDs
        const surveyIds = [
            ...new Set(quotesData.map((q) => q.surveyId).filter(Boolean)),
        ];

        if (surveyIds.length === 0) return;

        const refsMap = {};

        // Process in small batches to avoid overwhelming the server
        const batchSize = 3;
        for (let i = 0; i < surveyIds.length; i += batchSize) {
            const batch = surveyIds.slice(i, i + batchSize);

            // Process each survey in parallel
            const promises = batch.map(async (id) => {
                if (!id) return;

                // Skip known missing surveys
                if (missingSurveyIds.has(id)) return;

                try {
                    const res = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll/${id}`
                    );

                    if (res.ok) {
                        const json = await res.json();
                        if (json.success && json.data) {
                            refsMap[id] = json.data.refValue || "";
                        }
                    } else if (res.status === 404) {
                        // Mark this survey as missing
                        setMissingSurveyIds((prev) => {
                            const updated = new Set(prev);
                            updated.add(id);
                            return updated;
                        });
                    }
                } catch (error) {
                    console.warn(`Error checking survey ${id}:`, error);
                }
            });

            await Promise.all(promises);

            // Add small delay between batches
            if (i + batchSize < surveyIds.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        setSurveyRefs(refsMap);
    };

    // Function to get quote PDF URL using the standard function
    const getQuotePdfUrl = (quote) => {
        if (!quote || !quote.cloudinary?.publicId) return null;

        // Use the standard function to generate a proper PDF URL
        const url = getCloudinaryPdfUrl(quote.cloudinary.publicId);

        // Log information about the PDF for debugging
        console.log("PDF Debug Info:", {
            publicId: quote.cloudinary.publicId,
            generatedUrl: url,
            originalUrl: quote.cloudinary.url,
        });

        return url;
    };

    // Function to view PDF directly using the new component
    const handleViewPdf = useCallback((quote, event) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        if (!quote) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Quote information not available",
                life: 3000,
            });
            return;
        }

        // Check if the PDF is available
        const pdfUrl = getQuotePdfUrl(quote);

        if (!pdfUrl) {
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
    }, []);

    // Fetch quotes when component mounts or siteId changes
    useEffect(() => {
        if (siteId) {
            fetchQuotes();
        }
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
    const handleViewSurvey = useCallback(async (quote, event) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        setSelectedQuote(quote);
        const survey = await fetchSurvey(quote.surveyId);
        if (survey) {
            setSelectedSurvey(survey);
            setSurveyModalVisible(true);
        }
    }, [missingSurveyIds]);

    // Function to handle viewing a quote
    const handleViewQuote = useCallback((quote, event) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        setSelectedQuote(quote);
        setQuoteModalVisible(true);
    }, []);

    // CLEAN: Simple delete function without complex guards
    const handleDeleteQuote = useCallback((quote, event) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        // Prevent delete if already deleting this quote
        if (deleting === quote._id) {
            return;
        }

        const quoteName = quote.refValue || quote.name || 'Untitled Quote';

        confirmDialog({
            message: `Are you sure you want to delete the quote "${quoteName}"? This action cannot be undone.`,
            header: "Delete Quote Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: async () => {
                setDeleting(quote._id);
                try {
                    const res = await fetch(`/api/quotes/${quote._id}`, {
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
                    toast.current.show({
                        severity: "error",
                        summary: "Error", 
                        detail: "Failed to delete quote",
                        life: 3000,
                    });
                } finally {
                    setDeleting(null);
                }
            }
        });
    }, [deleting]);

    // Render a quote item in the list
    const quoteTemplate = (quote) => {
        // Get the survey ref for this quote
        const surveyRef = surveyRefs[quote.surveyId];
        const isSurveyMissing = !surveyRef && quote.surveyId;
        const hasNotes = orphanedQuotes[quote._id];
        const isDeleting = deleting === quote._id;

        // Check if the quote has a PDF using our updated function
        const hasPdf = !!getQuotePdfUrl(quote);

        return (
            <div className={`quote-card-container ${isDeleting ? 'deleting-quote' : ''}`}>
                <Card
                    className={`quote-card ${
                        isSurveyMissing ? "orphaned-quote" : ""
                    }`}
                >
                    {/* Vertical buttons on the left side */}
                    <div className="vertical-buttons">
                        <Button
                            tooltip="View Quote PDF"
                            icon="pi pi-file-pdf"
                            className="p-button-success"
                            onClick={(e) => handleViewPdf(quote, e)}
                            disabled={!hasPdf || isDeleting}
                        />
                        {isSurveyMissing ? (
                            <Button
                                tooltip="Add Notes"
                                icon="pi pi-pencil"
                                className="p-button-warning"
                                onClick={(e) => handleOpenNotes(quote, e)}
                                disabled={isDeleting}
                            />
                        ) : (
                            <Button
                                tooltip="View Related Survey"
                                icon="pi pi-file-edit"
                                className="p-button-primary"
                                onClick={(e) => handleViewSurvey(quote, e)}
                                disabled={isDeleting}
                            />
                        )}
                        <Button
                            tooltip={isDeleting ? "Deleting..." : "Delete Quote"}
                            icon={isDeleting ? "pi pi-spin pi-spinner" : "pi pi-trash"}
                            className="p-button-danger"
                            onClick={(e) => handleDeleteQuote(quote, e)}
                            disabled={isDeleting}
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
                            {quote.refValue || surveyRef ? (
                                ` 
                                ${quote.refValue || surveyRef}`
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
                        {isDeleting && (
                            <p style={{ color: "#ff6b6b", fontStyle: "italic" }}>
                                Deleting...
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
                    <strong>REF:</strong>
                    {selectedSurvey.refValue || "N/A"}
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

        // Get the PDF URL using our standard function
        const pdfUrl = getQuotePdfUrl(selectedQuote);
        const isCloudinaryPdf = !!selectedQuote.cloudinary?.publicId;

        return (
            <div>
                <h3>Quote Details</h3>
                <p>
                    <strong>Survey REF:</strong>{" "}
                    {surveyRef || selectedQuote.refValue || "Missing Reference"}
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
                        <strong>Storage:</strong> Cloudinary PDF
                    </p>
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
                                    // Force the download filename to have .pdf extension
                                    link.download = `${
                                        selectedQuote.name || "Quote"
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
            {/* No ConfirmDialog here - handled at page level */}

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

            {/* PDF Viewer Modal - Now using the new component */}
            <ViewDownloadPDF
                visible={pdfModalVisible}
                onHide={() => setPdfModalVisible(false)}
                quote={selectedQuote}
                toast={toast}
            />

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