import '@/styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css';

import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [listening, setListening] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startListening = (field) => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setForm((prev) => ({ ...prev, [field]: transcript }));
    };

    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      alert("Form submitted successfully!");
      setForm({ name: "", email: "", message: "" });
    } else {
      alert("Error submitting form");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <h1 className="text-2xl font-bold">Tailwind is Working 🎉</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold">Voice Form</h1>

        {/* Name */}
        <div>
          <label className="block font-semibold">Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="border p-2 flex-grow rounded"
              aria-label="Name field"
            />
            <button
              type="button"
              onClick={() => startListening("name")}
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              🎤
            </button>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block font-semibold">Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border p-2 flex-grow rounded"
              aria-label="Email field"
            />
            <button
              type="button"
              onClick={() => startListening("email")}
              className="px-3 py-2 bg-blue-500 text-red rounded"
            >
              🎤
            </button>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block font-semibold">Message</label>
          <div className="flex gap-2">
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              className="border p-2 flex-grow rounded"
              aria-label="Message field"
            />
            <button
              type="button"
              onClick={() => startListening("message")}
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              🎤
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-lg"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
