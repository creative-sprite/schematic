// components/kitchenSurvey/quote/QuoteList.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
// IMPORT: Add import for getCloudinaryPdfUrl
import { getCloudinaryPdfUrl } from "@/lib/cloudinary";

/**
 * Component for displaying saved quotes
 * - Lists all saved quotes with options to view or delete
 * - Shows PDF from Cloudinary when viewing a quote
 */
export default function QuoteList() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [viewDialogVisible, setViewDialogVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [existingSurveys, setExistingSurveys] = useState({});
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    // NEW: Add state for alternative viewer toggle
    const [useAlternativeViewer, setUseAlternativeViewer] = useState(false);
    const toast = useRef(null);

    // Fetch quotes on component mount
    useEffect(() => {
        fetchQuotes();
    }, []);

    // Filter quotes when search query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredQuotes(quotes);
            return;
        }

        const lowercaseQuery = searchQuery.toLowerCase();
        const filtered = quotes.filter(
            (quote) =>
                (quote.name &&
                    quote.name.toLowerCase().includes(lowercaseQuery)) ||
                (quote.refValue &&
                    quote.refValue.toLowerCase().includes(lowercaseQuery))
        );

        setFilteredQuotes(filtered);
    }, [searchQuery, quotes]);

    // Fetch all quotes from the API
    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/quotes");

            if (!response.ok) {
                throw new Error(`Failed to fetch quotes: ${response.status}`);
            }

            const data = await response.json();

            // Sort by date (newest first)
            const sortedQuotes = data.sort(
                (a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );

            setQuotes(sortedQuotes);
            setFilteredQuotes(sortedQuotes);

            // Check if the related surveys still exist
            checkSurveyExistence(sortedQuotes);
        } catch (error) {
            console.error("Error fetching quotes:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to fetch quotes",
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // Check if surveys referenced by quotes still exist
    const checkSurveyExistence = async (quotesData) => {
        try {
            // Get unique survey IDs
            const surveyIds = [
                ...new Set(quotesData.map((quote) => quote.surveyId)),
            ];

            if (surveyIds.length === 0) return;

            const surveyStatus = {};

            // Process batches of survey IDs to avoid overwhelming the server
            const batchSize = 5;
            for (let i = 0; i < surveyIds.length; i += batchSize) {
                const batch = surveyIds.slice(i, i + batchSize);

                // Process each survey in parallel
                const promises = batch.map(async (surveyId) => {
                    if (!surveyId) return;

                    try {
                        const response = await fetch(
                            `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                        );
                        surveyStatus[surveyId] = response.ok;
                    } catch (error) {
                        surveyStatus[surveyId] = false;
                    }
                });

                await Promise.all(promises);
            }

            setExistingSurveys(surveyStatus);
        } catch (error) {
            console.error("Error checking survey existence:", error);
        }
    };

    // Delete a quote
    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/quotes/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete quote");
            }

            // Remove the quote from the list
            setQuotes(quotes.filter((quote) => quote._id !== id));
            setFilteredQuotes(
                filteredQuotes.filter((quote) => quote._id !== id)
            );

            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Quote deleted successfully",
                life: 3000,
            });
        } catch (error) {
            console.error("Error deleting quote:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to delete quote",
                life: 3000,
            });
        }
    };

    // Confirm quote deletion
    const confirmDelete = (id, name) => {
        confirmDialog({
            message: `Are you sure you want to delete the quote "${
                name || "Untitled"
            }"?`,
            header: "Delete Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => handleDelete(id),
        });
    };

    // View a quote
    const handleView = (quote) => {
        setSelectedQuote(quote);
        setViewDialogVisible(true);
    };

    // Format date for display
    const formatDate = (rowData) => {
        return new Date(rowData.createdAt).toLocaleDateString();
    };

    // Reference column template with "Survey removed" indicator
    const referenceTemplate = (rowData) => {
        // Check if survey exists
        const surveyExists = existingSurveys[rowData.surveyId];

        return (
            <div>
                <div>{rowData.refValue || "N/A"}</div>
                {rowData.surveyId &&
                    existingSurveys[rowData.surveyId] === false && (
                        <div
                            style={{
                                color: "red",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                marginTop: "3px",
                            }}
                        >
                            Survey removed
                        </div>
                    )}
            </div>
        );
    };

    // Format price with consistent currency formatting
    const formatPrice = (rowData) => {
        const price =
            typeof rowData.totalPrice === "number" ? rowData.totalPrice : 0;

        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
        }).format(price);
    };

    // Template for PDF/Cloudinary status
    const pdfStatusTemplate = (rowData) => {
        const hasCloudinaryPdf =
            rowData.cloudinary && rowData.cloudinary.publicId;

        if (hasCloudinaryPdf) {
            return (
                <span
                    className="pi pi-cloud text-green-500 font-bold"
                    style={{ fontSize: "1.2rem" }}
                    title="PDF stored in Cloudinary"
                ></span>
            );
        }

        return (
            <span
                className="pi pi-times text-red-500 font-bold"
                style={{ fontSize: "1.2rem" }}
                title="No PDF available"
            ></span>
        );
    };

    // UPDATED: Get properly formatted PDF URL
    const getPdfUrl = (quote) => {
        if (!quote || !quote.cloudinary?.publicId) return null;

        // Use the standard function to generate a proper PDF URL
        const url = getCloudinaryPdfUrl(quote.cloudinary.publicId);

        // Log debug info
        console.log("PDF Debug Info:", {
            publicId: quote.cloudinary.publicId,
            generatedUrl: url,
            originalUrl: quote.cloudinary.url,
        });

        return url;
    };

    // Action buttons template
    const actionTemplate = (rowData) => {
        const hasPdf = rowData.cloudinary && rowData.cloudinary.publicId;

        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-text"
                    onClick={() => handleView(rowData)}
                    tooltip="View Quote"
                    disabled={!hasPdf}
                />
                <Button
                    icon="pi pi-download"
                    className="p-button-rounded p-button-text p-button-success"
                    tooltip="Download PDF"
                    disabled={!hasPdf}
                    onClick={() => handleDownloadPdf(rowData)}
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger"
                    onClick={() => confirmDelete(rowData._id, rowData.name)}
                    tooltip="Delete Quote"
                />
            </div>
        );
    };

    // UPDATED: Download PDF function
    const handleDownloadPdf = async (quote) => {
        if (!quote || !quote.cloudinary?.publicId) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "PDF not available for this quote",
                life: 3000,
            });
            return;
        }

        try {
            setDownloadingPdf(true);

            // Get the proper PDF URL
            const pdfUrl = getPdfUrl(quote);
            if (!pdfUrl) {
                throw new Error("Could not generate PDF URL");
            }

            // Create temporary link for download
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `${quote.name || "Quote"}-${
                quote.refValue || ""
            }.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "PDF download started",
                life: 3000,
            });
        } catch (error) {
            console.error("Error downloading PDF:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to download PDF",
                life: 3000,
            });
        } finally {
            setDownloadingPdf(false);
        }
    };

    // UPDATED: PDF viewer dialog
    const renderViewDialog = () => {
        if (!selectedQuote) return null;

        // Get cloudinary URL using our helper function
        const pdfUrl = getPdfUrl(selectedQuote);
        const quoteName = selectedQuote.name || "Untitled Quote";
        const quoteRef = selectedQuote.refValue || "";

        return (
            <Dialog
                header={`Quote: ${quoteName}${
                    quoteRef ? ` (${quoteRef})` : ""
                }`}
                visible={viewDialogVisible}
                style={{ width: "90vw", maxWidth: "1200px" }}
                onHide={() => setViewDialogVisible(false)}
                maximizable
            >
                <div className="flex flex-col h-full">
                    {/* Quote details */}
                    <div className="mb-4 p-3 bg-gray-100 rounded">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <strong>Created:</strong>
                                <br />
                                {new Date(
                                    selectedQuote.createdAt
                                ).toLocaleDateString()}
                            </div>
                            <div>
                                <strong>Reference:</strong>
                                <br />
                                {selectedQuote.refValue || "N/A"}
                            </div>
                            <div>
                                <strong>Price:</strong>
                                <br />
                                {formatPrice(selectedQuote)}
                            </div>
                            <div>
                                <strong>Survey Status:</strong>
                                <br />
                                {existingSurveys[selectedQuote.surveyId] ===
                                false ? (
                                    <span className="text-red-500">
                                        Survey deleted
                                    </span>
                                ) : (
                                    <span className="text-green-500">
                                        Survey available
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PDF viewer with alternative options */}
                    {pdfUrl ? (
                        <div className="flex-grow" style={{ height: "70vh" }}>
                            {/* Toggle for viewer type */}
                            <div
                                style={{
                                    marginBottom: "1rem",
                                    textAlign: "center",
                                }}
                            >
                                <Button
                                    label={
                                        useAlternativeViewer
                                            ? "Use Standard Viewer"
                                            : "Use Alternative Viewer"
                                    }
                                    icon="pi pi-sync"
                                    className="p-button-outlined p-button-sm"
                                    onClick={() =>
                                        setUseAlternativeViewer(
                                            !useAlternativeViewer
                                        )
                                    }
                                />
                            </div>

                            {useAlternativeViewer ? (
                                // Object tag as alternative PDF viewer
                                <object
                                    data={pdfUrl}
                                    type="application/pdf"
                                    style={{
                                        width: "100%",
                                        height: "calc(70vh - 50px)",
                                    }}
                                >
                                    <p>
                                        Your browser doesn't support PDF
                                        viewing.
                                        <a
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Click here to download the PDF
                                        </a>
                                    </p>
                                </object>
                            ) : (
                                // Standard iframe approach
                                <iframe
                                    src={pdfUrl}
                                    style={{
                                        width: "100%",
                                        height: "calc(70vh - 50px)",
                                        border: "1px solid #ddd",
                                    }}
                                    title="PDF Viewer"
                                />
                            )}

                            {/* URL display for debugging */}
                            <div
                                style={{
                                    marginTop: "0.5rem",
                                    fontSize: "0.8rem",
                                    color: "#666",
                                    wordBreak: "break-all",
                                }}
                            >
                                PDF URL: {pdfUrl}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex items-center justify-center bg-gray-100 p-8 rounded"
                            style={{ height: "70vh" }}
                        >
                            <div className="text-center">
                                <i className="pi pi-file-pdf text-red-500 text-4xl mb-3"></i>
                                <p className="text-lg">
                                    No PDF available for this quote.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end mt-4">
                        {pdfUrl && (
                            <Button
                                label="Download PDF"
                                icon="pi pi-download"
                                onClick={() => handleDownloadPdf(selectedQuote)}
                                disabled={downloadingPdf}
                                loading={downloadingPdf}
                                className="mr-2"
                            />
                        )}
                        {existingSurveys[selectedQuote.surveyId] !== false &&
                            selectedQuote.surveyId && (
                                <Button
                                    label="View Survey"
                                    icon="pi pi-external-link"
                                    onClick={() => {
                                        window.open(
                                            `/surveys/kitchenSurvey?id=${selectedQuote.surveyId}`,
                                            "_blank"
                                        );
                                    }}
                                />
                            )}

                        {/* Direct link to open in new tab */}
                        {pdfUrl && (
                            <Button
                                label="Open in New Tab"
                                icon="pi pi-external-link"
                                className="p-button-outlined ml-2"
                                onClick={() => {
                                    window.open(pdfUrl, "_blank");
                                }}
                            />
                        )}
                    </div>
                </div>
            </Dialog>
        );
    };

    // Empty message template
    const emptyTemplate = () => {
        return (
            <div className="flex flex-column align-items-center p-5">
                <i className="pi pi-file-pdf text-5xl text-gray-300 mb-3"></i>
                <p>No quotes found. Save a survey as a quote to see it here.</p>
            </div>
        );
    };

    return (
        <Card title="Saved Quotes" className="w-full">
            <Toast ref={toast} />

            {/* Search Input */}
            <div className="flex justify-content-between mb-4">
                <div className="p-input-icon-left w-full md:w-5">
                    <i className="pi pi-search" />
                    <InputText
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or reference"
                        className="w-full"
                    />
                </div>
                <div className="ml-2">
                    <Button
                        icon="pi pi-refresh"
                        className="p-button-outlined"
                        onClick={fetchQuotes}
                        tooltip="Refresh quotes list"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-5">
                    <ProgressSpinner />
                </div>
            ) : (
                <DataTable
                    value={filteredQuotes}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    emptyMessage={emptyTemplate}
                    stripedRows
                    responsiveLayout="stack"
                    breakpoint="767px"
                    rowHover
                >
                    <Column field="name" header="Quote Name" sortable />
                    <Column
                        field="refValue"
                        header="Reference"
                        body={referenceTemplate}
                        sortable
                    />
                    <Column
                        header="Price"
                        body={formatPrice}
                        sortable
                        field="totalPrice"
                    />
                    <Column
                        field="createdAt"
                        header="Date Created"
                        body={formatDate}
                        sortable
                    />
                    <Column
                        field="cloudinary"
                        header="PDF"
                        body={pdfStatusTemplate}
                        style={{ width: "80px", textAlign: "center" }}
                    />
                    <Column
                        body={actionTemplate}
                        exportable={false}
                        style={{ width: "15%" }}
                        header="Actions"
                    />
                </DataTable>
            )}

            {renderViewDialog()}
        </Card>
    );
}
