// src/routes/chat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router-dom";

import ChatLog from "../components/ChatLog";
import ChatInput from "../components/ChatInput";
import DebugMeetingsLoader from "../components/DebugMeetingsLoader";

import { loader as meetingsLoader, action as meetingsAction } from "./meetings";

export default function ChatPage() {
  const actionFetcher = useFetcher();
  const loaderFetcher = useFetcher();
  const [messages, setMessages] = useState([]);
  const streamIndex = useRef(null);

  // wizard state
  const [flow, setFlow] = useState(null);
  const [step, setStep] = useState(null);
  const [draft, setDraft] = useState({
    person: "",
    datetime: "",
    company: "",
    targetId: "",
    notes: "",
  });

  // helper to simulate streaming of hard-coded or action replies
  const streamBotReply = (fullText) => {
    if (window.donnaStream) window.donnaStream.close();
    setMessages((prev) => {
      streamIndex.current = prev.length;
      return [...prev, { text: "", sender: "bot" }];
    });
    fullText.split("").forEach((char, i) => {
      setTimeout(() => {
        setMessages((msgs) =>
          msgs.map((m, idx) =>
            idx === streamIndex.current ? { ...m, text: m.text + char } : m
          )
        );
      }, i * 20);
    });
  };

  // when our actionFetcher returns { reply }, stream it
  useEffect(() => {
    if (actionFetcher.state === "idle" && actionFetcher.data?.reply) {
      streamBotReply(actionFetcher.data.reply);
    }
  }, [actionFetcher.state, actionFetcher.data]);

  const pushUser = (text) =>
    setMessages((ms) => [...ms, { text, sender: "user" }]);

  const handleSend = (text) => {
    pushUser(text);

    /* ─── NOTES WIZARD ─── */
    if (!flow && /\b(?:add|log)\b.*\b(?:notes?|report)\b/i.test(text)) {
      setFlow("notes");
      setStep("askTarget");
      return streamBotReply(
        "Sure—whose meeting should I add notes to? (Send an ID/name or include your note after a colon.)"
      );
    }
    if (flow === "notes" && step === "askTarget") {
      const inline = text.match(/^\s*(.+?)\s*:\s*(.+)$/);
      if (inline) return saveNote(inline[1], inline[2]);
      setDraft((d) => ({ ...d, targetId: text }));
      setStep("askNotes");
      return streamBotReply(`Got it! Please type your notes for ${text}.`);
    }
    if (flow === "notes" && step === "askNotes") {
      return saveNote(draft.targetId, text);
    }

    /* ─── MEETING WIZARD ─── */
    const meetingRe =
      /^(?:hey|hi)?\s*(?:donna[:,]?\s*)?(?:add|log)\s+(?:a\s+)?meeting\b/i;
    if (!flow && meetingRe.test(text)) {
      setFlow("meeting");
      setStep("askWho");
      return streamBotReply("Sure—who is this meeting with?");
    }
    if (flow === "meeting" && step === "askWho") {
      setDraft((d) => ({ ...d, person: text }));
      setStep("askWhen");
      return streamBotReply("Great—when is it? (YYYY-MM-DD HH:MM)");
    }
    if (flow === "meeting" && step === "askWhen") {
      setDraft((d) => ({ ...d, datetime: text }));
      setStep("askCompany");
      return streamBotReply("And which company is this with?");
    }
    if (flow === "meeting" && step === "askCompany") {
      // 1) submit
      const iso = draft.datetime.replace(" ", "T");
      actionFetcher.submit(
        new URLSearchParams({ time: iso, with: draft.person, company: text }),
        { method: "post", action: "/meetings" }
      );
      setFlow(null);
      setStep(null);
      // 2) reload meetings in memory
      loaderFetcher.load("/meetings");
      return;
    }

    /* ─── FALLBACK → LLM via SSE ─── */
    if (window.donnaStream) window.donnaStream.close();
    setMessages((prev) => {
      streamIndex.current = prev.length;
      return [...prev, { text: "", sender: "bot" }];
    });
    const es = new EventSource(
      `/chat/stream?prompt=${encodeURIComponent(text)}`
    );
    window.donnaStream = es;
    es.onmessage = (e) => {
      if (e.data === "[DONE]") {
        es.close();
        window.donnaStream = null;
        streamIndex.current = null;
      } else {
        setMessages((ms) =>
          ms.map((m, i) =>
            i === streamIndex.current ? { ...m, text: m.text + e.data } : m
          )
        );
      }
    };
    es.onerror = () => {
      es.close();
      window.donnaStream = null;
      streamIndex.current = null;
    };
  };

  const saveNote = (target, noteText) => {
    actionFetcher.submit(
      new URLSearchParams({ id: target, notesUpdate: noteText }),
      { method: "post", action: "/meetings" }
    );
    setFlow(null);
    setStep(null);
    loaderFetcher.load("/meetings");
  };

  return (
    <div className="flex flex-1 flex-col items-center bg-gray-50">
      <DebugMeetingsLoader />
      <ChatLog messages={messages} />
      <ChatInput
        onSend={handleSend}
        disabled={actionFetcher.state === "submitting"}
      />
    </div>
  );
}

