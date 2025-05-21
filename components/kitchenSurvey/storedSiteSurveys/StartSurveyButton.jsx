"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";

/**
 * StartSurveyButton component - Creates a button that starts a new survey with a pre-selected site
 * @param {Object} props - Component props
 * @param {string} props.siteId - The ID of the site to pre-select in the survey
 * @param {string} [props.label="Start Survey"] - Button label text
 * @param {string} [props.className=""] - Additional CSS classes
 * @param {string} [props.icon="pi pi-plus-circle"] - Button icon
 * @param {string} [props.severity="success"] - Button severity/color (primary, secondary, success, info, warning, help, danger)
 */
export default function StartSurveyButton({
    siteId,
    label = "Start Survey",
    className = "",
    icon = "pi pi-plus-circle",
    severity = "success",
}) {
    const router = useRouter();
    const toast = useRef(null);

    const handleStartSurvey = () => {
        if (!siteId) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Site ID is required to start a survey",
                life: 3000,
            });
            return;
        }

        // Navigate to the survey page with the site ID as a parameter
        router.push(`/surveys/kitchenSurvey?site=${siteId}`);
    };

    return (
        <>
            <Toast ref={toast} />
            <Button
                label={label}
                icon={icon}
                severity={severity}
                className={className}
                onClick={handleStartSurvey}
            />
        </>
    );
}