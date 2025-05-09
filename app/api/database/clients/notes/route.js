// app\api\database\clients\notes\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Note from "../../../../../models/database/clients/Note";

export async function GET(request) {
  await dbConnect();
  // Extract the search parameters from the URL
  const { searchParams } = new URL(request.url);
  const entryId = searchParams.get("entryId");

  try {
    let notes;
    if (entryId) {
      // If an entryId is provided, filter notes by that entry
      notes = await Note.find({ entry: entryId });
    } else {
      // Otherwise, fetch all notes
      notes = await Note.find({});
    }
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    const note = await Note.create(body);
    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
