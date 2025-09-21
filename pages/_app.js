// import { useState, useEffect, useRef } from "react";
// import 'bootstrap-icons/font/bootstrap-icons.css';
// import 'bootstrap/dist/css/bootstrap.min.css';

// export default function VoiceForm() {
//   const [form, setForm] = useState({ name: "", email: "", message: "" });
//   const [listeningField, setListeningField] = useState(null);
//   const [step, setStep] = useState(0); // 0: name, 1: email, 2: message, 3: confirm
//   const [retryCount, setRetryCount] = useState(0);
//   const recognitionRef = useRef(null);

//   const fields = ["name", "email", "message"];
//   const MAX_RETRIES = 2;

//   const speak = (text) => {
//     const synth = window.speechSynthesis;
//     if (!synth) return;
//     const utter = new SpeechSynthesisUtterance(text);
//     utter.lang = "en-US";
//     synth.speak(utter);
//   };

//   const validateInput = (field, value) => {
//     if (!value) return false;
//     if (field === "email") {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       return emailRegex.test(value);
//     }
//     return true;
//   };

//   const startListening = () => {
//     if (!("webkitSpeechRecognition" in window)) {
//       alert("Your browser does not support speech recognition.");
//       return;
//     }

//     if (recognitionRef.current) recognitionRef.current.stop();

//     const recognition = new window.webkitSpeechRecognition();
//     recognition.lang = "en-US";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     recognition.onstart = () => {
//       if (step < 3) setListeningField(fields[step]);
//       speak(
//         step < 3
//           ? `Listening for ${fields[step]}`
//           : "Do you want to submit the form? Say yes or no."
//       );
//     };

//     recognition.onend = () => {
//       setListeningField(null);
//       if (step <= 3) startListening();
//     };

//     recognition.onresult = (event) => {
//       const transcript = event.results[0][0].transcript.toLowerCase().trim();

//       // Check for repeat command
//       if (transcript === "repeat") {
//         speak(
//           step < 3
//             ? `Repeating ${fields[step]}. Please speak now.`
//             : "Repeating confirmation. Say yes or no."
//         );
//         return; // do not advance step
//       }

//       if (step < 3) {
//         if (!validateInput(fields[step], transcript)) {
//           if (retryCount < MAX_RETRIES) {
//             setRetryCount(retryCount + 1);
//             speak(`I didn't catch that. Please repeat your ${fields[step]}.`);
//             return;
//           } else {
//             speak(`Skipping ${fields[step]} due to repeated errors.`);
//             setRetryCount(0);
//             setStep(step + 1);
//             return;
//           }
//         }

//         setForm((prev) => ({ ...prev, [fields[step]]: transcript }));
//         speak(`${fields[step]} set to ${transcript}`);
//         setRetryCount(0);
//         setStep(step + 1);
//       } else {
//         // Confirmation step
//         if (transcript === "yes") handleSubmit();
//         else if (transcript === "no") speak("Form submission cancelled.");
//         else {
//           speak("I didn't understand. Please say yes or no.");
//           return; // retry confirmation
//         }
//         setStep(0); // reset form
//       }
//     };

//     recognition.start();
//     recognitionRef.current = recognition;
//   };

//   const handleSubmit = async () => {
//     speak("Submitting form. Please wait.");
//     const res = await fetch("/api/submit", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form),
//     });
//     if (res.ok) {
//       speak("Form submitted successfully!");
//       alert("Form submitted successfully!");
//       setForm({ name: "", email: "", message: "" });
//     } else {
//       speak("Error submitting form.");
//       alert("Error submitting form");
//     }
//   };

//   useEffect(() => {
//     speak("Welcome! Let's fill your form using your voice.");
//     setTimeout(() => startListening(), 1000);
//   }, []);

//   return (
//     <div
//       className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient"
//       style={{ background: "linear-gradient(135deg, #e0f7fa, #80deea)" }}
//     >
//       <div
//         className="card shadow-lg p-4 p-md-5 w-100"
//         style={{ maxWidth: "550px", borderRadius: "1rem" }}
//       >
//         <h1 className="h3 mb-4 text-center fw-bold text-primary">🎤 Voice Form</h1>

//         <div className="mb-3 text-center fw-semibold">
//           {step < 3
//             ? `Step ${step + 1} of 3: ${fields[step].charAt(0).toUpperCase() +
//                 fields[step].slice(1)}`
//             : "Confirmation Step"}
//         </div>

//         {fields.map((field) => (
//           <div key={field} className="mb-3">
//             <label className="form-label fw-semibold">
//               {field.charAt(0).toUpperCase() + field.slice(1)}
//             </label>
//             <input
//               type={field === "email" ? "email" : "text"}
//               name={field}
//               value={form[field]}
//               readOnly
//               className={`form-control border border-2 rounded ${
//                 listeningField === field ? "border-success" : "border-primary"
//               }`}
//               placeholder={`Enter your ${field}`}
//             />
//           </div>
//         ))}

//         <div className="alert alert-info text-center">
//           {step < 3
//             ? `Listening for ${fields[step]}... Say "repeat" to repeat this field.`
//             : 'Do you want to submit the form? Say "yes" or "no".'}
//         </div>
//       </div>
//     </div>
//   );
// }
// pages/_app.js
import 'bootstrap/dist/css/bootstrap.min.css';      // Bootstrap CSS
import 'bootstrap-icons/font/bootstrap-icons.css';  // Bootstrap Icons
import '../styles/globals.css';                     // Optional: your own global CSS

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
