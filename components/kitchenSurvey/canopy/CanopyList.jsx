// components\kitchenSurvey\canopy\CanopyList.jsx
"use client";
import { Button } from "primereact/button";

/* 
    ----------------------------------------------------------
    This component renders the list of survey entries.
    Each entry displays the Canopy and Filter rows with a Remove button.
    ----------------------------------------------------------
*/
export default function CanopyEntryList({
    entryList,
    canopyItems,
    filterItems,
    setEntryList,
    uniqueSubcategories,
}) {
    return (
        <>
            {entryList.length === 0 ? (
                <p>Added canopies / filters will display here.</p>
            ) : (
                entryList.map((entry) => (
                    <div
                        key={entry.id}
                        className="survey-subgroup"
                        style={{ marginBottom: "2rem", paddingLeft: "1rem" }}
                    >
                        <h3>
                            {entry.canopy.type} / {entry.filter.type}:{" "}
                            {entry.canopy.item} &amp; {entry.filter.item}
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
                                    <td
                                        colSpan="7"
                                        style={{ textAlign: "right" }}
                                    >
                                        <Button
                                            className="pi pi-minus"
                                            onClick={() =>
                                                setEntryList((prev) =>
                                                    prev.filter(
                                                        (e) => e.id !== entry.id
                                                    )
                                                )
                                            }
                                            style={{
                                                paddingLeft: "19px",
                                                height: "40px",
                                            }}
                                        />
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ))
            )}
        </>
    );
}
/* 
    ----------------------------------------------------------
    End of CanopyEntryList component.
    ----------------------------------------------------------
*/
