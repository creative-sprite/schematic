// pages/api/items.js
import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // connect to Mongo
    // fetch documents
    // res.json(...)
  } else if (req.method === "POST") {
    // handle create
  }
  // etc.
}
