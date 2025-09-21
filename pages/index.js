import { useState, useEffect, useRef } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [listeningField, setListeningField] = useState(null);
  const [step, setStep] = useState(0); // 0:name, 1:email, 2:message, 3:confirm, 4:final confirmation
  const retryRef = useRef(0);
  const recognitionRef = useRef(null);

  const fields = ["name", "email", "message"];
  const MAX_RETRIES = 2;

  // Speech synthesis
  const speak = (text) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    synth.speak(utter);
  };

  // Beep for listening start/end
  const beep = (duration = 200, frequency = 600, volume = 0.5) => {
    if (typeof window === "undefined") return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.value = volume;
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    oscillator.start();
    setTimeout(() => { oscillator.stop(); ctx.close(); }, duration);
  };

  // Validate input
  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
    return true;
  };

  // Handle speech result
  const handleRecognitionResult = (transcript) => {
    transcript = transcript.toLowerCase().trim();

    // Repeat command
    if (transcript === "repeat" && step < 3) {
      speak(`Repeating ${fields[step]}. Please speak now.`);
      setTimeout(startListening, 500);
      return;
    }

    if (step < 3) {
      // Validate input
      if (!validateInput(fields[step], transcript)) {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current += 1;
          speak(`I didn't catch that. Please repeat your ${fields[step]}.`);
          setTimeout(startListening, 500);
          return;
        } else {
          speak(`Skipping ${fields[step]} due to repeated errors.`);
          retryRef.current = 0;
          setStep((s) => s + 1);
          setTimeout(startListening, 500);
          return;
        }
      }

      // Save value
      setForm((prev) => {
        const updated = { ...prev, [fields[step]]: transcript };
        speak(`${fields[step]} recorded as ${transcript}`);
        return updated;
      });

      retryRef.current = 0;
      setStep((s) => s + 1);
      setTimeout(startListening, 500);
      return;
    }

    // Confirmation Step
    if (step === 3) {
      if (transcript.startsWith("change ")) {
        const fieldToChange = transcript.replace("change ", "").trim();
        if (fields.includes(fieldToChange)) {
          setStep(fields.indexOf(fieldToChange));
          retryRef.current = 0;
          speak(`Okay, let's change ${fieldToChange}.`);
          setTimeout(startListening, 500);
          return;
        } else {
          speak("Field not recognized. Say name, email, or message.");
          setTimeout(startListening, 500);
          return;
        }
      } else if (transcript === "continue") {
        setStep(4);
        setTimeout(startListening, 500);
        return;
      } else {
        speak("Please say 'change name/email/message' or 'continue'.");
        setTimeout(startListening, 500);
        return;
      }
    }

    // Final submission step
    if (step === 4) {
      if (transcript === "yes") handleSubmit();
      else if (transcript === "no") {
        speak("Form submission cancelled. Restarting.");
        setForm({ name: "", email: "", message: "" });
        setStep(0);
        setTimeout(startListening, 500);
      } else {
        speak("Please say yes to submit or no to cancel.");
        setTimeout(startListening, 500);
      }
    }
  };

  // Start speech recognition
  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    if (recognitionRef.current) recognitionRef.current.stop();

    const currentField = step < 3 ? fields[step] : null;
    setListeningField(currentField);

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      beep(150, 800, 0.5);
      if (step < 3) speak(`Listening for ${currentField}`);
      else if (step === 3) {
        speak(
          `You said: Name: ${form.name}, Email: ${form.email}, Message: ${form.message}. Say "change name/email/message" or "continue".`
        );
      } else if (step === 4) {
        speak("Say yes to submit or no to cancel.");
      }
    };

    recognition.onend = () => {
      beep(100, 400, 0.3);
      setListeningField(null);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleRecognitionResult(transcript);
    };

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
      setTimeout(startListening, 1000);
    } catch {
      speak("Error submitting form.");
      alert("Error submitting form");
      setStep(0);
      setTimeout(startListening, 1000);
    }
  };

  useEffect(() => {
    speak("Welcome! Let's fill your form using your voice.");
    setTimeout(startListening, 1000);
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg p-4 w-100" style={{ maxWidth: "500px", borderRadius: "1rem" }}>
        <h1 className="h3 mb-4 text-center fw-bold text-primary">🎤 Voice Form</h1>

        {fields.map((field) => (
          <div key={field} className="mb-3">
            <label className="form-label fw-semibold">
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              type={field === "email" ? "email" : "text"}
              value={form[field]}
              readOnly
              className={`form-control ${listeningField === field ? "border-success" : "border-primary"}`}
              placeholder={`Enter ${field}`}
            />
          </div>
        ))}

        {step === 3 && (
          <div className="alert alert-info text-center">
            Reading back your entries:<br />
            <strong>Name:</strong> {form.name} <br />
            <strong>Email:</strong> {form.email} <br />
            <strong>Message:</strong> {form.message} <br />
            Say "change name/email/message" to correct or "continue" to submit.
          </div>
        )}

        {step === 4 && (
          <div className="alert alert-warning text-center">
            Say "yes" to submit or "no" to cancel.
          </div>
        )}
      </div>
    </div>
  );
}
