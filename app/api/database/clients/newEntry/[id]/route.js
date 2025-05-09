// app\api\database\clients\newEntry\[id]\route.js
"use server";
import dbConnect from "../../../../../../lib/dbConnect";
import Group from "../../../../../../models/database/clients/Group";
import Chain from "../../../../../../models/database/clients/Chain";
import Site from "../../../../../../models/database/clients/Site";
import Contact from "../../../../../../models/database/clients/Contact";

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = await params; // Await params here
  let entry = await Group.findById(id);
  if (entry) return new Response(JSON.stringify({ success: true, data: entry }), { status: 200 });
  entry = await Chain.findById(id);
  if (entry) return new Response(JSON.stringify({ success: true, data: entry }), { status: 200 });
  entry = await Site.findById(id);
  if (entry) return new Response(JSON.stringify({ success: true, data: entry }), { status: 200 });
  entry = await Contact.findById(id);
  if (entry) return new Response(JSON.stringify({ success: true, data: entry }), { status: 200 });
  return new Response(JSON.stringify({ success: false, message: "Entry not found" }), { status: 404 });
}
