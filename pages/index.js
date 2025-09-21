// pages/index.js
import { useEffect, useRef, useState } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [step, setStep] = useState(0);
  const [listeningField, setListeningField] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const formRef = useRef(form);
  const stepRef = useRef(step);
  const retryRef = useRef(0);
  const recognitionRef = useRef(null);

  const fields = ["name", "email", "message"];
  const MAX_RETRIES = 2;

  // keep refs in sync
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { stepRef.current = step; }, [step]);

  const speak = (text) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    synth.speak(utter);
    setStatusMessage(text);
  };

  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
    return true;
  };

  const advanceStep = (newStep) => {
    setStep(newStep);
    stepRef.current = newStep;
  };

  const promptNextField = (curStep) => {
    if (curStep < 3) {
      speak(`Please say your ${fields[curStep]}.`);
    } else {
      const f = formRef.current;
      speak(`You said: Name: ${f.name}, Email: ${f.email}, Message: ${f.message}. Say yes to submit or no to cancel.`);
    }
  };

  const handleFinalTranscript = (rawTranscript) => {
    const transcript = rawTranscript.toLowerCase().trim();
    const curStep = stepRef.current;

    if (transcript === "repeat") {
      speak(curStep < 3 ? `Repeating ${fields[curStep]}. Please speak now.` : "Repeating confirmation. Say yes or no.");
      setTimeout(() => startListening(), 400);
      return;
    }

    if (curStep < 3) {
      if (!validateInput(fields[curStep], transcript)) {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current += 1;
          speak(`I didn't catch that. Please repeat your ${fields[curStep]}.`);
          setTimeout(() => startListening(), 500);
          return;
        } else {
          speak(`Skipping ${fields[curStep]} due to errors.`);
          retryRef.current = 0;
          advanceStep(curStep + 1);
          setTimeout(() => {
            promptNextField(stepRef.current);
            startListening();
          }, 400);
          return;
        }
      }

      // valid input
      const newForm = { ...formRef.current, [fields[curStep]]: transcript };
      setForm(newForm);
      formRef.current = newForm;
      speak(`${fields[curStep]} recorded as ${transcript}`);
      retryRef.current = 0;

      advanceStep(curStep + 1);
      setTimeout(() => {
        promptNextField(stepRef.current);
        startListening();
      }, 450);
      return;
    }

    // confirmation step
    if (transcript === "yes") {
      handleSubmit();
    } else if (transcript === "no") {
      speak("Form submission cancelled. Restarting.");
      setForm({ name: "", email: "", message: "" });
      formRef.current = { name: "", email: "", message: "" };
      advanceStep(0);
      setTimeout(() => {
        promptNextField(0);
        startListening();
      }, 500);
    } else {
      speak("Please say yes or no.");
      setTimeout(() => startListening(), 400);
    }
  };

  const createRecognition = () => {
    if (typeof window === "undefined") return null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;

    rec.onstart = () => {
      const curStep = stepRef.current;
      setListeningField(curStep < 3 ? fields[curStep] : null);
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      handleFinalTranscript(transcript);
    };

    rec.onerror = () => {
      speak("There was an error. Please try again.");
      setTimeout(() => startListening(), 500);
    };

    rec.onend = () => {
      setListeningField(null);
    };

    return rec;
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak("Your browser does not support speech recognition.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    const rec = createRecognition();
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {}
  };

  const handleSubmit = async () => {
    speak("Submitting form...");
    alert("Form submitted:\n" + JSON.stringify(formRef.current, null, 2));
    setForm({ name: "", email: "", message: "" });
    formRef.current = { name: "", email: "", message: "" };
    advanceStep(0);
    setTimeout(() => {
      promptNextField(0);
      startListening();
    }, 800);
  };

  // 🚀 auto-start voice flow when page loads
  useEffect(() => {
    speak("Welcome! Let's start filling the form using your voice.");
    setTimeout(() => {
      promptNextField(0);
      startListening();
    }, 1200);
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-4 shadow" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-3">🎤 Voice Form</h3>

        {fields.map((field) => (
          <div key={field} className="mb-3">
            <label>{field.toUpperCase()}</label>
            <input
              type={field === "email" ? "email" : "text"}
              value={form[field]}
              readOnly
              className={`form-control ${listeningField === field ? "border-success" : ""}`}
            />
          </div>
        ))}

        {step === 3 && (
          <div className="alert alert-info">
            Confirm: {form.name}, {form.email}, {form.message} — say yes or no
          </div>
        )}

        <div className="small text-muted mt-2">{statusMessage}</div>
      </div>
    </div>
  );
}
