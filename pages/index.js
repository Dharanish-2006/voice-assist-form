// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [step, setStep] = useState(0); // 0=name, 1=email, 2=message, 3=confirm
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);

  const fields = ["name", "email", "message"];
  const MAX_RETRIES = 2;
  const retryRef = useRef(0);

  const speak = (text) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel(); // prevent overlap
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    synth.speak(utter);
    setStatus(text);
  };

  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
    return true;
  };

  const promptStep = (s) => {
    if (s < 3) {
      speak(`Please say your ${fields[s]}.`);
    } else {
      speak(
        `You entered. Name: ${form.name}, Email: ${form.email}, Message: ${form.message}. Say yes to submit or no to cancel.`
      );
    }
  };

  const handleResult = (raw) => {
    const transcript = raw.toLowerCase().trim();

    if (transcript === "repeat") {
      promptStep(step);
      startListening();
      return;
    }

    if (step < 3) {
      if (!validateInput(fields[step], transcript)) {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current++;
          speak(`I didn't catch that. Please repeat your ${fields[step]}.`);
          startListening();
          return;
        } else {
          retryRef.current = 0;
          speak(`Skipping ${fields[step]} due to repeated errors.`);
          setStep((s) => s + 1);
          setTimeout(() => {
            promptStep(step + 1);
            startListening();
          }, 800);
          return;
        }
      }

      // valid
      retryRef.current = 0;
      setForm((prev) => ({ ...prev, [fields[step]]: transcript }));
      speak(`${fields[step]} recorded as ${transcript}`);
      setStep((s) => s + 1);

      setTimeout(() => {
        promptStep(step + 1);
        startListening();
      }, 1000);
    } else {
      if (transcript === "yes") {
        handleSubmit();
      } else if (transcript === "no") {
        speak("Form submission cancelled. Restarting from the beginning.");
        setForm({ name: "", email: "", message: "" });
        setStep(0);
        setTimeout(() => {
          promptStep(0);
          startListening();
        }, 1200);
      } else {
        speak("Please say yes or no.");
        startListening();
      }
    }
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak("Speech recognition is not supported in your browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      handleResult(transcript);
    };

    recognition.onend = () => {
      // restart if still in form
      if (step < 4) {
        setTimeout(() => startListening(), 500);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSubmit = () => {
    speak("Form submitted successfully!");
    alert("Form submitted:\n" + JSON.stringify(form, null, 2));
    setForm({ name: "", email: "", message: "" });
    setStep(0);
    setTimeout(() => {
      promptStep(0);
      startListening();
    }, 1200);
  };

  useEffect(() => {
    speak("Welcome! Let's fill the form using your voice.");
    setTimeout(() => {
      promptStep(0);
      startListening();
    }, 1500);
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-4 shadow" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-3">🎤 Voice Form</h3>

        {fields.map((f) => (
          <div className="mb-3" key={f}>
            <label>{f.toUpperCase()}</label>
            <input
              type={f === "email" ? "email" : "text"}
              value={form[f]}
              readOnly
              className="form-control"
            />
          </div>
        ))}

        <div className="alert alert-info">{status}</div>
      </div>
    </div>
  );
}
