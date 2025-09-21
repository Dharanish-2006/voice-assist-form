import { useState, useEffect, useRef } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [step, setStep] = useState(0);
  const [listeningField, setListeningField] = useState(null);
  const [started, setStarted] = useState(false);
  const recognitionRef = useRef(null);
  const retryRef = useRef(0);

  const fields = ["name", "email", "message"];
  const MAX_RETRIES = 2;

  // Speak utility
  const speak = (text) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    synth.speak(utter);
  };

  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
    return true;
  };

  const promptNextField = (nextStep) => {
    if (nextStep < 3) {
      speak(`Please say your ${fields[nextStep]}`);
    } else {
      speak(
        `You said: Name: ${form.name}, Email: ${form.email}, Message: ${form.message}. Say yes to submit or no to cancel.`
      );
    }
  };

  const handleRecognitionResult = (transcript) => {
    transcript = transcript.toLowerCase().trim();

    if (step < 3) {
      if (!validateInput(fields[step], transcript)) {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current++;
          speak(`I didn't catch that. Please repeat your ${fields[step]}.`);
          startListening();
          return;
        } else {
          speak(`Skipping ${fields[step]} due to repeated errors.`);
          retryRef.current = 0;
          setStep((s) => s + 1);
          promptNextField(step + 1);
          startListening();
          return;
        }
      }

      setForm((prev) => ({ ...prev, [fields[step]]: transcript }));
      speak(`${fields[step]} recorded as ${transcript}`);
      retryRef.current = 0;
      setStep((s) => s + 1);
      promptNextField(step + 1);
      startListening();
      return;
    }

    if (step === 3) {
      if (transcript === "yes") {
        handleSubmit();
      } else if (transcript === "no") {
        speak("Form submission cancelled. Restarting from the beginning.");
        setForm({ name: "", email: "", message: "" });
        setStep(0);
        promptNextField(0);
        startListening();
      } else {
        speak("Please say yes or no.");
        startListening();
      }
    }
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    if (recognitionRef.current) recognitionRef.current.stop();

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const currentField = step < 3 ? fields[step] : null;
    setListeningField(currentField);

    recognition.onstart = () => {
      if (step < 3) speak(`Listening for ${currentField}`);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleRecognitionResult(transcript);
    };

    recognition.onend = () => setListeningField(null);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSubmit = async () => {
    speak("Submitting form. Please wait.");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Network error");
      speak("Form submitted successfully!");
      alert("Form submitted successfully!");
      setForm({ name: "", email: "", message: "" });
      setStep(0);
      promptNextField(0);
      startListening();
    } catch {
      speak("Error submitting form.");
      alert("Error submitting form");
    }
  };

  const handleStart = () => {
    setStarted(true);
    speak("Welcome! Let's fill your form using your voice.");
    promptNextField(0);
    setTimeout(startListening, 1500);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      {!started ? (
        // Overlay to force user interaction
        <div
          className="d-flex flex-column align-items-center justify-content-center text-center p-5"
          style={{ cursor: "pointer" }}
          onClick={handleStart}
        >
          <h1 className="fw-bold mb-3">🎤 Voice Form</h1>
          <p className="lead">Tap anywhere to start the voice form</p>
        </div>
      ) : (
        <div
          className="card shadow-lg p-4 w-100"
          style={{ maxWidth: "500px", borderRadius: "1rem" }}
        >
          <h1 className="h3 mb-4 text-center fw-bold text-primary">
            🎤 Voice Form
          </h1>

          {fields.map((field) => (
            <div key={field} className="mb-3 position-relative">
              <label className="form-label fw-semibold">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                value={form[field]}
                readOnly
                className={`form-control ${
                  listeningField === field
                    ? "border-success border-3"
                    : "border-primary border-2"
                }`}
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}

          {step === 3 && (
            <div className="alert alert-info text-center">
              Review: <br />
              Name: {form.name} <br />
              Email: {form.email} <br />
              Message: {form.message} <br />
              Say "yes" to submit or "no" to cancel.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
