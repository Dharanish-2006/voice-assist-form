import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

// Define schema
const FormSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});
const Form = mongoose.models.Form || mongoose.model("Form", FormSchema);

// API Route
export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await connectDB();
      const newForm = new Form(req.body);
      await newForm.save();
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save form" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
