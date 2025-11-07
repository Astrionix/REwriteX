function formatPercentage(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const adjusted = value <= 1 ? value * 100 : value;
  return `${Math.round(adjusted)}%`;
}

function buildSummary(result, activeTask) {
  if (!result) return "Results will appear here...";

  switch (activeTask) {
    case "paraphrase":
    case "humanize":
      return typeof result === "string"
        ? result
        : result?.paraphrased_text || "Results will appear here...";

    case "ai-detect": {
      const classification = result.classification?.replace(/_/g, " ") || "—";
      const likelihood = formatPercentage(result.ai_likelihood);
      const confidence = formatPercentage(result.confidence_score);
      const reason = result.reason || "No explanation provided.";

      return `Classification: ${classification}\nAI Likelihood: ${likelihood}\nConfidence: ${confidence}\nReason: ${reason}`;
    }

    case "plagiarism": {
      const similarity = formatPercentage(result.similarity_score);
      const verdict = result.verdict || "—";
      const confidence = formatPercentage(result.confidence_score);
      const comment = result.comment || "No additional commentary provided.";

      return `Similarity: ${similarity}\nVerdict: ${verdict}\nConfidence: ${confidence}\nComment: ${comment}`;
    }

    case "full": {
      const refine = result.refine_agent || {};
      const verify = result.verify_agent || {};
      const insight = result.insight_agent || {};

      const refineText = refine.paraphrased_text || "No paraphrase available.";
      const readability =
        typeof refine.readability_score === "number"
          ? `Readability Score: ${refine.readability_score.toFixed(2)}`
          : "Readability Score: —";
      const aiLikelihood = formatPercentage(verify.ai_likelihood);
      const similarity = formatPercentage(verify.similarity_score);
      const verdict = verify.verdict || "—";
      const summary = insight.summary || "No summary provided.";
      const feedback = insight.feedback || "No feedback provided.";

      return [
        "REFINE AGENT:",
        refineText,
        readability,
        "",
        "VERIFY AGENT:",
        `AI Likelihood: ${aiLikelihood}`,
        `Similarity: ${similarity}`,
        `Verdict: ${verdict}`,
        "",
        "INSIGHT AGENT:",
        `Summary: ${summary}`,
        `Feedback: ${feedback}`,
      ].join("\n");
    }

    default:
      return typeof result === "string"
        ? result
        : JSON.stringify(result, null, 2) || "Results will appear here...";
  }
}

const headings = {
  paraphrase: "Refined Output",
  humanize: "Refined Output",
  "ai-detect": "AI Detection",
  plagiarism: "Plagiarism Scan",
  full: "Full Report",
};

export default function ResultPanel({ result, loading, activeTask }) {
  const heading = headings[activeTask] ?? "Analysis Output";
  const displayText = loading ? "Awaiting response..." : buildSummary(result, activeTask);

  return (
    <section className="flex h-full flex-col space-y-4">
      <h2 className="text-sm uppercase tracking-wide text-slate-400">{heading}</h2>
      <div className="flex-1 overflow-hidden rounded border border-slate-800 bg-slate-950/60">
        <pre className="h-full overflow-auto whitespace-pre-wrap break-words p-4 text-base leading-6 text-slate-100">
          {displayText}
        </pre>
      </div>
    </section>
  );
}
