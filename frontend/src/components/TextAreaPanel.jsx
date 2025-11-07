export default function TextAreaPanel({
  tasks,
  activeTask,
  synonyms,
  text,
  loading,
  onChange,
  onTaskChange,
  onSynonymsChange,
  onSampleClick,
  onPasteClick,
  onSubmit,
}) {
  const isParaphrase = activeTask === "paraphrase";
  const isHumanize = activeTask === "humanize";
  const supportsEnhancements = isParaphrase || isHumanize;

  let actionLabel = "Run Analysis";
  if (isParaphrase) actionLabel = "Paraphrase";
  else if (isHumanize) actionLabel = "Humanize";

  function renderTaskTab(task) {
    const isActive = task.key === activeTask;
    return (
      <button
        key={task.key}
        type="button"
        onClick={() => onTaskChange(task.key)}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
          isActive
            ? "bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/30"
            : "border border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500"
        }`}
        disabled={loading}
      >
        {task.label}
      </button>
    );
  }

  return (
    <section className="flex h-full flex-col space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modes:</span>
        <div className="flex flex-wrap gap-2">{tasks.map(renderTaskTab)}</div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-emerald-500/5">
        <div className="flex h-full flex-col space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Input Text</h2>
          {supportsEnhancements ? (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Synonyms:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={synonyms}
                onChange={(event) => onSynonymsChange(Number(event.target.value))}
                className="accent-emerald-500"
                disabled={loading}
              />
            </div>
          ) : null}
        </header>

        <textarea
          id="input-text"
          className="h-48 flex-1 resize-none rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder={
            isParaphrase
              ? "To rewrite text, enter or paste it here and press \"Paraphrase\"."
              : isHumanize
              ? "Paste text to humanize tone and press \"Humanize\"."
              : "Enter or paste your text here..."
          }
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />

        <div className="flex flex-wrap items-center gap-3">
          {supportsEnhancements ? (
            <>
              <button
                type="button"
                onClick={onSampleClick}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition"
                disabled={loading}
              >
                🔥 Try Sample Text
              </button>
              <button
                type="button"
                onClick={onPasteClick}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-500 transition"
                disabled={loading}
              >
                📋 Paste Text
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={onSubmit}
            className="ml-auto rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Processing..." : actionLabel}
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}