export async function action({ request }) {
  const form = await request.formData();
  const prompt = (form.get("prompt") || "").toString().trim();

  /* 1) SHOW ALL / MY NOTES */
  if (/(?:show|list).*(?:all|my).*\bnotes\b/i.test(prompt)) {
    const all = await meetingsLoader();
    const withNotes = all.filter((m) => m.notes?.trim());
    if (!withNotes.length)
      return { reply: "You have no notes saved for any meetings." };
    const lines = withNotes
      .map(
        (m) =>
          `• ${m.with}${m.company ? ` (from ${m.company})` : ""}:\n${m.notes}`
      )
      .join("\n\n");
    return {
      reply: `Here are your notes:\n\n${lines}`,
    };
  }

  /* 2) SHOW NOTES FOR ONE MEETING */
  const askOne = prompt.match(/\bnotes\b.*(?:for|about)\s+(.+?)\s*$/i);
  if (askOne) {
    const target = askOne[1].trim();
    const all = await meetingsLoader();
    const m = all.find(
      (x) =>
        x.id === target ||
        x.with.toLowerCase() === target.toLowerCase() ||
        x.company.toLowerCase() === target.toLowerCase()
    );
    if (!m) return { reply: `I couldn't find a meeting with “${target}.”` };
    if (!m.notes)
      return { reply: `There are no notes for the meeting with ${target}.` };
    return { reply: `Here are your notes for ${m.with}:\n\n${m.notes}` };
  }

  /* 3) SAVE NOTE ⇒ "Name: the note" */
  const noteLine = prompt.match(/^\s*(.+?)\s*:\s*(.+)$/);
  if (noteLine) {
    const [, target, noteText] = noteLine;
    const all = await meetingsLoader();
    const m = all.find(
      (x) =>
        x.id === target ||
        x.with.toLowerCase() === target.toLowerCase() ||
        x.company.toLowerCase() === target.toLowerCase()
    );
    if (!m) return { reply: `I couldn't find a meeting with “${target}.”` };
    await meetingsAction({
      request: new Request("/meetings", {
        method: "POST",
        body: new URLSearchParams({ id: m.id, notesUpdate: noteText }),
      }),
    });
    return { reply: `📝 Added your note for the meeting with ${m.with}.` };
  }

  /* 4) SAVE MEETING ⇒ single-line payload */
  const meet = prompt.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})\s+with\s+(.+?)(?:\s+from\s+(.+))?$/i
  );
  if (meet) {
    const [, d, t, person, company] = meet;
    await meetingsAction({
      request: new Request("/meetings", {
        method: "POST",
        body: new URLSearchParams({
          time: `${d}T${t}`,
          with: person,
          company: company || "",
        }),
      }),
    });
    return {
      reply: `📅 Saved meeting on ${d} at ${t} with ${person}${
        company ? ` from ${company}.` : "."
      }`,
    };
  }

  /* 5) FALLBACK → GPT (no streaming via action) */
  const all = await meetingsLoader();
  const systemLines = all
    .map((m) => {
      const dt = new Date(m.time);
      const when =
        dt.toLocaleDateString() +
        " " +
        dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const notes = m.notes ? ` — Notes: ${m.notes}` : "";
      return `• ${when}: ${m.with}${
        m.company ? ` (from ${m.company})` : ""
      }${notes}`;
    })
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `Your name is Donna.\nHere are upcoming meetings:\n${systemLines}\n`,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    console.error(await res.text());
    return { reply: "⚠️ Something went wrong with OpenAI." };
  }
  const { choices } = await res.json();
  return { reply: choices?.[0]?.message?.content ?? "🤖 (no response)" };
}
