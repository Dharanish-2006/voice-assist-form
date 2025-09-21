import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.css'; // if you still want custom styles

import { useState, useEffect } from "react";

export default function Home() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [listening, setListening] = useState(false);

  // 🔊 Text-to-speech
  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    synth.speak(utter);
  };

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

    recognition.onstart = () => {
      setListening(true);
      speak(`Listening for ${field}`);
    };
    recognition.onend = () => {
      setListening(false);
      speak(`Stopped listening for ${field}`);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setForm((prev) => ({ ...prev, [field]: transcript }));
      speak(`${field} set to ${transcript}`);
    };

    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    speak("Submitting form. Please wait.");
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      speak("Form submitted successfully!");
      alert("Form submitted successfully!");
      setForm({ name: "", email: "", message: "" });
    } else {
      speak("Error submitting form.");
      alert("Error submitting form");
    }
  };

  // 🔹 Keyboard shortcuts (Ctrl+1, Ctrl+2, Ctrl+3)
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.ctrlKey) {
        if (e.key === "1") startListening("name");
        if (e.key === "2") startListening("email");
        if (e.key === "3") startListening("message");
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded p-4 w-100"
        style={{ maxWidth: "500px" }}
      >
        <h1 className="h3 mb-4 fw-bold">Voice Form</h1>

        {/* Name */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Name</label>
          <div className="d-flex gap-2">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-control"
              aria-label="Name field"
              onFocus={() =>
                speak("Name field. Press microphone button or press Control plus 1.")
              }
            />
            <button
              type="button"
              onClick={() => startListening("name")}
              onKeyDown={(e) => e.key === "Enter" && startListening("name")}
              className="btn btn-primary"
              aria-label="Activate microphone for name"
            >
              🎤
            </button>
          </div>
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Email</label>
          <div className="d-flex gap-2">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
              aria-label="Email field"
              onFocus={() =>
                speak("Email field. Press microphone button or press Control plus 2.")
              }
            />
            <button
              type="button"
              onClick={() => startListening("email")}
              onKeyDown={(e) => e.key === "Enter" && startListening("email")}
              className="btn btn-primary"
              aria-label="Activate microphone for email"
            >
              🎤
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Message</label>
          <div className="d-flex gap-2">
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              className="form-control"
              aria-label="Message field"
              onFocus={() =>
                speak("Message field. Press microphone button or press Control plus 3.")
              }
            />
            <button
              type="button"
              onClick={() => startListening("message")}
              onKeyDown={(e) => e.key === "Enter" && startListening("message")}
              className="btn btn-primary"
              aria-label="Activate microphone for message"
            >
              🎤
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-success w-100"
          onFocus={() => speak("Submit button. Press Enter to submit.")}
        >
          Submit
        </button>
      </form>
    </div>
  );
}
