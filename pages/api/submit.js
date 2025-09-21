// pages/api/submit.js
import connectToDatabase from "../../lib/mongodb";
import Form from "../../models/Form";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newForm = new Form({ name, email, message });
    await newForm.save();

    return res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
}
