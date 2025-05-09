// app/surveys/kitchenSurvey/quotes/page.jsx
"use client";

import { useEffect } from "react";
import QuoteList from "@/components/kitchenSurvey/quote/QuoteList";
import HamburgerMenu from "@/components/global/HamburgerMenu";
import SearchPageWrapper from "@/components/global/SearchPageWrapper";

export default function QuotesPage() {
    // Set page title
    useEffect(() => {
        document.title = "Kitchen Survey Quotes";
    }, []);

    return (
        <SearchPageWrapper
            title="Kitchen Survey Quotes"
            description="View and manage saved quotes from kitchen surveys"
        >
            <div className="flex flex-column">
                <HamburgerMenu />
                <div className="container mx-auto p-3">
                    <h1 className="text-2xl font-bold mb-4">Kitchen Survey Quotes</h1>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            View, download, or delete saved quotes. Quotes are created from kitchen surveys
                            and contain PDF snapshots of survey data with schematic images.
                        </p>
                    </div>
                    <QuoteList />
                </div>
            </div>
        </SearchPageWrapper>
    );
}