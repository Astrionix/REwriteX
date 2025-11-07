import { useState } from "react";
import { motion } from "framer-motion";
import TextAreaPanel from "./components/TextAreaPanel.jsx";
import ResultPanel from "./components/ResultPanel.jsx";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";

const TASKS = [
  { key: "paraphrase", label: "Paraphrase" },
  { key: "humanize", label: "Humanize" },
  { key: "ai-detect", label: "AI Detection" },
  { key: "plagiarism", label: "Plagiarism" },
];

const SAMPLE_TEXT =
  "ContentRefiner is a comprehensive toolkit that improves clarity, checks authenticity, and delivers actionable insights in seconds.";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState("paraphrase");
  const [synonyms, setSynonyms] = useState(0.6);

  function resetResult() {
    setResult(null);
  }

  function handleTaskSelect(taskKey) {
    setActiveTask(taskKey);
    resetResult();
    setError(null);
  }

  function handleSampleClick() {
    setText(SAMPLE_TEXT);
    setError(null);
  }

  async function handlePasteClick() {
    if (!navigator?.clipboard) {
      setError("Clipboard access is not supported in this browser.");
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        setError("Clipboard is empty.");
        return;
      }
      setText(clipboardText);
      setError(null);
    } catch (clipboardError) {
      setError("Unable to paste from clipboard. Grant permission and try again.");
      console.error("Clipboard read failed", clipboardError);
    }
  }

  async function analyze(taskOverride) {
    const task = taskOverride ?? activeTask;

    if (!text.trim()) {
      setError("Please enter text to analyze.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          task,
          synonyms:
            task === "paraphrase" || task === "humanize"
              ? Number.isFinite(synonyms)
                ? Math.max(0, Math.min(1, synonyms))
                : undefined
              : undefined,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || "Request failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Unexpected error");
      resetResult();
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    analyze();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="py-8 text-center">
        <motion.h1
          className="font-brand text-4xl font-semibold tracking-[0.35em] text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.45)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Re<span className="text-white">Write</span>X
        </motion.h1>
        <motion.p
          className="mt-3 text-sm text-slate-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          Trendy AI-powered rewriting studio for clarity, tone, and authenticity.
        </motion.p>
      </header>

      <main className="flex-1 px-4 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {error ? (
            <div className="border border-red-500 text-red-400 p-4 rounded bg-red-950/20">
              {error}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <TextAreaPanel
              tasks={TASKS}
              activeTask={activeTask}
              synonyms={synonyms}
              text={text}
              loading={loading}
              onChange={setText}
              onTaskChange={handleTaskSelect}
              onSynonymsChange={setSynonyms}
              onSampleClick={handleSampleClick}
              onPasteClick={handlePasteClick}
              onSubmit={handleSubmit}
            />

            <ResultPanel result={result} loading={loading} activeTask={activeTask} />
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        Powered by ReWriteX • Built for clarity & precision
      </footer>
    </div>
  );
}
