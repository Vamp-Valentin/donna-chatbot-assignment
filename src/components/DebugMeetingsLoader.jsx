// src/components/DebugMeetingsLoader.jsx
import { useFetcher } from "react-router-dom";
import { useEffect } from "react";

export default function DebugMeetingsLoader({ reloadSignal }) {
  const fetcher = useFetcher();

  useEffect(() => {
    fetcher.load("/meetings");
  }, [reloadSignal]);

  useEffect(() => {
    if (fetcher.data) console.log("🚀 meetings:", fetcher.data);
  }, [fetcher.data]);

  return null;
}
