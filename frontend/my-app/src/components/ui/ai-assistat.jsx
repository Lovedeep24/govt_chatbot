import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Loader2 ,Mic, Square} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
const AIMessageBar = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  // Simulate AI typing effect
  const simulateResponse = (userMessage) => {
    setIsTyping(true);
    
    // Simulate different responses based on input
    let response = "Hi there! I'm your AI assistant. How can I help you today?";
    
    if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
      response = "Hello! I'm your friendly AI assistant. What can I do for you?";
    } else if (userMessage.toLowerCase().includes("help")) {
      response = "I'm here to help! You can ask me questions, request information, or just chat.";
    } else if (userMessage.toLowerCase().includes("thank")) {
      response = "You're welcome! Is there anything else you'd like to know?";
    } else if (userMessage.toLowerCase().includes("who are you")) {
      response = "I'm an AI assistant designed to be helpful, harmless, and honest!";
    }
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { text: response, isUser: false }]);
    }, 1500); 
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (input.trim() === "") return;
    
    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setInput("");
    
    simulateResponse(userMessage);
  };
  


  const [isRecording, setIsRecording] = useState(false);
  const RECORDING_DURATION = 10000; // 10 seconds
  const recordingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalRef = useRef(null);
  const startRecording = async () => {
  setTimeLeft(RECORDING_DURATION / 1000);

  clearInterval(intervalRef.current);

  intervalRef.current = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      clearInterval(intervalRef.current);

      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      await sendAudioToBackend(audioBlob);

      stream.getTracks().forEach((track) => track.stop());

      setTimeLeft(0);
      setIsRecording(false);
    };

    mediaRecorder.start();
    setIsRecording(true);

    recordingTimeoutRef.current = setTimeout(() => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    }, RECORDING_DURATION);

  } catch (error) {
    console.error(error);
  }
};
const stopRecording = () => {
  if (
    mediaRecorderRef.current &&
    mediaRecorderRef.current.state === "recording"
  ) {
    clearTimeout(recordingTimeoutRef.current);
    clearInterval(intervalRef.current);

    mediaRecorderRef.current.stop();

    setTimeLeft(0);
    setIsRecording(false);
  }
};
useEffect(() => {
  return () => {
    clearTimeout(recordingTimeoutRef.current);
    clearInterval(intervalRef.current);
  };
}, []);

const sendAudioToBackend = async (audioBlob) => {
  try {
    const formData = new FormData();

    formData.append(
      "audio",
      audioBlob,
      `recording-${Date.now()}.webm`
    );

    const response = await fetch(
      // "http://127.0.0.1:5000",
      "http://localhost:5000/api/audio/",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    console.log("Backend Response:", data);

   } catch (error) {
    console.error(error);
   }
  };
  const clearChat = () => {
    setMessages([]);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

return (
  <>
    
    <div className="h-screen bg-slate-950 flex justify-center">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-5xl flex flex-col h-full">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-400 h-5 w-5" />
            <h2 className="text-white font-medium text-lg">
              AI Assistant
            </h2>
          </div>

          <button
            onClick={clearChat}
            className="text-slate-400 hover:text-white transition-colors hover:cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="h-14 w-14 text-indigo-400 mx-auto mb-4" />

                <h3 className="text-white text-2xl font-semibold mb-2">
                  How can I Assist you today?
                </h3>

                <p className="text-slate-400">
                  Let's resolve your queries and find best Schemes for you
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[75%]
                      px-4
                      py-3
                      rounded-2xl
                      animate-fade-in
                      ${
                        msg.isUser
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-100 border border-slate-700"
                      }
                    `}
                  >
                    <p className="text-sm leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Section */}
        <div
          className={`border-t ${
            isFocused
              ? "border-indigo-500/50"
              : "border-slate-800"
          } bg-slate-950 p-4 transition-colors`}
        >
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto"
          >
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Message AI Assistant..."
                className="
                  w-full
                  bg-slate-800
                  border
                  border-slate-700
                  rounded-3xl
                  py-4
                  pl-5
                  pr-14
                  text-white
                  placeholder:text-slate-400
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500
                "
              />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
  
                <button
                  type="button"
                  onClick={
                    isRecording
                      ? stopRecording
                      : startRecording
                  }
                  className={`
                    p-2
                    rounded-full
                    transition-colors
                    ${
                      isRecording
                        ? "bg-red-600 text-white"
                        : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                    }
                  `}
                >
                  <div className="flex gap-1.5">
                  {isRecording ? (
                    <Square className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5 cursor-pointer"  />
                  )}
                  {isRecording && (
                    <span className="text-white-400 text-md">
                      {timeLeft}s
                    </span>
                  )}
                  </div>
                </button>
                
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`
                    p-2
                    rounded-full
                    ${
                      !input.trim()
                        ? "bg-slate-700 text-slate-500"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                    }
                  `}
                >
                  {isTyping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
                
              </div>
            </div>
          </form>
        </div>

        <style>
          {`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }

          .delay-75 {
            animation-delay: 0.2s;
          }

          .delay-150 {
            animation-delay: 0.4s;
          }
        `}
        </style>
      </div>
    </div>
  </>
);
};

export default AIMessageBar;
