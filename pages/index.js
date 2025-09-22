import { useState, useEffect, useRef } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", username: "", message: "" });
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);
  const retryRef = useRef(0);

  const fields = ["name", "username", "message"];
  const MAX_RETRIES = 2;

  // 🟢 Beep sound
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

  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "username") return /^[a-zA-Z0-9_]{3,20}$/.test(value);
    return true;
  };

  const startRecognition = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak("Speech recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) return; // Already running

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = beep;

    recognition.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      handleResult(transcript);
    };

    recognition.onend = () => {
      // Automatically restart unless form is done
      if (step <= 3) recognition.start();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const promptStep = (s) => {
    if (s < 3) speak(`Please say your ${fields[s]}.`, startRecognition);
    else
      speak(
        `You entered: Name: ${form.name}, Username: ${form.username}, Message: ${form.message}. Say yes to submit or no to cancel.`,
        startRecognition
      );
  };

  const handleResult = (transcript) => {
    if (transcript === "repeat") {
      promptStep(step);
      return;
    }

    if (step < 3) {
      if (!validateInput(fields[step], transcript)) {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current++;
          speak(`I didn't catch that. Please repeat your ${fields[step]}.`);
          return;
        } else {
          retryRef.current = 0;
          speak(`Skipping ${fields[step]} due to repeated errors.`);
          setStep((s) => s + 1);
          return;
        }
      }

      retryRef.current = 0;
      setForm((prev) => ({ ...prev, [fields[step]]: transcript }));
      speak(`You said: ${transcript}.`);
      setStep((s) => s + 1);
    } else {
      // Confirmation
      if (transcript === "yes") handleSubmit();
      else if (transcript === "no") {
        speak("Form submission cancelled. Restarting from beginning.", () => {
          setForm({ name: "", username: "", message: "" });
          setStep(0);
        });
      } else {
        speak("Please say yes or no.");
      }
    }
  };

  const handleSubmit = () => {
    speak("Form submitted successfully!");
    alert("Form submitted:\n" + JSON.stringify(form, null, 2));
    setForm({ name: "", username: "", message: "" });
    setStep(0);
  };

  useEffect(() => {
    // Start voice automatically after initial click
    speak("Welcome! Let's fill your form using voice.", startRecognition);
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-4 shadow" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-3">🎤 Voice Form</h3>

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
