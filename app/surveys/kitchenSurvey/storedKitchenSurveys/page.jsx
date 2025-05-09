//app\surveys\kitchenSurvey\storedKitchenSurveys\page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "primereact/card";
import { DataScroller } from "primereact/datascroller";
import "../../../../styles/surveyForm.css";

export default function SurveysPage() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all surveys from the API
    useEffect(() => {
        async function fetchSurveys() {
            try {
                const res = await fetch("/api/surveys");
                const data = await res.json();
                if (data.success) {
                    setSurveys(data.data);
                } else {
                    throw new Error(data.message || "Error fetching surveys");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSurveys();
    }, []);

    if (loading) return <div>Loading surveys...</div>;
    if (error) return <div>Error: {error}</div>;

    const surveyTemplate = (survey) => (
        <Card
            key={survey._id}
            className="survey-card"
            style={{ marginBottom: "1rem" }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div>
                    <h3>
                        Survey Date:{" "}
                        {new Date(survey.surveyDate).toLocaleDateString()}
                    </h3>
                    {/* Optionally display additional survey summary info here */}
                </div>
                <div>
                    {/* Updated link: Navigates to the unified survey page with survey id in query */}
                    <Link href={`/survey?id=${survey._id}`} legacyBehavior>
                        <a className="edit-button">Edit</a>
                    </Link>
                </div>
            </div>
        </Card>
    );

    return (
        <div style={{ padding: "1rem" }}>
            <h2>All Surveys</h2>
            {surveys.length === 0 ? (
                <p>No surveys found.</p>
            ) : (
                <DataScroller
                    value={surveys}
                    itemTemplate={surveyTemplate}
                    rows={5}
                    inline
                    style={{ maxHeight: "400px" }}
                />
            )}
        </div>
    );
}
