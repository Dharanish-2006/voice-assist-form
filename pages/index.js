import { useState, useRef } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", username: "", message: "" });
  const [step, setStep] = useState(0); // 0=name,1=username,2=message,3=confirm
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);
  const retryRef = useRef(0);

  const fields = ["name", "username", "message"];
  const MAX_RETRIES = 2;

  // Beep sound
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  // Speak text
  const speak = (text, cb = null) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    if (cb) utter.onend = cb;
    synth.speak(utter);
    setStatus(text);
  };

  // Validate input
  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "username") return /^[a-zA-Z0-9_]{3,20}$/.test(value);
    return true;
  };

  // Start speech recognition
  const startListening = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak("Speech recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) recognitionRef.current.stop();

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = beep;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase().trim();
      handleResult(transcript);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      // Keep listening automatically if not at confirmation step
      if (step < 3) startListening();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Prompt user for current step
  const promptStep = (s) => {
    if (s < 3) {
      speak(`Please say your ${fields[s]}.`, startListening);
    } else {
      speak(
        `You entered Name: ${form.name}, Username: ${form.username}, Message: ${form.message}. Say yes to submit or no to cancel.`,
        startListening
      );
    }
  };

  // Handle recognition result
  const handleResult = (transcript) => {
    if (transcript === "repeat") {
      promptStep(step);
      return;
    }

    if (step < 3) {
      if (!validateInput(fields[step], transcript)) {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current++;
          speak(`I didn't catch that. Please repeat your ${fields[step]}.`, startListening);
          return;
        } else {
          retryRef.current = 0;
          speak(`Skipping ${fields[step]} due to repeated errors.`, () => {
            setStep((s) => {
              const next = s + 1;
              promptStep(next);
              return next;
            });
          });
          return;
        }
      }

      retryRef.current = 0;
      setForm((prev) => ({ ...prev, [fields[step]]: transcript }));

      // Move to next step
      speak(`You said: ${transcript}.`, () => {
        setStep((s) => {
          const next = s + 1;
          promptStep(next);
          return next;
        });
      });
    } else {
      // Confirmation step
      if (transcript === "yes") handleSubmit();
      else if (transcript === "no") {
        speak("Form submission cancelled. Restarting.", () => {
          setForm({ name: "", username: "", message: "" });
          setStep(0);
          promptStep(0);
        });
      } else {
        speak("Please say yes or no.", startListening);
      }
    }
  };

  // Submit to MongoDB via API
  const handleSubmit = async () => {
    try {
      speak("Submitting your form, please wait...");
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        speak("Form submitted successfully!");
        alert("Form submitted:\n" + JSON.stringify(form, null, 2));
        setForm({ name: "", username: "", message: "" });
        setStep(0);
      } else {
        speak("Failed to submit form.");
        alert("Error submitting form.");
      }
    } catch (err) {
      console.error(err);
      speak("Error submitting form.");
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-4 shadow" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-3">🎤 Voice Form</h3>

        {/* Start button */}
        {step === 0 &&
          form.name === "" &&
          form.username === "" &&
          form.message === "" && (
            <div className="text-center mb-3">
              <button className="btn btn-primary" onClick={() => promptStep(0)}>
                🎤 Start Voice Form
              </button>
            </div>
          )}

        {fields.map((f, idx) => (
          <div className="mb-3" key={f}>
            <label>{f.toUpperCase()}</label>
            <input
              type="text"
              value={form[f]}
              readOnly
              className={`form-control ${step === idx ? "border-success border-3" : ""}`}
            />
          </div>
        ))}

        <div className="alert alert-info">{status}</div>
      </div>
    </div>
  );
}
