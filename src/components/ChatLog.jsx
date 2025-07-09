import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatLog({ messages }) {
  const containerRef = useRef(null);

  // always scroll to the bottom
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 w-full max-w-[500px] flex items-center justify-center p-4  rounded-lg">
        <div className="space-y-2 text-center">
          <img
            src="/android-chrome-512x512.png"
            alt="App logo"
            className="w-32 h-32 rounded-full shadow-xl mx-auto"
          />
          <h2 className="text-2xl font-semibold">Hello, I&#39;m Donna</h2>
          <p className="text-gray-500">How can I help you today? Ask away!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="
        flex flex-col
        flex-1
        w-full max-w-[500px]
        bg-white rounded-lg
        p-4
        overflow-auto
        space-y-2
      "
    >
      {/* render newest last so it sits at the bottom */}
      {messages.map((msg, i) => (
        <MessageBubble key={i} text={msg.text} sender={msg.sender} />
      ))}
    </div>
  );
}
