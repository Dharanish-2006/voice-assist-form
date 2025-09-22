import { useEffect, useRef, useState } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", username: "", message: "" });
  const [step, setStep] = useState(0); // 0=name,1=username,2=message,3=confirm
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);
  const fields = ["name", "username", "message"];
  const MAX_RETRIES = 2;
  const retryRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);

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

  const speak = (text, cb) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    isSpeakingRef.current = true;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.onend = () => {
      isSpeakingRef.current = false;
      if (cb) cb();
    };
    synth.speak(utter);
    setStatus(text);
  };

  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "username") return /^[a-zA-Z0-9_]{3,20}$/.test(value);
    return true;
  };

  const startRecognition = () => {
    if (isListeningRef.current) return; // avoid multiple recognitions
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      speak("Speech recognition not supported.", () => {});
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      beep();
    };

    recognition.onend = () => {
      isListeningRef.current = false;
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase().trim();
      handleResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const promptStep = (s) => {
    if (s < fields.length) {
      speak(`Please say your ${fields[s]}.`, () => startRecognition());
    } else {
      speak(
        `You entered: Name ${form.name}, Username ${form.username}, Message ${form.message}. Say yes to submit or no to cancel.`,
        () => startRecognition()
      );
    }
  };

  const handleResult = (transcript) => {
    if (transcript === "repeat") {
      promptStep(step);
      return;
    }

    if (step < fields.length) {
      if (!validateInput(fields[step], transcript)) {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current++;
          speak(`I didn't catch that. Please repeat your ${fields[step]}.`, () => startRecognition());
        } else {
          retryRef.current = 0;
          speak(`Skipping ${fields[step]} due to repeated errors.`, () => {
            setStep((s) => {
              const next = s + 1;
              promptStep(next);
              return next;
            });
          });
        }
        return;
      }

      retryRef.current = 0;
      setForm((prev) => ({ ...prev, [fields[step]]: transcript }));
      speak(`You said: ${transcript}.`, () => {
        setStep((s) => {
          const next = s + 1;
          promptStep(next);
          return next;
        });
      });
    } else {
      // Confirmation
      if (transcript === "yes") handleSubmit();
      else if (transcript === "no") {
        speak("Form submission cancelled. Restarting.", () => {
          setForm({ name: "", username: "", message: "" });
          setStep(0);
          promptStep(0);
        });
      } else {
        speak("Please say yes or no.", () => startRecognition());
      }
    }
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
    if (typeof window !== "undefined") promptStep(0);
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
