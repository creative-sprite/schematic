// components\PDF\export.jsx

"use client";

import { useState, useEffect } from "react";
import html2canvas from "html2canvas";

export default function ExportPDF({
    targetRef,
    fileName = "document.pdf",
    buttonText = "Save as PDF",
}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [jsPDFModule, setJsPDFModule] = useState(null);

    // Dynamically import jsPDF only on the client side
    useEffect(() => {
        import("jspdf")
            .then((module) => {
                setJsPDFModule(() => module.default);
            })
            .catch((error) => {
                console.error("Failed to load jsPDF:", error);
            });
    }, []);

    const handleSavePDF = async () => {
        if (!targetRef.current) {
            console.error("No element found for exporting PDF.");
            return;
        }

        if (!jsPDFModule) {
            console.error("PDF generation module is not loaded yet.");
            return;
        }

        setIsGenerating(true);

        try {
            const canvas = await html2canvas(targetRef.current, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDFModule("p", "pt", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            onClick={handleSavePDF}
            disabled={isGenerating || !jsPDFModule}
            className={!jsPDFModule ? "opacity-50 cursor-not-allowed" : ""}
        >
            {isGenerating
                ? "Generating PDF..."
                : !jsPDFModule
                ? "Loading PDF generator..."
                : buttonText}
        </button>
    );
}
