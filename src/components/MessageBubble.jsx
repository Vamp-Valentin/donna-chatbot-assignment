// src/components/MessageBubble.jsx
export default function MessageBubble({ text, sender }) {
  const wrapper =
    sender === "user" ? "flex justify-end w-full" : "flex justify-start w-full";

  const bubble =
    sender === "user"
      ? "px-3 py-2 rounded-2xl bg-blue-100 text-blue-800 max-w-full break-words whitespace-pre-wrap"
      : "px-3 py-2 rounded-2xl bg-gray-200 text-gray-800 max-w-full break-words whitespace-pre-wrap";

  return (
    <div className={wrapper}>
      <span className={bubble}>{text}</span>
    </div>
  );
}
