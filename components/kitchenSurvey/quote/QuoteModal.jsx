// components/kitchenSurvey/quote/QuoteModal.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { confirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
// IMPORT: Add import for getCloudinaryPdfUrl
import { getCloudinaryPdfUrl } from "@/lib/cloudinary";

export default function QuoteModal({ visible, onHide, surveyId, surveyRef }) {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewQuote, setViewQuote] = useState(null);
    const [viewDialogVisible, setViewDialogVisible] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    // NEW: Add state for alternative viewer
    const [useAlternativeViewer, setUseAlternativeViewer] = useState(false);
    const toast = useRef(null);

    // Fetch quotes when the modal becomes visible
    useEffect(() => {
        if (visible && surveyId) {
            fetchQuotes();
        }
    }, [visible, surveyId]);

    // Fetch quotes for this specific survey
    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/quotes?surveyId=${surveyId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Sort quotes by date (newest first)
            const sortedQuotes = data.sort(
                (a, b) =>
                    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );

            setQuotes(sortedQuotes);
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

    // Delete a quote
    const handleDelete = async (id) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/quotes/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Update the quotes list after deletion
            setQuotes(quotes.filter((quote) => quote._id !== id));

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
        } finally {
            setLoading(false);
        }
    };

    // Confirm quote deletion
    const confirmDelete = (id) => {
        confirmDialog({
            message: `Are you sure you want to delete this quote?`,
            header: "Delete Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => handleDelete(id),
        });
    };

    // View a quote in the modal
    const handleView = (quote) => {
        setViewQuote(quote);
        setViewDialogVisible(true);
    };

    // Format date for display
    const formatDate = (rowData) => {
        return new Date(rowData.createdAt).toLocaleDateString();
    };

    // Format price with consistent format
    const formatPrice = (rowData) => {
        // Safely extract price value
        let price = 0;

        if (rowData.totalPrice !== undefined && !isNaN(rowData.totalPrice)) {
            price = Number(rowData.totalPrice);
        }

        // Format with pound sign and 2 decimal places
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
        }).format(price);
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

    // Action buttons in table
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
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger"
                    onClick={() => confirmDelete(rowData._id)}
                    tooltip="Delete Quote"
                />
            </div>
        );
    };

    // UPDATED: Download a PDF
    const handleDownloadPdf = async (quote) => {
        if (!quote || !quote.cloudinary?.publicId) {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "PDF URL not available",
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

            // Create a temporary link to download the PDF
            const link = document.createElement("a");
            link.href = pdfUrl;
            link.download = `${quote.name || "Quote"}.pdf`;
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

    // UPDATED: Quote detail view dialog
    const renderViewDialog = () => {
        if (!viewQuote) return null;

        // Get the URL using our standard function
        const pdfUrl = getPdfUrl(viewQuote);

        return (
            <Dialog
                header={`Quote: ${viewQuote.name || "Untitled"}`}
                visible={viewDialogVisible}
                style={{ width: "90vw", maxWidth: "1200px" }}
                onHide={() => setViewDialogVisible(false)}
                maximizable
            >
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {/* PDF View */}
                    <div className="col-span-1">
                        <h3 className="text-xl mb-2">Quote PDF</h3>

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

                        {pdfUrl ? (
                            <div
                                className="border rounded p-2 overflow-auto"
                                style={{ height: "70vh" }}
                            >
                                {useAlternativeViewer ? (
                                    // Object tag as alternative PDF viewer
                                    <object
                                        data={pdfUrl}
                                        type="application/pdf"
                                        style={{
                                            width: "100%",
                                            height: "100%",
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
                                            height: "100%",
                                        }}
                                        frameBorder="0"
                                        title="Quote PDF"
                                    />
                                )}
                            </div>
                        ) : (
                            <div
                                className="flex items-center justify-center border rounded p-2"
                                style={{ height: "70vh" }}
                            >
                                <p>No PDF available for this quote.</p>
                            </div>
                        )}

                        {/* URL display for debugging */}
                        {pdfUrl && (
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
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button
                        label="Download PDF"
                        icon="pi pi-download"
                        onClick={() => handleDownloadPdf(viewQuote)}
                        disabled={!pdfUrl || downloadingPdf}
                        loading={downloadingPdf}
                        className="mr-2"
                    />

                    {/* Direct link to open in new tab */}
                    {pdfUrl && (
                        <Button
                            label="Open in New Tab"
                            icon="pi pi-external-link"
                            className="p-button-outlined"
                            onClick={() => {
                                window.open(pdfUrl, "_blank");
                            }}
                        />
                    )}
                </div>
            </Dialog>
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header={`Quotes for Survey ${surveyRef || ""}`}
                visible={visible}
                style={{ width: "80vw" }}
                onHide={onHide}
                maximizable
            >
                {loading ? (
                    <div className="flex justify-center p-5">
                        <ProgressSpinner />
                    </div>
                ) : (
                    <DataTable
                        value={quotes}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No quotes found for this survey"
                        stripedRows
                        responsiveLayout="scroll"
                    >
                        <Column field="name" header="Quote Name" sortable />
                        <Column field="refValue" header="Reference" sortable />
                        <Column header="Price" body={formatPrice} sortable />
                        <Column
                            field="createdAt"
                            header="Date Created"
                            body={formatDate}
                            sortable
                        />
                        <Column
                            body={actionTemplate}
                            exportable={false}
                            style={{ width: "15%" }}
                        />
                    </DataTable>
                )}
                {renderViewDialog()}
            </Dialog>
        </>
    );
}
