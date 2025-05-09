// components\kitchenSurvey\TreeSelectFilter.jsx

"use client";

import React, { useState, useEffect } from "react";
import { TreeSelect } from "primereact/treeselect";
import "primereact/resources/themes/saga-orange/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

// Allowed subcategories for your DB-driven items
const allowedPricingSubs = [
    "ventilation",
    "access doors",
    "fan",
    "grease extract red",
    "grease extract cream",
    "grease extract steel",
    "grease extract circular",
];

function buildTreeData(items) {
    const categories = {};
    items.forEach((itm) => {
        if (itm.source === "pricing") {
            if (!itm.category || !itm.subcategory) {
                return;
            }
            // Allowed categories: system, air, grease.
            const allowedCategories = [
                "system",
                "air",
                "grease",
                "access doors",
            ];
            if (!allowedCategories.includes(itm.category.toLowerCase())) {
                return;
            }
            // For items under "system", filter subcategories.
            if (itm.category.toLowerCase() === "system") {
                if (
                    !allowedPricingSubs.includes(itm.subcategory.toLowerCase())
                ) {
                    return;
                }
            }
            // For categories "air" and "grease", allow all subcategories.
        }
        const cat = itm.category || "Other";
        if (!categories[cat]) {
            categories[cat] = {};
        }
        const sub = itm.subcategory || "Other";
        if (!categories[cat][sub]) {
            categories[cat][sub] = [];
        }
        categories[cat][sub].push(itm);
    });

    // Create sorted tree structure
    const tree = [];
    // Sort categories alphabetically
    const sortedCategoryKeys = Object.keys(categories).sort((a, b) =>
        a.localeCompare(b)
    );
    sortedCategoryKeys.forEach((cat) => {
        const catNode = {
            key: cat,
            label: cat,
            value: { name: cat, image: "" },
            selectable: false,
            children: [],
        };
        // Sort subcategories alphabetically
        const sortedSubcatKeys = Object.keys(categories[cat]).sort((a, b) =>
            a.localeCompare(b)
        );
        sortedSubcatKeys.forEach((sub) => {
            // Sort items within each subcategory by item name
            const sortedItems = categories[cat][sub].sort((a, b) =>
                a.item.localeCompare(b.item)
            );
            const subNode = {
                key: `${cat}-${sub}`,
                label: sub,
                value: { name: sub, image: "" },
                selectable: false,
                children: sortedItems.map((itm) => ({
                    key: `${cat}-${sub}-${itm.item}`,
                    label: itm.item,
                    value: {
                        name: itm.item,
                        image: itm.svgPath || itm.image || "",
                        category: itm.category || "",
                        subcategory: itm.subcategory || "",
                        id: itm._id || "",
                        prices: itm.prices || null,
                        isSpecial: false,
                        aggregateEntry: itm.aggregateEntry,
                        requiresDimensions: itm.requiresDimensions,
                        calculationType: itm.calculationType || "",
                    },
                })),
            };
            catNode.children.push(subNode);
        });
        tree.push(catNode);
    });

    // Special branch with additional special objects.
    const specialBranch = {
        key: "Special",
        label: "Special",
        value: {
            name: "Special",
            image: "",
            isSpecialCategory: true,
        },
        selectable: false,
        children: [
            {
                key: "Special-Measurement",
                label: "Measurement",
                value: {
                    isSpecial: true,
                    type: "measurement",
                    name: "Measurement",
                    startImage: "/schematic/special/start.svg",
                    endImage: "/schematic/special/end.svg",
                },
            },
            {
                key: "Special-Label",
                label: "Label",
                value: {
                    isSpecial: true,
                    type: "label",
                    name: "Label",
                },
            },
            {
                key: "Special-Connectors",
                label: "Connectors",
                value: {
                    isSpecial: true,
                    type: "connectors",
                    name: "Connectors",
                },
            },
        ],
    };

    tree.unshift(specialBranch);
    console.log(
        "buildTreeData -> Final tree structure:",
        JSON.parse(JSON.stringify(tree))
    );
    return tree;
}

export default function TreeSelectFilter({
    onSelectItem,
    onSelectSpecial,
    resetSelection,
    onResetComplete,
}) {
    const [treeData, setTreeData] = useState([]);
    const [selectedKey, setSelectedKey] = useState(null);
    const [expandedKeys, setExpandedKeys] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (resetSelection) {
            setSelectedKey(null);
            setRefreshKey((prev) => prev + 1);
            if (typeof onResetComplete === "function") {
                onResetComplete();
            }
        }
    }, [resetSelection, onResetComplete]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pricingRes = await fetch(
                    "/api/priceList?category=System&subcategories=Ventilation,Access Doors,Fan,Air,Grease Extract Cream,Grease Extract Red,Grease Extract Steel,Grease Extract Circular"
                );
                const pricingJson = await pricingRes.json();
                const pricingItems = pricingJson.success
                    ? pricingJson.data.map((itm) => ({
                          ...itm,
                          source: "pricing",
                      }))
                    : [];

                const partsRes = await fetch("/api/parts");
                const partsJson = await partsRes.json();
                const partsItems = partsJson.success
                    ? partsJson.data.map((itm) => ({ ...itm, source: "parts" }))
                    : [];

                const combined = [...pricingItems, ...partsItems];
                const data = buildTreeData(combined);
                setTreeData(data);
                setExpandedKeys({});
            } catch (error) {
                console.error("Error fetching tree data:", error);
            }
        };
        fetchData();
    }, []);

    const findNodeByKey = (nodes, key) => {
        for (const node of nodes) {
            if (node.key === key) return node;
            if (node.children) {
                const found = findNodeByKey(node.children, key);
                if (found) return found;
            }
        }
        return null;
    };

    const selectedValueTemplate = (option, props) => {
        const node = findNodeByKey(treeData, selectedKey);
        if (!node) {
            return <span>{props.placeholder}</span>;
        }
        const { image = "", name = "" } = node.value;
        return (
            <div style={{ display: "flex", alignItems: "center" }}>
                {image && (
                    <img
                        src={image}
                        alt={name}
                        style={{
                            width: "20px",
                            height: "20px",
                            marginRight: "4px",
                        }}
                    />
                )}
                <span>{name}</span>
            </div>
        );
    };

    const onToggle = (e) => {
        setExpandedKeys(e.value);
    };

    const onChange = (e) => {
        setSelectedKey(e.value);
        setExpandedKeys({});
        const node = findNodeByKey(treeData, e.value);
        if (!node) {
            if (onSelectItem) onSelectItem(null);
        } else {
            if (node.value.isSpecial) {
                if (onSelectSpecial) {
                    onSelectSpecial(node.value);
                }
            } else {
                if (onSelectItem) {
                    onSelectItem(node.value);
                }
            }
        }
    };

    return (
        <TreeSelect
            key={refreshKey}
            value={selectedKey}
            options={treeData}
            onChange={onChange}
            expandedKeys={expandedKeys}
            onToggle={onToggle}
            placeholder="Select an item"
            valueTemplate={selectedValueTemplate}
            style={{ width: "100%", height: "40px" }}
        />
    );
}
