// components\database\products\products\ProductView.jsx

import React, { useState, useEffect } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import Link from "next/link";

// Import components and hooks
import ProductEditor from "./ProductEditor";
import { useProducts } from "../hooks/useProducts";
import { useSuppliers } from "../hooks/useSuppliers";

/**
 * Component for viewing and managing existing products
 *
 * @param {Object} props - Component props
 * @param {Array} props.products - Array of products to display
 * @param {Array} props.forms - Available forms
 * @param {Array} props.customFields - Available custom fields
 * @param {Function} props.onRefresh - Callback to trigger refresh
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Product viewing interface
 */
const ProductView = ({
    products = [],
    forms = [],
    customFields = [],
    onRefresh,
    loading = false,
}) => {
    // Component state
    const [groupedProducts, setGroupedProducts] = useState({});
    const [activeIndex, setActiveIndex] = useState(0);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);

    // Custom hooks
    const { deleteProduct } = useProducts();
    const { suppliers, getSupplierById } = useSuppliers();

    // Group products by category
    useEffect(() => {
        const grouped = {};

        // First, initialize categories from forms
        forms.forEach((form) => {
            grouped[form.category] = [];
        });

        // Then add products to their respective categories
        products.forEach((product) => {
            if (product.category) {
                if (!grouped[product.category]) {
                    grouped[product.category] = [];
                }
                grouped[product.category].push(product);
            }
        });

        // Filter out empty categories
        const filteredGroups = Object.fromEntries(
            Object.entries(grouped).filter(
                ([_, categoryProducts]) => categoryProducts.length > 0
            )
        );

        setGroupedProducts(filteredGroups);

        // Adjust active index if needed
        if (Object.keys(filteredGroups).length <= activeIndex) {
            setActiveIndex(0);
        }
    }, [products, forms, activeIndex]);

    /**
     * Handle product deletion
     * @param {Object} product - The product to delete
     */
    const handleDeleteProduct = async (product) => {
        try {
            await deleteProduct(product._id);

            // Refresh product list
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error("Delete product error:", error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    /**
     * Show confirmation dialog for product deletion
     * @param {Object} product - The product to delete
     */
    const confirmDelete = (product) => {
        confirmDialog({
            message: `Are you sure you want to delete ${product.name}?`,
            header: "Delete Confirmation",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => handleDeleteProduct(product),
            reject: () => {}, // No action on reject
        });
    };

    /**
     * Open the edit dialog for a product
     * @param {Object} product - The product to edit
     */
    const handleEditProduct = (product) => {
        setCurrentProduct(product);
        setEditDialogVisible(true);
    };

    /**
     * Close the edit dialog
     */
    const closeEditDialog = () => {
        setEditDialogVisible(false);
        setCurrentProduct(null);
    };

    /**
     * Handle successful product update
     */
    const handleProductUpdated = () => {
        // Close the dialog
        closeEditDialog();

        // Refresh the product list
        if (onRefresh) {
            onRefresh();
        }
    };

    /**
     * Render a supplier link
     * @param {string} supplierId - Supplier ID
     * @returns {JSX.Element|null} Supplier link component
     */
    const renderSupplierLink = (supplierId) => {
        const supplier = getSupplierById(supplierId);
        if (!supplier) return null;

        return (
            <Link
                href={`/database/clients/supplier/${supplierId}`}
                style={{
                    color: "#3b82f6",
                    textDecoration: "none",
                    marginRight: "0.5rem",
                    display: "inline-block",
                }}
            >
                {supplier.name}
            </Link>
        );
    };

    /**
     * Template for rendering individual product cards
     * @param {Object} product - The product to render
     * @returns {JSX.Element} Product card component
     */
    const productTemplate = (product) => (
        <div className="p-col-12 p-md-3" style={{ display: "flex" }}>
            <div
                className="product-item"
                style={{
                    padding: "0.5rem",
                    margin: "0rem",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    width: "202px",
                    overflow: "visible",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                }}
            >
                <div className="product-detail" style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
                        {product.name}
                    </h3>

                    {/* Basic product info with proper spacing */}
                    <div style={{ marginBottom: "0.25rem" }}>
                        <strong>Category:</strong> {product.category}
                    </div>
                    <div style={{ marginBottom: "0.25rem" }}>
                        <strong>Type:</strong> {product.type}
                    </div>

                    {/* Display suppliers as links */}
                    {product.suppliers && product.suppliers.length > 0 && (
                        <div
                            className="supplier-section"
                            style={{ marginBottom: "0.5rem" }}
                        >
                            <strong>Suppliers:</strong>{" "}
                            <span className="supplier-links">
                                {product.suppliers.map((supplierId, idx) => (
                                    <React.Fragment key={supplierId}>
                                        {renderSupplierLink(supplierId)}
                                        {idx < product.suppliers.length - 1 &&
                                            ", "}
                                    </React.Fragment>
                                ))}
                            </span>
                        </div>
                    )}

                    {/* Display custom fields in a column with spacing */}
                    {product.customData && product.customData.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.25rem",
                                marginTop: "0.5rem",
                            }}
                        >
                            {product.customData.map((data, index) => {
                                // Find field info from customFields list
                                const field = customFields.find(
                                    (f) => f._id === data.fieldId
                                );

                                if (!field) {
                                    return null;
                                }

                                // Extract field properties
                                const fieldName = field.label;
                                const fieldType = field.fieldType;
                                const prefix = field.prefix || "";
                                const suffix = field.suffix || "";

                                let displayValue = "";
                                if (fieldType === "number") {
                                    displayValue = `${prefix || ""}${
                                        data.value || ""
                                    }${suffix || ""}`;
                                } else {
                                    displayValue = data.value
                                        ? Array.isArray(data.value)
                                            ? data.value.join(", ")
                                            : data.value.toString()
                                        : "";
                                }

                                return (
                                    <div
                                        key={index}
                                        className="custom-field-item"
                                    >
                                        <strong>{fieldName}:</strong>{" "}
                                        <span>{displayValue}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add padding at the bottom to prevent overlap with buttons */}
                    <div style={{ paddingBottom: "50px" }}></div>
                </div>

                {/* Action buttons */}
                <div
                    className="product-actions"
                    style={{
                        position: "absolute",
                        bottom: "1rem",
                        right: "1rem",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.5rem",
                        zIndex: 1,
                    }}
                >
                    <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-text p-button-lg"
                        onClick={() => handleEditProduct(product)}
                        tooltip="Edit"
                        tooltipOptions={{ position: "top" }}
                        style={{ fontSize: "1.25rem" }}
                    />
                    <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-text p-button-danger p-button-lg"
                        onClick={() => confirmDelete(product)}
                        tooltip="Delete"
                        tooltipOptions={{ position: "top" }}
                        style={{ fontSize: "1.25rem" }}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ marginTop: "2rem" }}>
            <h2>Products</h2>

            {/* Display message if no products */}
            {Object.keys(groupedProducts).length === 0 ? (
                <div style={{ padding: "1rem", textAlign: "center" }}>
                    <p>
                        No products available. Create some products to see them
                        here.
                    </p>
                </div>
            ) : (
                // TabView for products organized by category
                <TabView
                    activeIndex={activeIndex}
                    onTabChange={(e) => setActiveIndex(e.index)}
                    className="product-tabs"
                >
                    {Object.entries(groupedProducts).map(
                        ([category, categoryProducts], index) => (
                            <TabPanel
                                header={
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {category}
                                        <span
                                            style={{
                                                marginLeft: "0.5rem",
                                                backgroundColor: "#e9ecef",
                                                color: "#495057",
                                                borderRadius: "50%",
                                                height: "22px",
                                                width: "22px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.75rem",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {categoryProducts.length}
                                        </span>
                                    </div>
                                }
                                key={category}
                            >
                                {loading ? (
                                    <div
                                        style={{
                                            padding: "1rem",
                                            textAlign: "center",
                                        }}
                                    >
                                        <p>Loading products...</p>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(auto-fill, 202px)",
                                            gap: "1rem",
                                            justifyContent: "flex-start",
                                            alignItems: "stretch", // Makes all items stretch to match the tallest item in each row
                                        }}
                                    >
                                        {categoryProducts.map((product) => (
                                            <React.Fragment
                                                key={product._id || product.id}
                                            >
                                                {productTemplate(product)}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </TabPanel>
                        )
                    )}
                </TabView>
            )}

            {/* Product Edit Dialog */}
            <Dialog
                visible={editDialogVisible}
                style={{ width: "80%" }}
                header="Edit Product"
                modal
                onHide={closeEditDialog}
                maximizable
            >
                {currentProduct && (
                    <ProductEditor
                        product={currentProduct}
                        forms={forms}
                        customFields={customFields}
                        suppliers={suppliers}
                        onCancel={closeEditDialog}
                        onSave={handleProductUpdated}
                    />
                )}
            </Dialog>
        </div>
    );
};

export default ProductView;
