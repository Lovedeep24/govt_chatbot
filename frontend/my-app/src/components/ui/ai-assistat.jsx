import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Loader2 ,Mic, Square, Trash} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
const AIMessageBar = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const[threadID,set_threadID]=useState("")

  function generate_id(){
    const randomNumber=Math.floor(Math.random()*10000)
    return randomNumber
  }

  useEffect(()=>{
    const uid=generate_id()
    set_threadID(uid)
  },[])
  function playBase64Audio(base64Audio){
  // 1. decode base64
  const byteCharacters = atob(base64Audio);

  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);

  // 2. create blob (IMPORTANT: adjust type if needed)
  const audioBlob = new Blob([byteArray], { type: "audio/wav" });

  // 3. create URL
  const audioUrl = URL.createObjectURL(audioBlob);

  // 4. play
  const audio = new Audio(audioUrl);
  audio.play();
}
  // Simulate AI typing effect
  const sendTextToBackend = async(userMessage,input_t) => {
    setIsTyping(true);
    console.log(userMessage)
    try {
    const data = {
  message: userMessage,
  thread_id: String(threadID),
  input_type:input_t
};
console.log("data",data)
    const response = await fetch(
      "http://127.0.0.1:8000/chat/chat",
       {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }
    );
    // console.log("body",body)
    const res = await response.json();

    console.log("Backend Response:", res);
    setIsTyping(false)
    const fin=res.answer
    setMessages((prev) => [...prev, { text: fin, isUser: false }]);
    if (res.audio) {
    playBase64Audio(res.audio)
  }
   } catch (error) {
    console.error(error);
   }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (input.trim() === "") return;
    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setInput("");
    sendTextToBackend(userMessage,"text");
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
  setIsTyping(true);
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

    // const data = await response.json();
    // console.log("Backend Response:", data);
    const res = await response.json();
    console.log("Backend Response:", res);
    const transcript =res.transcription_response.transcript.transcript
    setMessages((prev) => [...prev, { text: transcript, isUser: true }]);
    sendTextToBackend(transcript,"audio")
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
    
    {/* <div className="h-screen bg-slate-950 flex justify-center">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-5xl flex flex-col h-full"> */}

      <div className="h-screen bg-slate-950 overflow-hidden">
  <Toaster richColors position="top-center" />

  <div className="flex h-full">
    {/* Sidebar CHAT HISTORY SECTION */}
    <div className="w-[30%] bg-slate-900 border-r border-slate-800 flex flex-col">

      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-semibold">
            Chat History
          </h2>
        
          <button
            onClick={clearChat}
            className="text-slate-400 hover:text-white"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>
        {/* PAST CHATS */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-xl text-slate-200 flex items-center justify-center">
            No Past Chats
          </p>
      </div>
    </div>
    <div className="w-[70%] flex flex-col h-full">
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
  <div className="group max-w-[75%]">
    
    <div
      className={`
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
      <div
        className="
          text-sm
          leading-relaxed
          [&_h1]:text-2xl
          [&_h1]:font-bold
          [&_h2]:text-xl
          [&_h2]:font-semibold
          [&_ul]:list-disc
          [&_ul]:pl-5
          [&_ol]:list-decimal
          [&_ol]:pl-5
          [&_li]:my-1
          [&_p]:mb-2
          [&_strong]:font-bold
        "
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {msg.text}
        </ReactMarkdown>
      </div>
    </div>
      {/* Feedback Buttons */}
        {!msg.isUser && (
            <div
              className="
                flex
                items-center
                gap-1
                mt-1
                ml-1
                transition-opacity
                duration-200
              "
            >
              <button
                className="
                  p-1
                  rounded-md
                  text-slate-500
                  hover:text-slate-200
                  hover:bg-slate-800
                "
              >
                <ThumbsUp size={14} />
              </button>

                  <button
                className="
                  p-1
                  rounded-md
                  text-slate-500
                  hover:text-slate-200
                  hover:bg-slate-800
                "
              >
                <ThumbsDown size={14} />
              </button>
            </div>
            )}
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
</div>
        {/* Input Section */}
        

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
