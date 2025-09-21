import { useEffect, useRef, useState } from "react";

export default function VoiceForm() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [step, setStep] = useState(0); // 0=name,1=phone,2=message,3=confirm
  const [status, setStatus] = useState("");
  const [activeField, setActiveField] = useState("");
  const recognitionRef = useRef(null);
  const fields = ["name", "phone", "message"];

  // Only define SpeechRecognition on the client
  const getSpeechRecognition = () =>
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const speak = (text) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    synth.speak(utter);
    setStatus(text);
  };

  const validateInput = (field, value) => {
    if (!value) return false;
    if (field === "phone") return /^\d{10}$/.test(value.replace(/\D/g, ""));
    return true;
  };

  const startListening = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      speak("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setActiveField(fields[step]);
    speak(`Please say your ${fields[step]}`);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      handleResult(transcript);
    };

    recognition.onend = () => {
      // Do nothing here to prevent infinite loop
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleResult = (input) => {
    const field = fields[step];
    const value = field === "phone" ? input.replace(/\D/g, "") : input;

    if (!validateInput(field, value)) {
      speak(`Invalid ${field}. Please try again.`, startListening);
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
    speak(`${field} set to ${value}`);

    if (step < 2) setStep((s) => s + 1);
    else confirmSubmit();
  };

  const confirmSubmit = () => {
    setActiveField("");
    speak(
      `You entered: Name: ${form.name}, Phone: ${form.phone}, Message: ${form.message}. Say yes to submit or no to cancel.`
    );

    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      if (transcript === "yes") handleSubmit();
      else if (transcript === "no") {
        speak("Form cancelled. Restarting.");
        setForm({ name: "", phone: "", message: "" });
        setStep(0);
        startListening();
      } else {
        speak("Please say yes or no.", confirmSubmit);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSubmit = () => {
    speak("Form submitted successfully!");
    alert("Form submitted:\n" + JSON.stringify(form, null, 2));
    setForm({ name: "", phone: "", message: "" });
    setStep(0);
    startListening();
  };

  useEffect(() => {
    // Start voice input after component mounts
    startListening();
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card p-4 shadow" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-3">🎤 Voice Form</h3>

        {fields.map((f) => (
          <div key={f} className="mb-3">
            <label>{f.toUpperCase()}</label>
            <input
              type="text"
              value={form[f]}
              readOnly
              className={`form-control ${
                activeField === f ? "border border-3 border-success" : ""
              }`}
            />
          </div>
        ))}

        <div className="alert alert-info">{status}</div>
      </div>
    </div>
  );
}
