// components/kitchenSurvey/parkingPostServiceReport/parkingPostServiceReport.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { ToggleButton } from "primereact/togglebutton";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";

export default function ParkingPostServiceReport({
    initialParkingCost = 0,
    initialPostServiceReport = "No",
    initialPostServiceReportPrice = 0,
    onParkingCostChange,
    onPostServiceReportChange,
}) {
    // State for parking cost
    const [parkingCost, setParkingCost] = useState(initialParkingCost);

    // State for post-service report toggle (as boolean for ToggleButton compatibility)
    const [postServiceReportEnabled, setPostServiceReportEnabled] = useState(
        initialPostServiceReport === "Yes"
    );

    // State for post-service report price (fetched from database)
    const [postServiceReportPrice, setPostServiceReportPrice] = useState(
        initialPostServiceReportPrice
    );

    // State for loading the post-service report price
    const [isLoading, setIsLoading] = useState(false);

    // Toast for notifications
    const toast = useRef(null);

    // Effect to fetch post-service report price on component mount
    useEffect(() => {
        if (postServiceReportEnabled && postServiceReportPrice === 0) {
            fetchPostServiceReportPrice();
        }
    }, []);

    // Effect to notify parent component when parking cost changes
    useEffect(() => {
        if (typeof onParkingCostChange === "function") {
            onParkingCostChange(parkingCost);
        }
    }, [parkingCost, onParkingCostChange]);

    // Effect to notify parent component when post-service report toggle changes
    useEffect(() => {
        if (typeof onPostServiceReportChange === "function") {
            // Convert boolean back to "Yes"/"No" for the parent component
            const postServiceReportValue = postServiceReportEnabled
                ? "Yes"
                : "No";
            onPostServiceReportChange(
                postServiceReportValue,
                postServiceReportPrice
            );
        }
    }, [
        postServiceReportEnabled,
        postServiceReportPrice,
        onPostServiceReportChange,
    ]);

    // Function to fetch post-service report price from database
    const fetchPostServiceReportPrice = async () => {
        try {
            setIsLoading(true);

            // Fetch products from the API with category filter
            const res = await fetch("/api/database/products?category=Reports");

            if (!res.ok) {
                throw new Error(`Failed to fetch: ${res.status}`);
            }

            const data = await res.json();

            if (data.success && Array.isArray(data.data)) {
                // Find post-service report product
                const postServiceProduct = data.data.find(
                    (item) =>
                        item.name === "Post Service Report" &&
                        item.type === "Post Service"
                );

                if (postServiceProduct && postServiceProduct.customData) {
                    // Find the price field in customData
                    const priceField = postServiceProduct.customData.find(
                        (field) =>
                            field.fieldName === "Price" &&
                            field.fieldType === "number"
                    );

                    if (priceField && priceField.value) {
                        // Convert the price value from string to number
                        const price = Number(priceField.value);
                        setPostServiceReportPrice(price);

                        // If post-service report is already enabled, notify parent
                        if (
                            postServiceReportEnabled &&
                            typeof onPostServiceReportChange === "function"
                        ) {
                            onPostServiceReportChange("Yes", price);
                        }
                    } else {
                        toast.current?.show({
                            severity: "warn",
                            summary: "Price Not Found",
                            detail: "Could not find Post Service Report price data",
                        });
                    }
                } else {
                    toast.current?.show({
                        severity: "warn",
                        summary: "Product Not Found",
                        detail: "Could not find Post Service Report product",
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching post-service report price:", error);
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to fetch Post Service Report price",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle parking cost change
    const handleParkingCostChange = (value) => {
        setParkingCost(value);
    };

    // Handle post-service report toggle change
    const handlePostServiceReportChange = (e) => {
        const isEnabled = e.value;
        console.log("Toggle button changed:", isEnabled); // Debug log
        setPostServiceReportEnabled(isEnabled);

        // If toggled to enabled and price is not set yet, fetch it
        if (isEnabled && postServiceReportPrice === 0) {
            fetchPostServiceReportPrice();
        }
    };

    return (
        <div className="parking-post-service-container">
            <Toast ref={toast} />

            {/* Parking Cost Input */}
            <Card>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div>
                        <p>Parking Cost</p>
                        <InputNumber
                            id="parking-cost"
                            value={parkingCost}
                            onValueChange={(e) =>
                                handleParkingCostChange(e.value)
                            }
                        />
                    </div>
                    <div>
                        {/* Post-Service Report Toggle */}

                        <p>Post-Service Report</p>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                            }}
                        >
                            <ToggleButton
                                checked={postServiceReportEnabled}
                                onChange={handlePostServiceReportChange}
                                onLabel="Yes"
                                offLabel="No"
                            />
                            {isLoading && (
                                <ProgressSpinner
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                    }}
                                    strokeWidth="4"
                                    fill="var(--surface-ground)"
                                    animationDuration=".5s"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
