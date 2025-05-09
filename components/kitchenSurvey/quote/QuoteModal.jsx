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

export default function QuoteModal({ visible, onHide, surveyId, surveyRef }) {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewQuote, setViewQuote] = useState(null);
    const [viewDialogVisible, setViewDialogVisible] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        if (visible && surveyId) {
            fetchQuotes();
        }
    }, [visible, surveyId]);

    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/quotes?surveyId=${surveyId}`);

            if (!response.ok) {
                throw new Error("Failed to fetch quotes");
            }

            const data = await response.json();
            setQuotes(data);
        } catch (error) {
            console.error("Error fetching quotes:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to fetch quotes",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/quotes/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete quote");
            }

            setQuotes(quotes.filter((quote) => quote._id !== id));

            toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Quote deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting quote:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to delete quote",
            });
        }
    };

    const confirmDelete = (id) => {
        confirmDialog({
            message: `Are you sure you want to delete this quote?`,
            header: "Delete Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => handleDelete(id),
        });
    };

    const handleView = (quote) => {
        setViewQuote(quote);
        setViewDialogVisible(true);
    };

    const formatDate = (rowData) => {
        return new Date(rowData.createdAt).toLocaleDateString();
    };

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
                    onClick={() => confirmDelete(rowData._id)}
                    tooltip="Delete Quote"
                />
            </div>
        );
    };

    const renderViewDialog = () => {
        if (!viewQuote) return null;

        return (
            <Dialog
                header={`Quote: ${viewQuote.name}`}
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
                            {viewQuote.pdfData && (
                                <img
                                    src={viewQuote.pdfData}
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
                            {viewQuote.schematicImg ? (
                                <img
                                    src={viewQuote.schematicImg}
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
                            const link = document.createElement("a");
                            link.href = viewQuote.pdfData;
                            link.download = `${viewQuote.name}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    />
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
