// app\api\database\clients\notes\[id]\route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import Note from "../../../../../../models/database/clients/Note";

export async function GET(request, { params }) {
  const { id } = await params; // Updated: await params to extract id
  try {
    await dbConnect();
    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params; // Updated: await params to extract id
  try {
    await dbConnect();
    const body = await request.json();
    const note = await Note.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!note) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params; // Updated: await params to extract id
  try {
    await dbConnect();
    const deletedNote = await Note.deleteOne({ _id: id });
    if (!deletedNote) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }
}

