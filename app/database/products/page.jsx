// app\database\products\page.jsx
"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import ProductCMS with no SSR
// This is necessary because ProductCMS uses browser-specific features
const ProductCMS = dynamic(
    () => import("../../../components/database/products/ProductCMS"),
    { ssr: false }
);

/**
 * Products page component
 *
 * This page serves as the entry point for the product management system.
 * It dynamically loads the ProductCMS component with client-side rendering only.
 */
export default function ProductsPage() {
    return (
        <div className="products-page">
            <ProductCMS />
        </div>
    );
}
