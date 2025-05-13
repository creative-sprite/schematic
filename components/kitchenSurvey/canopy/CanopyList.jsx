// components\kitchenSurvey\canopy\CanopyList.jsx
"use client";
import { memo, useCallback } from "react";
import { Button } from "primereact/button";
import CanopyComments from "../canopy/CanopyComments"; // Simple comments component

/**
 * A single canopy entry row component - memoized for performance
 */
const CanopyEntryRow = memo(({ entry, onRemove, comment, onCommentChange }) => {
    // Handle remove click with useCallback to prevent unnecessary recreation
    const handleRemoveClick = useCallback(() => {
        onRemove(entry.id);
    }, [entry.id, onRemove]);

    // Generate a unique key for the comment based on canopy and filter items
    const commentKey = `${entry.canopy.item}-${entry.filter.item}-${entry.id}`;

    return (
        <div
            className="survey-subgroup"
            style={{ marginBottom: "2rem", paddingLeft: "1rem" }}
        >
            <h3>
                {entry.canopy.type} / {entry.filter.type}: {entry.canopy.item}{" "}
                &amp; {entry.filter.item}
            </h3>
            <table className="canopy-list-table common-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Material & Filter</th>
                        <th>Grade</th>
                        <th>Length</th>
                        <th>Width</th>
                        <th>Height</th>
                        <th>Number</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{entry.canopy.type}</td>
                        <td>{entry.canopy.item}</td>
                        <td>{entry.canopy.grade}</td>
                        <td>{entry.canopy.length}</td>
                        <td>{entry.canopy.width}</td>
                        <td>{entry.canopy.height}</td>
                        <td>{/* Empty for Canopy row */}</td>
                    </tr>
                    <tr>
                        <td>{entry.filter.type}</td>
                        <td>{entry.filter.item}</td>
                        <td>{entry.filter.grade}</td>
                        <td>{entry.filter.length}</td>
                        <td>{entry.filter.width}</td>
                        <td>{entry.filter.height}</td>
                        <td>{entry.filter.number}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="7" style={{ textAlign: "right" }}>
                            <Button
                                className="pi pi-minus"
                                onClick={handleRemoveClick}
                                style={{
                                    paddingLeft: "19px",
                                    height: "40px",
                                }}
                            />
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Simplified comment handling */}
            <CanopyComments
                id={commentKey}
                value={comment}
                onChange={onCommentChange}
                label={`Comments for ${entry.canopy.item} / ${entry.filter.item}`}
                placeholder="Add comments about this canopy..."
            />
        </div>
    );
});

// Set display name for debugging
CanopyEntryRow.displayName = "CanopyEntryRow";

/**
 * Enhanced CanopyEntryList component with simplified comment handling
 */
const CanopyEntryList = memo(
    ({
        entryList,
        canopyItems,
        filterItems,
        setEntryList,
        uniqueSubcategories,
        canopyComments = {},
        onCommentsChange,
    }) => {
        // Simplified handler for removing entries
        const handleRemoveEntry = useCallback(
            (id) => {
                setEntryList((prev) => prev.filter((e) => e.id !== id));
            },
            [setEntryList]
        );

        // Direct comment change handler - simpler and more reliable
        const handleCommentChange = useCallback(
            (commentKey, value) => {
                if (typeof onCommentsChange === "function") {
                    onCommentsChange(commentKey, value);
                }
            },
            [onCommentsChange]
        );

        // Render orphaned comments (comments that exist but no longer have matching entries)
        const renderOrphanedComments = () => {
            // Skip if no comments
            if (!canopyComments || Object.keys(canopyComments).length === 0) {
                return null;
            }

            // Get all comment keys
            const commentKeys = Object.keys(canopyComments);

            // Get all entry keys currently in the list
            const entryKeys = new Set(
                entryList.map(
                    (entry) =>
                        `${entry.canopy.item}-${entry.filter.item}-${entry.id}`
                )
            );

            // Find orphaned comments (comments without matching entries)
            const orphanedKeys = commentKeys.filter(
                (key) => !entryKeys.has(key)
            );

            if (orphanedKeys.length === 0) {
                return null;
            }

            return (
                <div style={{ marginTop: "2rem" }}>
                    <h4>Additional Comments</h4>
                    {orphanedKeys.map((key) => {
                        // Extract a readable name from the key
                        const parts = key.split("-");
                        const readableName =
                            parts.length >= 2
                                ? `${parts[0]} / ${parts[1]}`
                                : key;

                        return (
                            <CanopyComments
                                key={key}
                                id={key}
                                value={canopyComments[key]}
                                onChange={handleCommentChange}
                                label={`Comments for ${readableName}`}
                                placeholder="Add comments..."
                            />
                        );
                    })}
                </div>
            );
        };

        // If no entries, show a placeholder message
        if (!entryList || entryList.length === 0) {
            if (canopyComments && Object.keys(canopyComments).length > 0) {
                // If there are orphaned comments, show them
                return (
                    <>
                        <p>Added canopies / filters will display here.</p>
                        {renderOrphanedComments()}
                    </>
                );
            }
            return <p>Added canopies / filters will display here.</p>;
        }

        // Render the list of entries
        return (
            <>
                {entryList.map((entry) => {
                    // Generate a unique key for this entry's comment
                    const commentKey = `${entry.canopy.item}-${entry.filter.item}-${entry.id}`;
                    // Get the comment for this entry if it exists
                    const comment = canopyComments[commentKey] || "";

                    return (
                        <CanopyEntryRow
                            key={entry.id}
                            entry={entry}
                            onRemove={handleRemoveEntry}
                            comment={comment}
                            onCommentChange={handleCommentChange}
                        />
                    );
                })}
                {renderOrphanedComments()}
            </>
        );
    }
);

// Set display name for debugging
CanopyEntryList.displayName = "CanopyEntryList";

export default CanopyEntryList;
