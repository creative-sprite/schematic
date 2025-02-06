"use client";
/************************************************************
 * pages/index.jsx
 * 
 * This is the default page for Next.js with the Pages Router.
 * We simply import our Schematic component and render it.
 ************************************************************/
import React from "react";
import Schematic from "../components/Schematic/Schematic"; // adjust path if needed

export default function HomePage() {
  return (
    <div>
      <Schematic />
    </div>
  );
}