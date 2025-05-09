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

/**
 * Component for displaying saved quotes
 * - Lists all saved quotes with options to view or delete
 * - Shows PDF and schematic image when viewing a quote
 */
export default function QuoteList() {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [viewDialogVisible, setViewDialogVisible] = useState(false);
    const [existingSurveys, setExistingSurveys] = useState({});
    const toast = useRef(null);

    // Fetch quotes on component mount
    useEffect(() => {
        fetchQuotes();
    }, []);

    // Fetch all quotes from the API
    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/quotes");

            if (!response.ok) {
                throw new Error("Failed to fetch quotes");
            }

            const data = await response.json();
            setQuotes(data);

            // Check if the related surveys exist
            checkSurveyExistence(data);
        } catch (error) {
            console.error("Error fetching quotes:", error);
            if (toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to fetch quotes",
                });
            }
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

            // Check each survey existence
            for (const surveyId of surveyIds) {
                if (!surveyId) continue;

                try {
                    // Try to fetch the survey by ID
                    const response = await fetch(
                        `/api/surveys/kitchenSurveys/viewAll/${surveyId}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        // Mark as existing only if response is ok AND we have data
                        surveyStatus[surveyId] = data.success && data.data;
                    } else {
                        // Survey doesn't exist
                        surveyStatus[surveyId] = false;
                    }
                } catch (error) {
                    // Any error means the survey doesn't exist
                    surveyStatus[surveyId] = false;
                }
            }

            console.log("Survey existence status:", surveyStatus);
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

            if (toast.current) {
                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: "Quote deleted successfully",
                });
            }
        } catch (error) {
            console.error("Error deleting quote:", error);
            if (toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to delete quote",
                });
            }
        }
    };

    // Confirm quote deletion
    const confirmDelete = (id, name) => {
        confirmDialog({
            message: `Are you sure you want to delete the quote "${name}"?`,
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
        // More explicit check for survey existence
        const surveyId = rowData.surveyId;
        const surveyExists = surveyId && existingSurveys[surveyId] === true;

        return (
            <div>
                <div>{rowData.refValue || "N/A"}</div>
                {surveyId && existingSurveys[surveyId] === false && (
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

    // Format price with robust handling of NaN and invalid values
    const formatPrice = (rowData) => {
        // Extract the price, handling potential NaN and invalid values
        let price = rowData.surveyData?.priceTotal;

        // Explicitly check for NaN, null, undefined or non-numeric values
        if (
            price === null ||
            price === undefined ||
            isNaN(price) ||
            typeof price !== "number"
        ) {
            // Try to convert it if it's a string representing a number
            if (typeof price === "string" && !isNaN(parseFloat(price))) {
                price = parseFloat(price);
            } else if (rowData.totalPrice && !isNaN(rowData.totalPrice)) {
                // Fall back to totalPrice field if it exists and is valid
                price = Number(rowData.totalPrice);
            } else {
                // Final fallback to zero
                price = 0;
            }
        }

        // Ensure it's a valid number before formatting
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
        }).format(price);
    };

    // Action buttons template
    const actionTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-text"
                    onClick={() => handleView(rowData)}
                    tooltip="View Quote"
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

    // PDF and schematic viewer dialog
    const renderViewDialog = () => {
        if (!selectedQuote) return null;

        return (
            <Dialog
                header={`Quote: ${selectedQuote.name}`}
                visible={viewDialogVisible}
                style={{ width: "90vw", maxWidth: "1200px" }}
                onHide={() => setViewDialogVisible(false)}
                maximizable
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PDF View */}
                    <div className="col-span-1">
                        <h3 className="text-xl mb-2">Survey Information</h3>
                        <div
                            className="border rounded p-2 overflow-auto"
                            style={{ height: "70vh" }}
                        >
                            {selectedQuote.pdfData && (
                                <img
                                    src={selectedQuote.pdfData}
                                    alt="Survey PDF"
                                    style={{ width: "100%" }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Schematic View */}
                    <div className="col-span-1">
                        <h3 className="text-xl mb-2">Schematic Layout</h3>
                        <div
                            className="border rounded p-2 overflow-auto"
                            style={{ height: "70vh" }}
                        >
                            {selectedQuote.schematicImg ? (
                                <img
                                    src={selectedQuote.schematicImg}
                                    alt="Schematic Layout"
                                    style={{ width: "100%" }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p>No schematic image available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button
                        label="Download PDF"
                        icon="pi pi-download"
                        onClick={() => {
                            // Create a temporary link to download the PDF
                            const link = document.createElement("a");
                            link.href = selectedQuote.pdfData;
                            link.download = `${selectedQuote.name}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    />
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

            {loading ? (
                <div className="flex justify-center p-5">
                    <ProgressSpinner />
                </div>
            ) : (
                <DataTable
                    value={quotes}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    emptyMessage={emptyTemplate}
                    stripedRows
                    responsiveLayout="scroll"
                >
                    <Column field="name" header="Quote Name" sortable />
                    <Column
                        field="refValue"
                        header="Reference"
                        body={referenceTemplate}
                        sortable
                    />
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
        </Card>
    );
}
