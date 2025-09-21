import { useEffect, useRef, useState } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", username: "", message: "" });
  const [step, setStep] = useState(0); // 0=name,1=username,2=message,3=confirm
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);
  const retryRef = useRef(0);
  const fields = ["name", "username", "message"];
  const MAX_RETRIES = 2;

  // 🟢 Beep sound
  const beep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  // 🟢 Speak with callback
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
    if (field === "username") return /^[a-zA-Z0-9_]{3,20}$/.test(value); // simple username validation
    return true;
  };

  const promptStep = (s) => {
    if (s < 3) speak(`Please say your ${fields[s]}.`, startListening);
    else
      speak(
        `You entered: Name: ${form.name}, Username: ${form.username}, Message: ${form.message}. Say yes to submit or no to cancel.`,
        startListening
      );
  };

  const handleResult = (raw) => {
    const transcript = raw.toLowerCase().trim();

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
            setStep((s) => s + 1);
            promptStep(step + 1);
          });
          return;
        }
      }

      retryRef.current = 0;
      setForm((prev) => ({ ...prev, [fields[step]]: transcript }));

      // Confirm input before moving
      speak(
        `You said: ${transcript}. Saving it as your ${fields[step]}.`,
        () => {
          setStep((s) => s + 1);
          promptStep(step + 1);
        }
      );
    } else {
      // Confirmation step
      if (transcript === "yes") handleSubmit();
      else if (transcript === "no") {
        speak("Form submission cancelled. Restarting from beginning.", () => {
          setForm({ name: "", username: "", message: "" });
          setStep(0);
          promptStep(0);
        });
      } else {
        speak("Please say yes or no.", startListening);
      }
    }
  };

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
      const transcript = e.results[0][0].transcript;
      handleResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = () => {
    speak("Form submitted successfully!", () => {
      alert("Form submitted:\n" + JSON.stringify(form, null, 2));
      setForm({ name: "", username: "", message: "" });
      setStep(0);
      promptStep(0);
    });
  };

  useEffect(() => {
    speak("Welcome! Let's fill your form using voice.", promptStep.bind(null, 0));
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-4 shadow" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-3">🎤 Voice Form</h3>

        {fields.map((f) => (
          <div className="mb-3" key={f}>
            <label>{f.toUpperCase()}</label>
            <input type="text" value={form[f]} readOnly className="form-control" />
          </div>
        ))}

        <div className="alert alert-info">{status}</div>
      </div>
    </div>
  );
}
