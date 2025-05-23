// components/kitchenSurvey/quote/PreviewPDFModal.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { generateStyledHtml } from "@/components/kitchenSurvey/save/SavePDF";

export default function PreviewPDFModal({
    visible,
    onHide,
    surveyData,
    schematicHtml,
}) {
    const [loading, setLoading] = useState(true);
    const [previewHtml, setPreviewHtml] = useState("");
    const [useAlternativeViewer, setUseAlternativeViewer] = useState(false);
    const toast = useRef(null);
    const iframeRef = useRef(null);

    useEffect(() => {
        // FIXED: Make this async and await the generateStyledHtml call
        const generatePreview = async () => {
            if (visible && surveyData) {
                setLoading(true);
                try {
                    console.log("Starting PDF preview generation...");

                    // FIXED: Await the async generateStyledHtml function
                    const htmlContent = await generateStyledHtml(
                        surveyData,
                        schematicHtml
                    );

                    console.log(
                        "HTML content generated successfully, length:",
                        htmlContent?.length || 0
                    );
                    setPreviewHtml(htmlContent);

                    // Set a brief timeout to allow the rendering to complete
                    setTimeout(() => {
                        setLoading(false);
                    }, 500);
                } catch (error) {
                    console.error("Error generating preview:", error);
                    toast.current?.show({
                        severity: "error",
                        summary: "Preview Error",
                        detail:
                            "Failed to generate preview: " +
                            (error.message || "Unknown error"),
                        life: 5000,
                    });
                    setLoading(false);
                }
            }
        };

        // Call the async function
        generatePreview();
    }, [visible, surveyData, schematicHtml]);

    // Function to handle iframe load events
    const handleIframeLoad = () => {
        setLoading(false);

        // Apply additional styling to the iframe content if needed
        if (iframeRef.current) {
            try {
                const iframeDoc =
                    iframeRef.current.contentDocument ||
                    iframeRef.current.contentWindow.document;
                // Additional styling could be applied here if needed
            } catch (e) {
                console.warn("Could not access iframe document:", e);
            }
        }
    };

    // Render the preview content
    const renderPreviewContent = () => {
        if (loading) {
            return (
                <div
                    className="flex justify-center items-center"
                    style={{ height: "90vh" }}
                >
                    <ProgressSpinner
                        style={{ width: "50px", height: "50px" }}
                    />
                    <div className="ml-2">
                        Generating preview with images...
                    </div>
                </div>
            );
        }

        if (!previewHtml) {
            return (
                <div
                    className="flex justify-center items-center bg-gray-100 p-8 rounded"
                    style={{ height: "90vh" }}
                >
                    <div className="text-center">
                        <i className="pi pi-file-pdf text-red-500 text-4xl mb-3"></i>
                        <p className="text-lg">No preview available.</p>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="flex-grow"
                style={{ height: "90vh", width: "100%" }}
            >
                {/* Toggle for viewer type */}
                <div style={{ marginBottom: "0.5rem", textAlign: "center" }}>
                    <Button
                        label={
                            useAlternativeViewer
                                ? "Use Standard Viewer"
                                : "Use Alternative Viewer"
                        }
                        icon="pi pi-sync"
                        className="p-button-outlined p-button-sm"
                        onClick={() =>
                            setUseAlternativeViewer(!useAlternativeViewer)
                        }
                    />
                </div>

                {useAlternativeViewer ? (
                    // Direct HTML embed using srcdoc (alternative viewer)
                    <div
                        style={{
                            width: "100%",
                            height: "calc(90vh - 40px)",
                            border: "1px solid #ddd",
                            overflow: "auto",
                            backgroundColor: "white",
                        }}
                    >
                        <iframe
                            srcDoc={previewHtml}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                            }}
                            title="PDF Preview"
                            sandbox="allow-same-origin"
                            ref={iframeRef}
                            onLoad={handleIframeLoad}
                        />
                    </div>
                ) : (
                    // Standard iframe approach with data URI
                    <iframe
                        srcDoc={previewHtml}
                        style={{
                            width: "100%",
                            height: "calc(90vh - 40px)",
                            border: "1px solid #ddd",
                        }}
                        title="PDF Preview"
                        ref={iframeRef}
                        onLoad={handleIframeLoad}
                    />
                )}
            </div>
        );
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header={`PDF Preview${
                    surveyData?.refValue ? ` - ${surveyData.refValue}` : ""
                }`}
                visible={visible}
                style={{ width: "98vw", maxWidth: "1800px", height: "98vh" }}
                onHide={onHide}
                maximizable
                contentStyle={{ padding: "0", overflow: "hidden" }}
                draggable={false}
                resizable={false}
            >
                {/* Preview content only - no extra buttons */}
                {renderPreviewContent()}
            </Dialog>
        </>
    );
}
