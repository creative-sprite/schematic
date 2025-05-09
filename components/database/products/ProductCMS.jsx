// components\database\products\ProductCMS.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

// Import components
import CustomFieldCreator from "./customFields/CustomFieldCreator";
import CustomFieldManager from "./customFields/CustomFieldManager";
import FormManager from "./forms/FormManager";
import ProductCreator from "./products/ProductCreator";
import ProductView from "./products/ProductView";
import ProductReorderUtility from "./utils/ProductReorderUtility";

// Import hooks
import { useCustomFields } from "./hooks/useCustomFields";
import { useForms } from "./hooks/useForms";
import { useProducts } from "./hooks/useProducts";

const ProductCMS = () => {
    // State for UI management
    const [showFormsManager, setShowFormsManager] = useState(false);
    const [showFieldsManager, setShowFieldsManager] = useState(false);
    const [showReorderUtility, setShowReorderUtility] = useState(false);

    // Toast reference for notifications
    const toast = useRef(null);

    // Use custom hooks for data fetching and management
    const {
        customFields,
        loading: fieldsLoading,
        error: fieldsError,
        refreshCustomFields,
    } = useCustomFields();

    const {
        forms,
        loading: formsLoading,
        error: formsError,
        refreshForms,
    } = useForms();

    const {
        products,
        loading: productsLoading,
        error: productsError,
        refreshProducts,
    } = useProducts();

    // Function to refresh all data
    const refreshAllData = () => {
        refreshCustomFields();
        refreshForms();
        refreshProducts();
    };

    // Toggle forms manager visibility
    const toggleFormsManager = () => {
        setShowFormsManager(!showFormsManager);
        if (showFieldsManager) setShowFieldsManager(false); // Close fields manager if open
        if (showReorderUtility) setShowReorderUtility(false); // Close reorder utility if open
    };

    // Toggle custom fields manager visibility
    const toggleFieldsManager = () => {
        setShowFieldsManager(!showFieldsManager);
        if (showFormsManager) setShowFormsManager(false); // Close forms manager if open
        if (showReorderUtility) setShowReorderUtility(false); // Close reorder utility if open
    };

    // Toggle reorder utility visibility
    const toggleReorderUtility = () => {
        setShowReorderUtility(!showReorderUtility);
        if (showFormsManager) setShowFormsManager(false); // Close forms manager if open
        if (showFieldsManager) setShowFieldsManager(false); // Close fields manager if open
    };

    // Check for any errors
    useEffect(() => {
        if (fieldsError) console.error("Custom fields error:", fieldsError);
        if (formsError) console.error("Forms error:", formsError);
        if (productsError) console.error("Products error:", productsError);
    }, [fieldsError, formsError, productsError]);

    return (
        <div className="p-grid">
            <div className="p-col-12">
                <Toast ref={toast} />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "1rem",
                        gap: "0.5rem",
                    }}
                >
                    <Button
                        label={
                            showReorderUtility
                                ? "Close"
                                : "Reorder Product Data"
                        }
                        icon={showReorderUtility ? "pi pi-times" : "pi pi-sort"}
                        onClick={toggleReorderUtility}
                        className={
                            showReorderUtility
                                ? "p-button-secondary"
                                : "p-button-warning"
                        }
                    />

                    <Button
                        label={showFieldsManager ? "Close" : "Inputs"}
                        icon={showFieldsManager ? "pi pi-times" : "pi pi-cog"}
                        onClick={toggleFieldsManager}
                        className={
                            showFieldsManager
                                ? "p-button-secondary"
                                : "p-button-primary"
                        }
                    />

                    <Button
                        label={showFormsManager ? "Close" : "Forms"}
                        icon={showFormsManager ? "pi pi-times" : "pi pi-cog"}
                        onClick={toggleFormsManager}
                        className={
                            showFormsManager
                                ? "p-button-secondary"
                                : "p-button-primary"
                        }
                    />
                </div>

                {/* Display managers when opened */}
                {showReorderUtility && (
                    <ProductReorderUtility
                        customFields={customFields}
                        forms={forms}
                    />
                )}

                {showFieldsManager && (
                    <CustomFieldManager
                        customFields={customFields}
                        onRefresh={refreshCustomFields}
                        loading={fieldsLoading}
                    />
                )}

                {showFormsManager && (
                    <FormManager
                        forms={forms}
                        onRefresh={refreshForms}
                        loading={formsLoading}
                    />
                )}

                {/* Main accordion components */}
                <Accordion multiple>
                    <AccordionTab header="Create Input">
                        <CustomFieldCreator
                            onFieldCreated={refreshCustomFields}
                        />
                    </AccordionTab>

                    <AccordionTab header="Create Product">
                        <ProductCreator
                            forms={forms}
                            customFields={customFields}
                            onProductCreated={refreshAllData}
                        />
                    </AccordionTab>
                </Accordion>

                {/* Product listing and management */}
                <ProductView
                    products={products}
                    forms={forms}
                    customFields={customFields}
                    onRefresh={refreshProducts}
                    loading={productsLoading}
                />

                {/* Global confirmation dialog */}
                <ConfirmDialog />
            </div>
        </div>
    );
};

export default ProductCMS;
