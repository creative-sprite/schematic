// components/kitchenSurvey/collection/collectionID.js
"use client";

/**
 * Utility for generating unique collection and survey IDs
 */

// Generate a random alphanumeric ID with 6 digits and 1 letter
export const generateUniqueId = () => {
    // Generate 6 random digits as individual characters
    const numericParts = [];
    for (let i = 0; i < 6; i++) {
        numericParts.push(Math.floor(Math.random() * 10).toString());
    }

    // Generate 1 random letter (uppercase)
    const alphabetChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const alphabeticPart = alphabetChars.charAt(
        Math.floor(Math.random() * alphabetChars.length)
    );

    // Randomly decide where to insert the letter (positions 0-6)
    const insertPosition = Math.floor(Math.random() * 7);

    // Insert the letter at the chosen position
    numericParts.splice(insertPosition, 0, alphabeticPart);

    // Join all characters to form the ID
    return numericParts.join("");
};

// Generate a new unique REF ID using the standard format: PREFIX1/PREFIX2/UNIQUEID/VERSION
export const generateNewRefId = async (existingRefValue = null) => {
    try {
        // Fetch the latest surveys to find the last REF ID pattern
        const res = await fetch("/api/surveys/kitchenSurveys/viewAll");
        if (!res.ok) {
            throw new Error(`Error fetching surveys: ${res.status}`);
        }

        const data = await res.json();

        // Parse existing REF to determine pattern (if available)
        let prefix1 = "AA";
        let prefix2 = "BB";
        let uniquePart = "";
        let versionPart = "A";

        if (existingRefValue) {
            // Try to extract pattern from existing REF
            const parts = existingRefValue.split("/");
            if (parts.length === 4) {
                prefix1 = parts[0];
                prefix2 = parts[1];
                // Generate new unique part
                uniquePart = generateUniqueId();
                // For new areas in a collection, use same version as parent
                versionPart = parts[3];
            }
        } else {
            // Generate everything new
            uniquePart = generateUniqueId();
        }

        // If we didn't get a unique part yet, generate one
        if (!uniquePart) {
            uniquePart = generateUniqueId();
        }

        // Combine for new REF
        return `${prefix1}/${prefix2}/${uniquePart}/${versionPart}`;
    } catch (error) {
        console.error("Error generating new REF ID:", error);
        // Fallback to a simple random REF
        return `AA/BB/${generateUniqueId()}/A`;
    }
};

// Generate a completely new collection REF (all parts new)
export const generateNewCollectionRef = async () => {
    // Generate new prefixes (2 uppercase letters each)
    const generatePrefix = () => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return alphabet.charAt(Math.floor(Math.random() * 26)) + 
               alphabet.charAt(Math.floor(Math.random() * 26));
    };
    
    const prefix1 = generatePrefix();
    const prefix2 = generatePrefix();
    const uniquePart = generateUniqueId();
    const versionPart = "A"; // Start with version A for new collections
    
    return `${prefix1}/${prefix2}/${uniquePart}/${versionPart}`;
};

// Verify if a REF ID is unique by checking against the API
export const verifyUniqueRefId = async (refId) => {
    try {
        const res = await fetch(`/api/surveys/kitchenSurveys?checkUniqueId=${encodeURIComponent(refId)}`);
        if (!res.ok) {
            throw new Error(`Error checking unique ID: ${res.status}`);
        }
        
        const data = await res.json();
        return data.isUnique === true;
    } catch (error) {
        console.error("Error verifying unique REF ID:", error);
        return false; // Assume not unique if we can't verify
    }
};

// Generate a guaranteed unique REF ID by checking against the API
export const generateGuaranteedUniqueRefId = async (existingRefValue = null) => {
    let refId = await generateNewRefId(existingRefValue);
    let isUnique = await verifyUniqueRefId(refId);
    
    // If not unique, keep trying until we get a unique one (max 5 attempts)
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!isUnique && attempts < maxAttempts) {
        refId = await generateNewRefId(existingRefValue);
        isUnique = await verifyUniqueRefId(refId);
        attempts++;
    }
    
    return refId;
};