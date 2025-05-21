// components\database\clients\common\NotesTab.jsx
import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { Editor } from "primereact/editor";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataView } from "primereact/dataview";

/**
 * Component for notes management tab
 * Includes note editor and notes list
 */
const NotesTab = ({ entryId }) => {
    // States for Note (left card)
    const [noteDate, setNoteDate] = useState(new Date());
    const [noteTitle, setNoteTitle] = useState("");
    const [note, setNote] = useState("");
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [notes, setNotes] = useState([]);

    // For some entity types that include time
    const [noteTime, setNoteTime] = useState(new Date());
    const [showTimeField, setShowTimeField] = useState(false);

    // Fetch notes for this entity
    const fetchNotes = async () => {
        try {
            const res = await fetch(
                `/api/database/clients/notes?entryId=${entryId}`
            );
            const json = await res.json();
            if (json.success) {
                setNotes(json.data);
            } else {
                console.error("Failed to fetch notes:", json);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    useEffect(() => {
        if (entryId) fetchNotes();
    }, [entryId]);

    // Handler to populate the left form with an existing note for editing
    const handleEditNote = (item) => {
        setEditingNoteId(item._id);
        setNoteDate(new Date(item.date));
        setNoteTitle(item.title);
        setNote(item.note);
    };

    // Handler to add or update a note via the API
    const addOrUpdateNote = async () => {
        const payload = {
            entry: entryId,
            date: noteDate,
            title: noteTitle,
            note: note,
        };

        if (editingNoteId) {
            // Update existing note
            try {
                const res = await fetch(
                    `/api/database/clients/notes/${editingNoteId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    }
                );
                const json = await res.json();
                if (json.success) {
                    fetchNotes();
                    setEditingNoteId(null);
                } else {
                    console.error("Failed to update note:", json);
                }
            } catch (error) {
                console.error("Error updating note:", error);
            }
        } else {
            // Create new note
            try {
                const res = await fetch("/api/database/clients/notes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const json = await res.json();
                if (json.success) {
                    fetchNotes();
                } else {
                    console.error("Failed to add note:", json);
                }
            } catch (error) {
                console.error("Error adding note:", error);
            }
        }

        // Reset form fields
        setNoteDate(new Date());
        setNoteTime(new Date());
        setNoteTitle("");
        setNote("");
    };

    // Handler to delete a note
    const deleteNote = async (noteId) => {
        try {
            const res = await fetch(`/api/database/clients/notes/${noteId}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (json.success) {
                fetchNotes();
            } else {
                console.error("Failed to delete note:", json);
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    // Render a single note in the DataView
    const renderNoteItem = (item) => {
        return (
            <div
                className="p-d-flex p-jc-between p-ai-center"
                style={{
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    marginBottom: "0.5rem",
                }}
            >
                <div>
                    <div>
                        <strong>Date:</strong>{" "}
                        {new Date(item.date).toLocaleDateString()}
                    </div>
                    <div>
                        <strong>Title:</strong> {item.title}
                    </div>
                    <div>
                        <strong>Note:</strong>
                        <div dangerouslySetInnerHTML={{ __html: item.note }} />
                    </div>
                </div>
                <div style={{ gap: "0.5rem" }}>
                    <Button
                        style={{ marginRight: "0.5rem" }}
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-text"
                        onClick={() => handleEditNote(item)}
                    />
                    <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-text"
                        onClick={() => deleteNote(item._id)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                width: "100%",
            }}
        >
            {/* Note Input */}
            <div style={{ marginBottom: "1rem" }}>
                <Card title="Add/Edit Note">
                    <div
                        className="p-fluid"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <div className="p-field">
                            <InputText
                                style={{
                                    margin: "0 0 1rem 0",
                                }}
                                placeholder={"title"}
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                            />
                        </div>
                        <div className="p-field">
                            <Calendar
                                style={{
                                    margin: "0 0 1rem 0",
                                    gap: "0.5rem",
                                }}
                                value={noteDate}
                                onChange={(e) => setNoteDate(e.value)}
                                dateFormat="mm/dd/yy"
                                showIcon
                            />
                        </div>
                        {showTimeField && (
                            <div className="p-field">
                                <label>Time</label>
                                <Calendar
                                    value={noteTime}
                                    onChange={(e) => setNoteTime(e.value)}
                                    timeOnly
                                    showIcon
                                />
                            </div>
                        )}
                    </div>
                    <div className="p-field">
                        <Editor
                            style={{
                                height: "100px",
                            }}
                            value={note}
                            onTextChange={(e) => setNote(e.htmlValue)}
                        />
                    </div>
                    <Button
                        style={{
                            margin: "1rem 0 0 0",
                        }}
                        label={editingNoteId ? "Update Note" : "Add Note"}
                        onClick={addOrUpdateNote}
                    />
                </Card>
            </div>

            {/* Saved Notes */}
            <div>
                <Card
                    title="Notes"
                    style={{ width: "100%", overflowY: "auto" }}
                >
                    <DataView
                        value={notes}
                        itemTemplate={renderNoteItem}
                        layout="list"
                        emptyMessage="No notes found"
                    />
                </Card>
            </div>
        </div>
    );
};

export default NotesTab;
