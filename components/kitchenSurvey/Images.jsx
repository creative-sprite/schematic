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
import { getSurveyImageFolder } from "@/lib/cloudinary";

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

    // Load initial images if provided
    useEffect(() => {
        // Log when this effect runs for debugging
        console.log("[Images] initialImages effect triggered", {
            hasData: !!initialImages,
            isObject: typeof initialImages === "object",
            categoriesIfPresent: initialImages
                ? Object.keys(initialImages)
                : "none",
        });

        if (initialImages && typeof initialImages === "object") {
            // Initialize with provided images or empty arrays for each category
            const loadedImages = {
                Structure: initialImages.Structure || [],
                Equipment: initialImages.Equipment || [],
                Canopy: initialImages.Canopy || [],
                Ventilation: initialImages.Ventilation || [],
            };

            // Process each image to ensure URLs are correctly formatted for display
            Object.keys(loadedImages).forEach((category) => {
                loadedImages[category] = loadedImages[category].map((img) => {
                    // If this is a Cloudinary image (has publicId)
                    if (img.publicId) {
                        console.log(
                            `[Images] Processing Cloudinary image in ${category}:`,
                            {
                                publicId: img.publicId,
                                hasSecureUrl: !!img.secureUrl,
                                hasUrl: !!img.url,
                            }
                        );

                        // Make sure we have a valid URL for display
                        const displayUrl = img.secureUrl || img.url;

                        if (!displayUrl) {
                            console.warn(
                                `[Images] Cloudinary image missing URL:`,
                                img
                            );

                            // If we have a publicId but no URL, construct one
                            if (img.publicId) {
                                // Construct a Cloudinary URL from the publicId
                                const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${img.publicId}`;
                                console.log(
                                    `[Images] Constructed Cloudinary URL: ${cloudinaryUrl}`
                                );

                                return {
                                    ...img,
                                    url: cloudinaryUrl,
                                    isCloudinary: true,
                                };
                            }
                        }

                        // Return with valid URL and Cloudinary flag
                        return {
                            ...img,
                            url: displayUrl,
                            isCloudinary: true,
                        };
                    }

                    // For non-Cloudinary images or if publicId is missing, return as is
                    return img;
                });
            });

            // Log what we're loading for debugging
            console.log("[Images] Loading initial images:", {
                Structure: `${loadedImages.Structure.length} images`,
                Equipment: `${loadedImages.Equipment.length} images`,
                Canopy: `${loadedImages.Canopy.length} images`,
                Ventilation: `${loadedImages.Ventilation.length} images`,
            });

            // If we have any images, automatically show the first gallery with images
            if (!Object.values(visibleGalleries).some((v) => v)) {
                const firstCategoryWithImages = Object.keys(loadedImages).find(
                    (cat) => loadedImages[cat].length > 0
                );

                if (firstCategoryWithImages) {
                    console.log(
                        `[Images] Auto-showing gallery for ${firstCategoryWithImages} with ${loadedImages[firstCategoryWithImages].length} images`
                    );
                    // Show this gallery
                    setTimeout(() => {
                        setVisibleGalleries((prev) => ({
                            ...prev,
                            [firstCategoryWithImages]: true,
                        }));
                    }, 500);
                }
            }

            // Count Cloudinary vs local images for debugging
            let cloudinaryCount = 0;
            let pendingCount = 0;
            let urlMissingCount = 0;
            let totalCount = 0;

            Object.values(loadedImages)
                .flat()
                .forEach((img) => {
                    totalCount++;
                    if (img.publicId) cloudinaryCount++;
                    if (img.metadata?.pendingUpload) pendingCount++;
                    if (img.publicId && !img.url) urlMissingCount++;
                });

            // If we have images, log a clear message indicating the image count
            if (totalCount > 0) {
                console.log(
                    `[Images] ✅ LOADED ${totalCount} IMAGES - ${cloudinaryCount} from Cloudinary, ${pendingCount} pending upload`
                );

                // When receiving delayed images, show a success toast
                if (totalCount > 0) {
                    toast.current?.show({
                        severity: "success",
                        summary: "Images Loaded",
                        detail: `Successfully loaded ${totalCount} images`,
                        life: 3000,
                    });
                }

                // Refresh visible galleries to ensure images display properly
                Object.keys(visibleGalleries).forEach((category) => {
                    if (
                        visibleGalleries[category] &&
                        loadedImages[category].length > 0
                    ) {
                        // Force a refresh of the gallery by toggling it off and on again
                        console.log(
                            `[Images] Refreshing gallery display for ${category}`
                        );
                        setVisibleGalleries((prev) => ({
                            ...prev,
                            [category]: false,
                        }));

                        setTimeout(() => {
                            setVisibleGalleries((prev) => ({
                                ...prev,
                                [category]: true,
                            }));
                        }, 100);
                    }
                });
            } else {
                console.log(
                    "[Images] ⚠️ No images found in initialImages object"
                );
            }

            setImages(loadedImages);
        }
    }, [initialImages, siteName, surveyRef]);

    // Notify parent component when images change
    useEffect(() => {
        if (onImagesChange && typeof onImagesChange === "function") {
            console.log("[Images] Images changed - preparing to notify parent");

            const serializableImages = getSerializableImages();

            // Log details about what we're passing to parent
            let pendingCount = 0;
            let cloudinaryCount = 0;
            let hasFileCount = 0;

            Object.values(serializableImages)
                .flat()
                .forEach((img) => {
                    if (img.file) hasFileCount++;
                    if (img.metadata?.pendingUpload) pendingCount++;
                    if (img.publicId) cloudinaryCount++;
                });

            console.log("[Images] Notifying parent with images:", {
                totalImages: Object.values(serializableImages).flat().length,
                pendingUploads: pendingCount,
                cloudinaryImages: cloudinaryCount,
                imagesWithFiles: hasFileCount,
                categories: Object.keys(serializableImages),
            });

            // Pass the serializable version to parent that includes file references
            onImagesChange(serializableImages);
        }
    }, [images, onImagesChange]);

    // Cleanup object URLs when component unmounts
    useEffect(() => {
        return () => {
            Object.values(images).forEach((categoryImages) => {
                categoryImages.forEach((image) => {
                    if (
                        image &&
                        image.url &&
                        typeof image.url === "string" &&
                        image.url.startsWith("blob:")
                    ) {
                        try {
                            URL.revokeObjectURL(image.url);
                        } catch (e) {
                            console.error("Error revoking URL on unmount:", e);
                        }
                    }
                });
            });
        };
    }, [images]);

    // Helper to create serializable image objects for saving
    const getSerializableImages = () => {
        // Create a deep copy of images that can be serialized
        const serializableImages = {};

        Object.keys(images).forEach((category) => {
            // Initialize with empty array to prevent undefined errors
            serializableImages[category] = [];

            // Process each image in the category
            images[category].forEach((img, index) => {
                // Log what we're processing for debugging
                console.log(`[Images] Processing ${category} image ${index}:`, {
                    hasFile: !!img.file,
                    hasPendingFlag: !!img.metadata?.pendingUpload,
                    publicId: img.publicId || "none",
                });

                // Extract only serializable properties
                // For locally stored images (not yet uploaded to Cloudinary)
                if (img.file) {
                    // Create a proper object with file reference preserved
                    const serializedImg = {
                        url: img.url,
                        alt: img.alt || "",
                        title: img.title || "",
                        file: img.file, // CRITICAL: Keep the actual file object for later upload
                        metadata: {
                            ...(img.metadata || {}),
                            pendingUpload: true,
                            category: category, // Ensure category is preserved
                        },
                    };

                    serializableImages[category].push(serializedImg);
                }
                // For images already in Cloudinary
                else {
                    const serializedImg = {
                        publicId: img.publicId,
                        url: img.url,
                        secureUrl: img.secureUrl || img.url,
                        alt: img.alt || "",
                        title: img.title || "",
                        format: img.format,
                        width: img.width,
                        height: img.height,
                        caption: img.caption || "",
                        uploadedAt: img.uploadedAt || new Date().toISOString(),
                        metadata: {
                            ...(img.metadata || {}),
                            pendingUpload: false,
                            category: category, // Ensure category is preserved
                        },
                    };

                    serializableImages[category].push(serializedImg);
                }
            });

            // Log results for this category
            console.log(`[Images] Serialized ${category} images:`, {
                count: serializableImages[category].length,
                withFiles: serializableImages[category].filter(
                    (img) => !!img.file
                ).length,
            });
        });

        return serializableImages;
    };

    // Handler for file input change (from gallery or camera) with immediate upload
    const handleFileChange = async (e, category) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        console.log(
            `[Images] Adding ${files.length} files to ${category} category`
        );
        console.log(
            "[Images] File details:",
            files.map((f) => ({
                name: f.name,
                type: f.type,
                size: f.size,
            }))
        );

        try {
            // Show upload in progress toast
            toast.current.show({
                severity: "info",
                summary: "Upload Started",
                detail: `Uploading ${files.length} image(s) to Cloudinary...`,
                life: 3000,
            });

            // Process each file with immediate upload to Cloudinary
            const newImages = await Promise.all(
                files.map(async (file) => {
                    // Create a data URL for preview
                    const dataUrl = URL.createObjectURL(file);

                    // Create the initial image object for preview
                    const imageObject = {
                        file: file,
                        url: dataUrl,
                        alt: file.name,
                        title: file.name,
                        metadata: {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            lastModified: file.lastModified,
                            timestamp: Date.now(),
                            category: category,
                            pendingUpload: true,
                        },
                    };

                    // Attempt immediate upload to Cloudinary
                    try {
                        // Use the helper function for consistent folder structure
                        const folder = getSurveyImageFolder(
                            siteName,
                            surveyRef,
                            category
                        );

                        console.log(
                            `[Images] Auto-uploading ${file.name} to Cloudinary folder: ${folder}`
                        );

                        // Create form data for upload to our server API
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("folder", folder);
                        formData.append("preserveFilename", "true"); // Preserve original filename without timestamp

                        console.log(
                            `[Images] Auto-uploading ${file.name} to Cloudinary folder: ${folder} (preserving original filename)`
                        );

                        // Upload to server-side API endpoint
                        const response = await fetch("/api/cloudinary/upload", {
                            method: "POST",
                            body: formData,
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error(
                                `[Images] Upload error for ${file.name}:`,
                                response.status,
                                errorText
                            );
                            throw new Error(
                                `Upload failed: ${response.statusText}`
                            );
                        }

                        const result = await response.json();
                        console.log(
                            `[Images] ${file.name} upload result:`,
                            result
                        );

                        if (!result.success) {
                            throw new Error(result.message || "Upload failed");
                        }

                        // Return a Cloudinary image object instead
                        return {
                            publicId: result.data.public_id,
                            url: result.data.secure_url,
                            secureUrl: result.data.secure_url,
                            alt: file.name,
                            title: file.name,
                            format: result.data.format,
                            width: result.data.width,
                            height: result.data.height,
                            uploadedAt: new Date().toISOString(),
                            metadata: {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                category: category,
                                pendingUpload: false, // No longer pending - already uploaded
                                cloudinary: true,
                            },
                        };
                    } catch (uploadError) {
                        console.error(
                            `[Images] Error auto-uploading ${file.name}:`,
                            uploadError
                        );

                        // Return the local image object if upload fails
                        // We'll try again when saving
                        return imageObject;
                    }
                })
            );

            // Count successfully uploaded images
            const uploadedCount = newImages.filter(
                (img) => img.publicId
            ).length;
            const totalCount = newImages.length;

            // Update state with new images (which now have Cloudinary URLs if upload succeeded)
            setImages((prev) => {
                const updatedCategory = [...prev[category], ...newImages];

                // Important: Notify parent component of changes right away
                if (onImagesChange && typeof onImagesChange === "function") {
                    const allImages = { ...prev, [category]: updatedCategory };
                    console.log(
                        `[Images] Calling onImagesChange with updated images:`,
                        {
                            categories: Object.keys(allImages),
                            totalImagesCount:
                                Object.values(allImages).flat().length,
                            uploadedToCloudinary: uploadedCount,
                        }
                    );
                    onImagesChange(allImages);
                }

                return {
                    ...prev,
                    [category]: updatedCategory,
                };
            });

            // Show appropriate success message
            if (uploadedCount === totalCount) {
                toast.current.show({
                    severity: "success",
                    summary: "Upload Complete",
                    detail: `Successfully uploaded ${uploadedCount} image(s) to Cloudinary`,
                    life: 3000,
                });
            } else if (uploadedCount > 0) {
                toast.current.show({
                    severity: "warning",
                    summary: "Partial Upload",
                    detail: `Uploaded ${uploadedCount} of ${totalCount} images. Some will upload when saving.`,
                    life: 4000,
                });
            } else {
                toast.current.show({
                    severity: "error",
                    summary: "Upload Failed",
                    detail: `Failed to upload images to Cloudinary. Will try again when saving.`,
                    life: 4000,
                });
            }
        } catch (error) {
            console.error("[Images] Error processing images:", error);

            // Show error message
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to process images",
                life: 3000,
            });
        }

        // Clear the input value to allow selecting the same file again
        e.target.value = null;
    };

    // Test direct upload to Cloudinary via server API
    const testDirectUpload = async (image, category) => {
        try {
            if (!image || !image.file) {
                console.error("[Images] Cannot test upload - missing file");
                return null;
            }

            toast.current.show({
                severity: "info",
                summary: "Testing Upload",
                detail: `Uploading ${image.file.name} directly to Cloudinary...`,
                life: 3000,
            });

            console.log("[Images] Testing direct upload for:", image.file.name);

            // Create folder path
            const siteNameSafe = siteName
                ? siteName.replace(/[:/\\?*"|<>]/g, "-")
                : "test-upload";
            const folder = `surveys/${siteNameSafe}/${
                surveyRef || "test"
            }/${category.toLowerCase()}`;

            // Create form data for upload
            const formData = new FormData();
            formData.append("file", image.file);
            formData.append("folder", folder);
            formData.append("preserveFilename", "true"); // Preserve original filename without timestamp

            console.log(
                "[Images] Sending to /api/cloudinary/upload with folder:",
                folder
            );

            // Upload to server API endpoint
            const response = await fetch("/api/cloudinary/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "[Images] Upload response error:",
                    response.status,
                    errorText
                );
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log("[Images] Upload result:", result);

            if (!result.success) {
                throw new Error(result.message || "Upload failed");
            }

            // Show success
            toast.current.show({
                severity: "success",
                summary: "Test Upload Success",
                detail: `Uploaded to Cloudinary: ${result.data.public_id}`,
                life: 5000,
            });

            return result.data;
        } catch (error) {
            console.error("[Images] Test upload error:", error);
            toast.current.show({
                severity: "error",
                summary: "Test Upload Failed",
                detail: error.message,
                life: 5000,
            });
            return null;
        }
    };

    // Toggle gallery visibility
    const toggleGallery = (category) => {
        setVisibleGalleries((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    // Function to remove image directly (no confirmation dialog)
    const removeImage = (categoryName, imageIndex) => {
        try {
            // Create a copy of the current images
            const newImages = { ...images };

            // Verify the category and index are valid
            if (
                !newImages[categoryName] ||
                imageIndex < 0 ||
                imageIndex >= newImages[categoryName].length
            ) {
                console.log(
                    `Invalid category or index: ${categoryName}, ${imageIndex}`
                );
                return;
            }

            // Get the image to delete
            const imageToDelete = newImages[categoryName][imageIndex];

            // Revoke the object URL if it's a temporary blob URL
            if (
                imageToDelete &&
                imageToDelete.url &&
                typeof imageToDelete.url === "string" &&
                imageToDelete.url.startsWith("blob:")
            ) {
                try {
                    URL.revokeObjectURL(imageToDelete.url);
                } catch (error) {
                    console.error("Error revoking URL:", error);
                }
            }

            // Remove the image from the array
            newImages[categoryName].splice(imageIndex, 1);

            // Update the state with the new images
            setImages(newImages);

            // Notify parent immediately after removing image
            if (onImagesChange && typeof onImagesChange === "function") {
                const serializableImages = getSerializableImages();
                console.log("[Images] Notifying parent after image removal");
                onImagesChange(serializableImages);
            }

            // Show success message
            if (toast.current) {
                toast.current.show({
                    severity: "success",
                    summary: "Image Deleted",
                    detail: "Image was successfully removed",
                    life: 3000,
                });
            }
        } catch (error) {
            console.error("Error removing image:", error);

            // Show error message
            if (toast.current) {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: "Failed to remove image",
                    life: 3000,
                });
            }
        }
    };

    // Enhanced Galleria templates with better Cloudinary handling
    const itemTemplate = (item, index, category) => {
        let imageUrl;

        // Determine the best URL to use with robust Cloudinary handling
        if (item.publicId) {
            // For Cloudinary images, try several possible sources in order of preference
            imageUrl = item.secureUrl || item.url;

            // If no URL was provided but we have publicId, construct the URL
            if (!imageUrl) {
                imageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${item.publicId}`;
                console.log(
                    `[Images] Reconstructed Cloudinary URL from publicId: ${imageUrl}`
                );
            }
        } else {
            // For non-Cloudinary images
            imageUrl = item.url;
        }

        console.log(`[Images] Rendering image ${index} in ${category}:`, {
            publicId: item.publicId || "none",
            hasUrl: !!item.url,
            hasSecureUrl: !!item.secureUrl,
            usingUrl: imageUrl ? imageUrl.substring(0, 50) + "..." : "MISSING",
            metadata: item.metadata
                ? {
                      originalName: item.metadata.originalName || "unknown",
                      pendingUpload: !!item.metadata.pendingUpload,
                      category: item.metadata.category || "unknown",
                  }
                : "no metadata",
        });

        return (
            <div
                style={{ position: "relative", width: "100%", height: "100%" }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.alt || "Image"}
                        style={{
                            width: "100%",
                            display: "block",
                            objectFit: "contain",
                            maxHeight: "400px",
                        }}
                        onError={(e) => {
                            console.error(`[Images] Error loading image:`, {
                                url: imageUrl,
                                error: e.message,
                            });
                            // Replace with a fallback image or error message
                            e.target.src =
                                "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%3E%3Crect%20fill%3D%22%23d3d3d3%22%20width%3D%22400%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20x%3D%22200%22%20y%3D%22150%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%3EImage%20Error%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E";
                            // Show notification
                            if (toast && toast.current) {
                                toast.current.show({
                                    severity: "error",
                                    summary: "Image Error",
                                    detail: "Failed to load image. It may have been deleted from Cloudinary.",
                                    life: 5000,
                                });
                            }
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "200px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f0f0f0",
                            border: "1px dashed #ccc",
                            borderRadius: "4px",
                        }}
                    >
                        <span>Image URL missing</span>
                    </div>
                )}
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Direct deletion without confirmation
                        removeImage(category, index);
                    }}
                    style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        zIndex: 1,
                    }}
                />
                {/* Show status indicators for image upload state */}
                {item.metadata?.pendingUpload && (
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
                {item.publicId && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            background: "rgba(0,128,0,0.6)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                        }}
                    >
                        Cloudinary
                    </div>
                )}
                {item.metadata?.uploadError && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            background: "rgba(220,0,0,0.7)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                        }}
                    >
                        Upload Failed
                    </div>
                )}
            </div>
        );
    };
    // Enhanced thumbnail template
    const thumbnailTemplate = (item) => {
        let imageUrl;

        // Use the same robust URL determination as in itemTemplate
        if (item.publicId) {
            // First try to use stored URLs
            if (item.secureUrl) {
                imageUrl = item.secureUrl;
            } else if (item.url) {
                imageUrl = item.url;
            } else if (item.publicId) {
                // If we need to construct URL from publicId
                imageUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${item.publicId}`;
            } else {
                imageUrl = null;
            }
        } else {
            imageUrl = item.url;
        }

        return imageUrl ? (
            <img
                src={imageUrl}
                alt={item.alt || "Thumbnail"}
                style={{
                    width: "50px",
                    height: "50px",
                    objectFit: "cover",
                    display: "block",
                }}
                onError={(e) => {
                    // Replace with a fallback thumbnail
                    e.target.src =
                        "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2250%22%20height%3D%2250%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%3E%3Crect%20fill%3D%22%23d3d3d3%22%20width%3D%2250%22%20height%3D%2250%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";
                }}
            />
        ) : (
            <div
                style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span style={{ fontSize: "8px" }}>No image</span>
            </div>
        );
    };

    const categories = ["Structure", "Equipment", "Canopy", "Ventilation"];

    return (
        <div className="p-4">
            {/* Toast for notifications */}
            <Toast ref={toast} />

            {/* Info message - displayed once outside the category loop */}
            <div className="mb-4 p-3 bg-gray-100 rounded">
                <p className="text-sm text-gray-700">
                    <i className="pi pi-info-circle mr-2"></i>
                    Images will be uploaded to Cloudinary when you save the
                    survey. The images will be organized in folders based on
                    site name, survey reference, and category.
                </p>
                {surveyRef && (
                    <p className="text-xs text-gray-500 mt-1">
                        <i className="pi pi-folder mr-1"></i>
                        Images will be stored in: surveys/
                        {siteName || "unknown-site"}/{surveyRef || "unknown"}
                    </p>
                )}
            </div>

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

                        {/* Gallery and test upload buttons */}
                        {images[category] && images[category].length > 0 && (
                            <>
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

                                {/* Test upload button */}
                                <Button
                                    icon="pi pi-cloud-upload"
                                    tooltip="Test Cloudinary upload"
                                    onClick={() =>
                                        testDirectUpload(
                                            images[category][0],
                                            category
                                        )
                                    }
                                    className="p-button-outlined p-button-help"
                                    style={{ height: "40px" }}
                                />
                            </>
                        )}
                    </div>

                    {/* Only show the gallery when visible is toggled */}
                    {visibleGalleries[category] &&
                        images[category] &&
                        images[category].length > 0 && (
                            <div className="card">
                                <Galleria
                                    value={images[category]}
                                    item={(item, index) =>
                                        itemTemplate(item, index, category)
                                    }
                                    thumbnail={thumbnailTemplate}
                                    style={{ maxWidth: "800px" }}
                                    showThumbnails={true}
                                    showItemNavigators={true}
                                    showItemNavigatorsOnHover={false}
                                    circular={true}
                                    position="bottom"
                                    numVisible={5}
                                />
                            </div>
                        )}
                </div>
            ))}
        </div>
    );
}
