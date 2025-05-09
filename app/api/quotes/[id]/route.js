// app/api/quotes/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote from "@/models/database/quotes/Quote";

// GET a single quote by ID
export async function GET(request, { params }) {
  try {
    // Await params object before destructuring
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await dbConnect();
    const quote = await Quote.findById(id);

    if (!quote) {
      return NextResponse.json(
        { message: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quote, { status: 200 });
  } catch (error) {
    console.error("Error fetching quote:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE a quote by ID
export async function DELETE(request, { params }) {
  try {
    // Await params object before destructuring
    const resolvedParams = await params;
    const id = resolvedParams.id;

    await dbConnect();
    const quote = await Quote.findByIdAndDelete(id);

    if (!quote) {
      return NextResponse.json(
        { message: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Quote deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}