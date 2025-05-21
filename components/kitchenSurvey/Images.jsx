// components\kitchenSurvey\Images.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
// Import environment variables for Cloudinary configuration
const CLOUDINARY_CLOUD_NAME =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dnu5hunya";
import "primeicons/primeicons.css";
import { Galleria } from "primereact/galleria";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import "primereact/resources/primereact.min.css";
import { getSurveyImageFolder, getCloudinaryUrl } from "@/lib/cloudinary";

export default function Images({
    initialImages = null,
    onImagesChange = null,
    surveyRef = null, // Survey reference for when images are saved
    siteName = null, // Site name for the folder structure
}) {
    // Toast reference for notifications
    const toast = useRef(null);

    // State for storing images for each category
    const [images, setImages] = useState({
        Structure: [],
        Equipment: [],
        Canopy: [],
        Ventilation: [],
    });

    // State to track which galleries are shown
    const [visibleGalleries, setVisibleGalleries] = useState({
        Structure: false,
        Equipment: false,
        Canopy: false,
        Ventilation: false,
    });

    // Flag to prevent notification on initial load
    const initialLoadComplete = useRef(false);

    // Load initial images if provided
    useEffect(() => {
        if (!initialImages) return;

        // Initialize with provided images
        const loadedImages = {
            Structure: Array.isArray(initialImages.Structure)
                ? initialImages.Structure
                : [],
            Equipment: Array.isArray(initialImages.Equipment)
                ? initialImages.Equipment
                : [],
            Canopy: Array.isArray(initialImages.Canopy)
                ? initialImages.Canopy
                : [],
            Ventilation: Array.isArray(initialImages.Ventilation)
                ? initialImages.Ventilation
                : [],
        };

        // Process images to ensure proper URLs
        Object.keys(loadedImages).forEach((category) => {
            loadedImages[category] = loadedImages[category]
                .filter(
                    (img) =>
                        img && (img.publicId || (img.url && img.url !== ""))
                )
                .map((img) => {
                    if (img.publicId && !img.url) {
                        return {
                            ...img,
                            url: getCloudinaryUrl(img.publicId),
                            uploaded: true,
                        };
                    }
                    return { ...img, uploaded: !!img.publicId };
                });
        });

        // Set state with loaded images
        setImages(loadedImages);

        // Show first category with images
        const firstWithImages = Object.keys(loadedImages).find(
            (cat) => loadedImages[cat].length > 0
        );

        if (firstWithImages) {
            setVisibleGalleries((prev) => ({
                ...prev,
                [firstWithImages]: true,
            }));
        }

        initialLoadComplete.current = true;
    }, [initialImages]);

    // Notify parent when images change (but not during initial load)
    useEffect(() => {
        if (!initialLoadComplete.current || !onImagesChange) return;

        // Simple debounce to prevent excessive updates
        const timer = setTimeout(() => {
            onImagesChange(images);
        }, 300);

        return () => clearTimeout(timer);
    }, [images, onImagesChange]);

    // Cleanup blob URLs when component unmounts
    useEffect(() => {
        return () => {
            Object.values(images).forEach((category) => {
                category.forEach((img) => {
                    if (img?.url?.startsWith("blob:")) {
                        URL.revokeObjectURL(img.url);
                    }
                });
            });
        };
    }, []);

    // Simple handler for adding new images
    const handleFileChange = (e, category) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            // Create image objects with blob URLs
            const newImages = files.map((file) => {
                // Create a unique ID for the image
                const id = `${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                return {
                    id: id,
                    file: file,
                    url: URL.createObjectURL(file),
                    alt: file.name,
                    title: file.name,
                    fileName: file.name,
                    category: category,
                    uploaded: false,
                    timestamp: Date.now(), // Add timestamp for stable sorting
                };
            });

            // Update state
            setImages((prev) => ({
                ...prev,
                [category]: [...prev[category], ...newImages],
            }));

            // Automatically show gallery when images are added
            setVisibleGalleries((prev) => ({
                ...prev,
                [category]: true,
            }));

            // Show success message
            toast.current?.show({
                severity: "success",
                summary: "Images Added",
                detail: `Added ${newImages.length} images to ${category}`,
                life: 3000,
            });
        } catch (error) {
            console.error("Error adding images:", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to add images",
                life: 3000,
            });
        } finally {
            e.target.value = null;
        }
    };

    // Toggle gallery visibility
    const toggleGallery = (category) => {
        setVisibleGalleries((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    // Remove an image
    const removeImage = (category, index) => {
        setImages((prev) => {
            const newImages = { ...prev };

            // Revoke blob URL if needed
            const image = newImages[category][index];
            if (image?.url?.startsWith("blob:")) {
                URL.revokeObjectURL(image.url);
            }

            // Remove the image
            newImages[category].splice(index, 1);
            return newImages;
        });
    };

    // Simple image template - using ID as key for stable rendering
    const itemTemplate = (item, index, category) => (
        <div
            key={item.id || `img-${index}`}
            style={{ position: "relative", width: "100%", height: "100%" }}
        >
            <img
                src={item.url || null}
                alt={item.fileName || item.alt || "Image"}
                style={{
                    width: "100%",
                    display: "block",
                    objectFit: "contain",
                    maxHeight: "400px",
                }}
            />

            {/* Delete button */}
            <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-danger p-button-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    removeImage(category, index);
                }}
                style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    zIndex: 1,
                }}
            />

            {/* Only show pending upload indicator */}
            {!item.uploaded && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        background: "rgba(0,0,0,0.5)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                    }}
                >
                    Pending Upload
                </div>
            )}
        </div>
    );

    // Simple thumbnail template - using ID as key for stable rendering
    const thumbnailTemplate = (item) => (
        <img
            key={item.id || `thumb-${item.timestamp}`}
            src={item.url || null}
            alt={item.fileName || item.alt || "Thumbnail"}
            style={{
                width: "50px",
                height: "50px",
                objectFit: "cover",
                display: "block",
            }}
        />
    );

    const categories = ["Structure", "Equipment", "Canopy", "Ventilation"];

    return (
        <div className="p-4">
            {/* Toast for notifications */}
            <Toast ref={toast} />

            {/* Categories */}
            {categories.map((category) => (
                <div key={category} className="mb-6">
                    <h3 className="mb-2">{category}</h3>
                    <div className="flex gap-2 mb-3">
                        {/* Gallery Upload Button */}
                        <button
                            onClick={() =>
                                document
                                    .getElementById(
                                        `file-input-gallery-${category}`
                                    )
                                    .click()
                            }
                            style={{
                                padding: "0 20px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                height: "40px",
                            }}
                        >
                            <i className="pi pi-images"></i>
                            <span>From Gallery</span>
                        </button>
                        <input
                            id={`file-input-gallery-${category}`}
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handleFileChange(e, category)}
                        />

                        {/* Camera Button */}
                        <button
                            onClick={() =>
                                document
                                    .getElementById(
                                        `file-input-camera-${category}`
                                    )
                                    .click()
                            }
                            style={{
                                padding: "0 20px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                height: "40px",
                            }}
                        >
                            <i className="pi pi-camera"></i>
                            <span>Take Photo</span>
                        </button>
                        <input
                            id={`file-input-camera-${category}`}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: "none" }}
                            onChange={(e) => handleFileChange(e, category)}
                        />

                        {/* Gallery toggle button */}
                        {images[category]?.length > 0 && (
                            <Button
                                style={{
                                    padding: "0 20px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    height: "40px",
                                }}
                                icon={
                                    visibleGalleries[category]
                                        ? "pi pi-eye-slash"
                                        : "pi pi-eye"
                                }
                                label={
                                    visibleGalleries[category]
                                        ? "Hide Images"
                                        : `Show Images (${images[category].length})`
                                }
                                onClick={() => toggleGallery(category)}
                                className="p-button-outlined"
                            />
                        )}
                    </div>

                    {/* Display images as a simpler list instead of using Galleria */}
                    {visibleGalleries[category] &&
                        images[category]?.length > 0 && (
                            <div className="card">
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "10px",
                                    }}
                                >
                                    {images[category].map((image, index) => (
                                        <div
                                            key={
                                                image.id ||
                                                `img-container-${index}`
                                            }
                                            style={{
                                                position: "relative",
                                                width: "140px",
                                                height: "140px",
                                                border: "1px solid #ddd",
                                                borderRadius: "4px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <img
                                                src={image.url || null}
                                                alt={
                                                    image.fileName ||
                                                    image.alt ||
                                                    "Image"
                                                }
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                            <Button
                                                icon="pi pi-trash"
                                                className="p-button-rounded p-button-danger p-button-sm"
                                                onClick={() =>
                                                    removeImage(category, index)
                                                }
                                                style={{
                                                    position: "absolute",
                                                    top: "5px",
                                                    right: "5px",
                                                    zIndex: 1,
                                                }}
                                            />
                                            {!image.uploaded && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        bottom: "5px",
                                                        right: "5px",
                                                        background:
                                                            "rgba(0,0,0,0.5)",
                                                        color: "white",
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    Pending
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                </div>
            ))}
        </div>
    );
}
