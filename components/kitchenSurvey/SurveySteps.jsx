// components/kitchenSurvey/SurveySteps.jsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Steps } from "primereact/steps";

export default function SurveySteps({
    areas = [],
    mainAreaRef,
    areaRefs = [],
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const stepsRef = useRef(null);
    const [mainAreaLabel, setMainAreaLabel] = useState("Main Area");
    const [areaLabels, setAreaLabels] = useState([]);

    // Track main area's label (structureId)
    useEffect(() => {
        const checkMainAreaLabel = () => {
            if (mainAreaRef?.current) {
                const h1Element = mainAreaRef.current.querySelector("h1");
                if (h1Element && h1Element.textContent) {
                    const newLabel = h1Element.textContent.trim();
                    if (newLabel && newLabel !== mainAreaLabel) {
                        setMainAreaLabel(newLabel);
                    }
                }
            }
        };

        // Set up interval to check for changes
        const interval = setInterval(checkMainAreaLabel, 500);

        // Initial check
        checkMainAreaLabel();

        // Clean up
        return () => clearInterval(interval);
    }, [mainAreaRef, mainAreaLabel]);

    // Track duplicated areas' labels
    useEffect(() => {
        if (areas.length > 0 && areaRefs.length > 0) {
            const newLabels = areaRefs.map((ref, index) => {
                if (ref?.current) {
                    const h1Element = ref.current.querySelector("h1");
                    if (h1Element && h1Element.textContent) {
                        return h1Element.textContent.trim();
                    }
                }
                return `Area ${index + 2}`;
            });

            // Only update if labels actually changed
            if (JSON.stringify(newLabels) !== JSON.stringify(areaLabels)) {
                setAreaLabels(newLabels);
            }
        }
    }, [areas, areaRefs, areaLabels]);

    // Function to get initials from a string plus any numbers
    const getInitialsAndNumbers = (str) => {
        if (!str) return "";

        // Split by spaces
        const words = str.split(" ");

        // Get initials (without spaces between them) and numbers
        let initials = "";
        let numbers = "";

        words.forEach((word) => {
            // Check if word is a number
            if (/^\d+$/.test(word)) {
                // Word is just a number, add to numbers with space
                numbers += (numbers ? " " : "") + word;
            } else if (/\d+/.test(word)) {
                // Word contains numbers, extract them with the first letter
                const firstLetter = word.match(/[a-zA-Z]/)?.[0] || "";
                const wordNumbers = word.match(/\d+/)?.[0] || "";
                initials += firstLetter.toUpperCase();
                numbers += (numbers ? " " : "") + wordNumbers;
            } else {
                // Regular word, return first letter (capitalized)
                initials += word.charAt(0).toUpperCase();
            }
        });

        // Join initials and numbers with a space between them
        return initials + (numbers ? " " + numbers : "");
    };

    // Function to scroll to a section
    const scrollToSection = (ref) => {
        if (ref && ref.current) {
            ref.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    // Update active index based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            // Get positions of each section
            const mainAreaPos = mainAreaRef?.current
                ? mainAreaRef.current.getBoundingClientRect()
                : null;
            const areaPositions = areaRefs
                .map((ref, index) =>
                    ref?.current
                        ? {
                              index: index + 1,
                              top: ref.current.getBoundingClientRect().top,
                              bottom: ref.current.getBoundingClientRect()
                                  .bottom,
                          }
                        : null
                )
                .filter(Boolean);

            // Include main area in positions if available
            const positions = mainAreaPos
                ? [
                      {
                          index: 0,
                          top: mainAreaPos.top,
                          bottom: mainAreaPos.bottom,
                      },
                      ...areaPositions,
                  ]
                : areaPositions;

            if (positions.length === 0) return;

            // Find the section most visible in viewport
            const viewportHeight = window.innerHeight;
            const viewportCenter = viewportHeight / 2;

            // Sort by distance from viewport center
            positions.sort((a, b) => {
                const aCenter = (a.top + a.bottom) / 2;
                const bCenter = (b.top + b.bottom) / 2;
                return (
                    Math.abs(aCenter - viewportCenter) -
                    Math.abs(bCenter - viewportCenter)
                );
            });

            // Use the most centered element
            const mostVisible = positions[0];
            if (mostVisible && mostVisible.index !== activeIndex) {
                setActiveIndex(mostVisible.index);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [mainAreaRef, areaRefs, activeIndex]);

    // Generate steps model with abbreviated labels (for inside the oblong shapes)
    const getStepsModel = () => {
        return [
            {
                label: getInitialsAndNumbers(mainAreaLabel) || "MA",
                title: getInitialsAndNumbers(mainAreaLabel) || "MA",
                command: () => {
                    scrollToSection(mainAreaRef);
                    setActiveIndex(0);
                },
            },
            ...areaLabels.map((label, index) => ({
                label: getInitialsAndNumbers(label) || `A${index + 2}`,
                title: getInitialsAndNumbers(label) || `A${index + 2}`,
                command: () => {
                    scrollToSection(areaRefs[index]);
                    setActiveIndex(index + 1);
                },
            })),
        ];
    };

    return (
        <div
            ref={stepsRef}
            className="survey-steps-bottom"
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                width: "100%",
                backgroundColor: "#fff",
                padding: "10px 0",
                boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
                zIndex: 1000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderTop: "1px solid #ddd",
            }}
        >
            <style jsx global>{`
                /* Custom styles for steps */
                .p-steps .p-steps-item {
                    margin: 0 0.25rem !important;
                }

                /* Custom styles for steps */
                .p-steps .p-steps-item .p-menuitem-link {
                    background: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                }

                /* Hide default number */
                .p-steps .p-steps-item .p-steps-number {
                    display: none !important;
                }

                /* Create oblong shape for the step */
                .p-steps .p-steps-item .p-steps-title {
                    position: relative !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    min-width: 2.5rem !important;
                    height: 2rem !important;
                    padding: 0 0.8rem !important;
                    border-radius: 1rem !important;
                    background-color: #f8f9fa !important;
                    color: #6c757d !important;
                    font-weight: normal !important;
                    font-size: 0.85rem !important;
                    border: 1px solid #dee2e6 !important;
                    margin: 0 !important;
                }

                /* Active step styling */
                .p-steps .p-steps-item.p-highlight .p-steps-title {
                    background-color: #f9c400 !important;
                    color: #ffffff !important;
                }

                /* Hide connector line */
                .p-steps .p-steps-item:before,
                .p-steps .p-steps-item:after,
                .p-steps .p-steps-item .p-menuitem-link:before,
                .p-steps .p-steps-item .p-menuitem-link:after {
                    display: none !important;
                }
            `}</style>
            <Steps
                model={getStepsModel()}
                activeIndex={activeIndex}
                onSelect={(e) => {
                    setActiveIndex(e.index);
                    scrollToSection(
                        e.index === 0 ? mainAreaRef : areaRefs[e.index - 1]
                    );
                }}
                readOnly={false}
                pt={{
                    step: ({ context }) => ({
                        className: context.active
                            ? "active-step"
                            : "inactive-step",
                        style: {
                            margin: "0 0.25rem",
                        },
                    }),
                    action: ({ context }) => ({
                        className: context.active
                            ? "active-step-action"
                            : "inactive-step-action",
                    }),
                    number: () => ({
                        className: "hidden-number",
                    }),
                }}
                style={{
                    maxWidth: "100%",
                    overflowX: "auto",
                }}
            />
        </div>
    );
}
