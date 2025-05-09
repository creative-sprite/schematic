"use client";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import DropItemGrade from "../DropItemGrade"; // Combined item/grade selector component

export default function CanopyForm({
    form,
    handleChange,
    canopyItems,
    filterItems,
    handleAddEntry,
}) {
    return (
        <div className="canopy-entry-form" style={{ marginBottom: "2rem" }}>
            {/* Cards Container - Flex row on large screens, column on small */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: "1rem",
                    width: "100%",
                }}
            >
                {/* Canopy Card */}
                <div
                    className="p-card"
                    style={{
                        padding: "1rem",
                        marginBottom: "1rem",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #e0e0e0",
                        flex: "1 1 300px", // Flex grow, shrink and basis
                        minWidth: "300px", // Minimum width before wrapping
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                            marginBottom: "1rem",
                            borderBottom: "1px solid #eee",
                            paddingBottom: "0.5rem",
                        }}
                    >
                        Canopy
                    </h2>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            marginRight: "1rem",
                        }}
                    >
                        {/* All inputs directly in the same row */}
                        <DropItemGrade
                            items={canopyItems}
                            value={{
                                item: form.canopy.item,
                                grade: form.canopy.grade,
                            }}
                            onChange={(val) => {
                                handleChange("canopy", "item", val.item);
                                handleChange("canopy", "grade", val.grade);
                            }}
                            placeholder="Material & Grade"
                        />
                    </div>
                    <br />
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                        }}
                    >
                        {/* Length */}
                        <InputText
                            type="number"
                            name="length"
                            value={form.canopy.length ?? ""}
                            onChange={(e) =>
                                handleChange("canopy", "length", e.target.value)
                            }
                            placeholder="Length"
                            required
                            style={{ width: "92px", height: "40px" }}
                        />

                        {/* Width */}
                        <InputText
                            type="number"
                            name="width"
                            value={form.canopy.width ?? ""}
                            onChange={(e) =>
                                handleChange("canopy", "width", e.target.value)
                            }
                            placeholder="Width"
                            required
                            style={{ width: "92px", height: "40px" }}
                        />

                        {/* Height */}
                        <InputText
                            type="number"
                            name="height"
                            value={form.canopy.height ?? ""}
                            onChange={(e) =>
                                handleChange("canopy", "height", e.target.value)
                            }
                            placeholder="Height"
                            required
                            style={{ width: "92px", height: "40px" }}
                        />
                    </div>
                </div>

                {/* Filter Card */}
                <div
                    className="p-card"
                    style={{
                        padding: "1rem",
                        marginBottom: "1rem",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #e0e0e0",
                        flex: "1 1 300px", // Flex grow, shrink and basis
                        minWidth: "300px", // Minimum width before wrapping
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                            marginBottom: "1rem",
                            borderBottom: "1px solid #eee",
                            paddingBottom: "0.5rem",
                        }}
                    >
                        Filter
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem", // Consistent 0.5rem gap throughout
                        }}
                    >
                        {/* All inputs directly in the same row */}
                        <DropItemGrade
                            items={filterItems}
                            value={{
                                item: form.filter.item,
                                grade: form.filter.grade,
                            }}
                            onChange={(val) => {
                                handleChange("filter", "item", val.item);
                                handleChange("filter", "grade", val.grade);
                            }}
                            placeholder="Filter & Grade"
                        />
                        {/* Number */}
                        <InputText
                            type="number"
                            name="number"
                            value={form.filter.number ?? ""}
                            onChange={(e) =>
                                handleChange("filter", "number", e.target.value)
                            }
                            placeholder="Number"
                            required
                            style={{ width: "92px", height: "40px" }}
                        />
                    </div>

                    <br />

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem", // Consistent 0.5rem gap throughout
                        }}
                    >
                        {/* Length */}
                        <InputText
                            type="number"
                            name="length"
                            value={form.filter.length ?? ""}
                            onChange={(e) =>
                                handleChange("filter", "length", e.target.value)
                            }
                            placeholder="Length"
                            required
                            style={{ width: "92px", height: "40px" }}
                        />

                        {/* Width */}
                        <InputText
                            type="number"
                            name="width"
                            value={form.filter.width ?? ""}
                            onChange={(e) =>
                                handleChange("filter", "width", e.target.value)
                            }
                            placeholder="Width"
                            required
                            style={{ width: "92px", height: "40px" }}
                        />

                        {/* Height */}
                        <InputText
                            type="number"
                            name="height"
                            value={form.filter.height ?? ""}
                            onChange={(e) =>
                                handleChange("filter", "height", e.target.value)
                            }
                            placeholder="Height"
                            required
                            style={{ width: "92px", height: "40px" }}
                        />
                    </div>
                </div>
            </div>

            {/* Add Button */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: "1rem",
                }}
            >
                <Button
                    icon="pi pi-plus"
                    label="Add Entry"
                    onClick={handleAddEntry}
                    style={{ height: "40px" }}
                />
            </div>
        </div>
    );
}
