// components\database\clients\editDeleteParts\FormInputHandlers.jsx
import { useCallback } from "react";

/**
 * Custom hook to provide standardized form input handlers
 */
export const useFormInputHandlers = (setEditData) => {
    // Handle regular input changes
    const handleInputChange = useCallback(
        (e, field, isArray = false) => {
            const value = e.target.value;

            setEditData((prevData) => {
                const newData = { ...prevData };

                if (isArray) {
                    // Handle array values - split by commas and trim
                    newData[field] = value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                } else {
                    // Handle regular values
                    newData[field] = value;
                }

                return newData;
            });
        },
        [setEditData]
    );

    // Handle checkbox change for edit form
    const handleCheckboxChange = useCallback(
        (e, field) => {
            setEditData((prevData) => ({
                ...prevData,
                [field]: e.checked,
            }));
        },
        [setEditData]
    );

    // Handle address change for site entities
    const handleAddressChange = useCallback(
        (e, index, field) => {
            setEditData((prevData) => {
                const updatedData = { ...prevData };
                const updatedAddresses = [...(updatedData.addresses || [])];

                // Ensure the address at this index exists
                if (!updatedAddresses[index]) {
                    updatedAddresses[index] = {};
                }

                // Update the field
                updatedAddresses[index][field] = e.target.value;

                // Update addresses in the data
                updatedData.addresses = updatedAddresses;

                return updatedData;
            });
        },
        [setEditData]
    );

    return {
        handleInputChange,
        handleCheckboxChange,
        handleAddressChange,
    };
};
