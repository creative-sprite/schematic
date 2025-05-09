"use client";

import React from "react";
import "../styles/global.css";
import HamburgerMenu from "../components/global/HamburgerMenu"; // adjust path if needed
import "primereact/resources/themes/saga-orange/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ marginTop: "1rem", marginLeft: "1rem" }}>
          <HamburgerMenu />
        </div>
        <main className="global-main" style={{ paddingTop: "4rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}