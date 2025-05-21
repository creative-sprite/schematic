// components\global\HamburgerMenu.jsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { usePathname } from "next/navigation";

export default function HamburgerMenu() {
    const [visible, setVisible] = useState(false);
    const menuRef = useRef(null);
    const [appendTarget, setAppendTarget] = useState(null);

    // Set the append target once on the client side.
    useEffect(() => {
        if (typeof document !== "undefined") {
            setAppendTarget(document.body);
        }
    }, []);

    // Compute the page title based on the current pathname.
    const pathname = usePathname();
    const titleMapping = {
        "/surveys/kitchenSurvey": "Kitchen Survey",
        "/database/priceList": "Price List",
        "/": "Dashboard",
        "/database/product": "Product List",
        "/database/product/create": "Create Product",
        "/database/product/form": "Form List",
        // add other routes here as needed
    };
    const pageTitle = titleMapping[pathname] || "TSN";

    // Group new app pages under a "Products" submenu
    const items = [
        {
            label: "Surveys",
            icon: "pi pi-fw pi-th-large",
            items: [
                {
                    label: "Create",
                    icon: "pi pi-fw pi-pen-to-square",
                    command: () =>
                        (window.location.href = "/surveys/kitchenSurvey"),
                },
                {
                    label: "Quote Template",
                    icon: "pi pi-fw pi-check-square",
                    command: () =>
                        (window.location.href =
                            "/surveys/kitchenSurvey/quotes"),
                },
            ],
        },
        {
            label: "Databases",
            icon: "pi pi-fw pi-th-large",
            items: [
                {
                    label: "Clients",
                    icon: "pi pi-fw pi-address-book",
                    command: () => (window.location.href = "/database"),
                },
                {
                    label: "Price List",
                    icon: "pi pi-fw pi-barcode",
                    command: () =>
                        (window.location.href = "/database/priceList"),
                },
                {
                    label: "Products",
                    icon: "pi pi-fw pi-shopping-cart",
                    command: () =>
                        (window.location.href = "/database/products"),
                },
            ],
        },
    ];

    return (
        <div>
            <Button
                icon="pi pi-bars"
                onClick={() => setVisible(true)}
                aria-label="Open Menu"
                style={{ position: "fixed", zIndex: "3000" }}
            />

            <Sidebar
                visible={visible}
                onHide={() => setVisible(false)}
                position="left"
                appendTo={appendTarget}
                baseZIndex={999999}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 999999,
                    height: "100vh",
                }}
                showCloseIcon={false} // Hide default close icon
            >
                {/* Custom close button positioned at top right */}
                <Button
                    icon="pi pi-times"
                    onClick={() => setVisible(false)}
                    aria-label="Close Menu"
                    className="p-button-rounded p-button-text"
                    style={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        zIndex: 1000000,
                    }}
                />

                {/* Page title */}
                <h3
                    style={{
                        textAlign: "left",
                        marginTop: "3rem",
                        marginLeft: "0.5rem",
                    }}
                >
                    {pageTitle}
                </h3>

                {/* Centered menu with padding */}
                <div
                    style={{
                        padding: "0.5rem",
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                    }}
                >
                    <Menu
                        model={items}
                        ref={menuRef}
                        style={{ width: "100%" }}
                    />
                </div>
            </Sidebar>
        </div>
    );
}
