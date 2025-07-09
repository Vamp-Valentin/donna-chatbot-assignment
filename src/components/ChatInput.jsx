import React, { useState } from "react";

export default function ChatInput({ onSend }) {
  const [prompt, setPrompt] = useState("");

  const send = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setPrompt("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  const svgClass = prompt.trim()
    ? "w-8 h-8 ml-2 cursor-pointer opacity-100 pointer-events-auto transition-opacity duration-200 ease-in-out"
    : "w-8 h-8 ml-2 cursor-pointer opacity-30 pointer-events-none transition-opacity duration-200 ease-in-out";

  return (
    <div className="w-full max-w-[500px] mb-8 mt-3 bg-white border border-slate-300 sticky bottom-0 rounded-full shadow-lg px-4 py-2 flex items-center">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Donna about your Business meetings"
        className="flex-1 h-10 py-1 focus:outline-none placeholder:text-gray-500 transition"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        onClick={send}
        className={svgClass}
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-4.75a.75.75 
             0 0 0 1.5 0V8.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 
             0 0 0-1.1 0L6.2 9.74a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
