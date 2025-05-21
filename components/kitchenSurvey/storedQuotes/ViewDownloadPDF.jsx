// components/kitchenSurvey/storedQuotes/viewDownloadPDF.jsx
"use client";

import { useState, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { getCloudinaryPdfUrl } from "@/lib/cloudinary";

export default function ViewDownloadPDF({
    visible,
    onHide,
    quote,
    toast, // Optional toast reference for notifications
}) {
    const [downloading, setDownloading] = useState(false);

    // Function to get PDF URL using the standard function
    const getPdfUrl = () => {
        if (!quote || !quote.cloudinary?.publicId) return null;

        // Use the standard function to generate a proper PDF URL
        return getCloudinaryPdfUrl(quote.cloudinary.publicId);
    };

    // Function to download the PDF
    const handleDownloadPdf = async () => {
        const pdfUrl = getPdfUrl();

        if (!pdfUrl) {
            if (toast && toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "PDF not available for download",
                    life: 3000,
                });
            }
            return;
        }

        try {
            setDownloading(true);

            // Create a temporary link to download the PDF
            const link = document.createElement("a");
            link.href = pdfUrl;
            // Force the download filename to have .pdf extension
            link.download = `${quote.name || "Quote"}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (toast && toast.current) {
                toast.current.show({
                    severity: "success",
                    summary: "Success",
                    detail: "PDF download started",
                    life: 3000,
                });
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
            if (toast && toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to download PDF",
                    life: 3000,
                });
            }
        } finally {
            setDownloading(false);
        }
    };

    // Generate the dialog footer with the download button
    const renderFooter = () => {
        return (
            <div className="flex justify-content-start">
                <Button
                    icon="pi pi-download"
                    className="p-button-rounded p-button-primary"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    loading={downloading}
                    tooltip="Download PDF"
                />
            </div>
        );
    };

    const pdfUrl = getPdfUrl();

    return (
        <Dialog
            header={`PDF Quote - ${quote?.name || "Quote"}`}
            visible={visible}
            style={{ width: "80vw", height: "80vh" }}
            onHide={onHide}
            maximizable
            modal
            blockScroll
            footer={renderFooter()}
        >
            {quote && pdfUrl ? (
                <iframe
                    src={pdfUrl}
                    style={{
                        width: "100%",
                        height: "calc(80vh - 100px)",
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
    );
}
