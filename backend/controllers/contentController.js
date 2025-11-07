import { callGroqChat } from "../utils/groqClient.js";

// 🔧 Utility: clean JSON and remove markdown fences / think tags
function sanitizeJSONResponse(rawResponse) {
  if (typeof rawResponse !== "string") throw new Error("Model response was not text.");

  const trimmed = rawResponse.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```[a-zA-Z]*\n?|```$/g, "")
    : trimmed;
  const withoutThink = withoutFence.replace(/<\/?think>/gi, "");

  try {
    return JSON.parse(withoutThink);
  } catch (_primaryError) {
    const start = withoutThink.indexOf("{");
    const end = withoutThink.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = withoutThink.slice(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch (_secondaryError) {
        console.error("Parsing failed:", withoutThink);
        throw new Error("Failed to parse model JSON response.");
      }
    }

    console.error("Parsing failed:", withoutThink);
    throw new Error("Failed to parse model JSON response.");
  }
}

// 🔥 Main function
export async function analyzeText(req, res) {
  const { text, task } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }
  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }

  try {
    // --- TASK ROUTER ---
    switch (task) {
      // ===========================
      // 🪶 PARAPHRASE
      // ===========================
      case "paraphrase": {
        const response = await callGroqChat({
          model: process.env.GROQ_PARAPHRASE_MODEL || "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `You are a professional paraphraser. Rephrase the following text while keeping meaning intact.\nText:"""${text}"""\nRespond ONLY with minified JSON in this exact schema:{"paraphrased_text":string,"readability_score":number,"tone_used":string,"confidence_score":number}.`,
            },
          ],
        });

        return res.json(sanitizeJSONResponse(response));
      }

      // ===========================
      // 🤝 HUMANIZE
      // ===========================
      case "humanize": {
        const response = await callGroqChat({
          model: process.env.GROQ_HUMANIZE_MODEL || process.env.GROQ_PARAPHRASE_MODEL || "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `You are a human writing coach. Rewrite the following text to sound more natural, empathetic, and engaging for a broad audience while preserving meaning.\nText:"""${text}"""\nRespond ONLY with minified JSON in this exact schema:{"paraphrased_text":string,"readability_score":number,"tone_used":string,"confidence_score":number}.`,
            },
          ],
        });

        return res.json(sanitizeJSONResponse(response));
      }

      // ===========================
      // 🧠 AI DETECTION
      // ===========================
      case "ai-detect": {
        const response = await callGroqChat({
          model: process.env.GROQ_AI_DETECT_MODEL || "qwen/qwen3-32b",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `You are an AI text detector. Classify whether the following text is AI-generated or human-written.\nText:"""${text}"""\nRespond ONLY with minified JSON in this schema:{"ai_likelihood":number,"classification":string,"reason":string,"confidence_score":number}.`,
            },
          ],
        });

        return res.json(sanitizeJSONResponse(response));
      }

      // ===========================
      // 🧩 PLAGIARISM CHECK
      // ===========================
      case "plagiarism": {
        const response = await callGroqChat({
          model: process.env.GROQ_PLAGIARISM_MODEL || "groq/compound",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `You are a plagiarism checker. Estimate how much of this text is copied from public sources.\nText:"""${text}"""\nRespond ONLY with minified JSON in this schema:{"similarity_score":number,"verdict":string,"comment":string,"confidence_score":number}.`,
            },
          ],
        });

        return res.json(sanitizeJSONResponse(response));
      }

      // ===========================
      // 🧩 FULL ANALYSIS PIPELINE
      // ===========================
      case "full": {
        // 🔹 1. Refine Agent — Paraphrasing
        const refineAgentRaw = await callGroqChat({
          model: process.env.GROQ_PARAPHRASE_MODEL || "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `Act as RefineAgent. Paraphrase the given text professionally and report readability.\nText:"""${text}"""\nRespond ONLY with minified JSON:{"paraphrased_text":string,"readability_score":number}.`,
            },
          ],
        });
        const refineAgent = sanitizeJSONResponse(refineAgentRaw);

        const verifyAIRaw = await callGroqChat({
          model: process.env.GROQ_AI_DETECT_MODEL || "qwen/qwen3-32b",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `Act as VerifyAgent. Determine AI-generation likelihood for the provided text.\nText:"""${text}"""\nRespond ONLY with minified JSON:{"ai_likelihood":number,"classification":string,"reason":string,"confidence_score":number}.`,
            },
          ],
        });
        const verifyAI = sanitizeJSONResponse(verifyAIRaw);

        const verifyCopyRaw = await callGroqChat({
          model: process.env.GROQ_PLAGIARISM_MODEL || "groq/compound",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `Act as CopyScanAgent. Estimate similarity against public content for the provided text.\nText:"""${text}"""\nRespond ONLY with minified JSON:{"similarity_score":number,"verdict":string,"comment":string,"confidence_score":number}.`,
            },
          ],
        });
        const verifyCopy = sanitizeJSONResponse(verifyCopyRaw);

        const insightRaw = await callGroqChat({
          model: process.env.GROQ_INSIGHT_MODEL || "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are ContentRefiner, an assistant that must answer with strict minified JSON only.",
            },
            {
              role: "user",
              content: `Act as InsightAgent. Summarize the writing and provide actionable feedback.\nText:"""${text}"""\nRespond ONLY with minified JSON:{"summary":string,"feedback":string}.`,
            },
          ],
        });
        const insight = sanitizeJSONResponse(insightRaw);

        return res.json({
          original_text: text,
          refine_agent: {
            paraphrased_text: refineAgent.paraphrased_text,
            readability_score: refineAgent.readability_score,
          },
          verify_agent: {
            ai_likelihood: verifyAI.ai_likelihood,
            similarity_score: verifyCopy.similarity_score,
            verdict: verifyCopy.verdict,
          },
          insight_agent: {
            summary: insight.summary,
            feedback: insight.feedback,
          },
        });
      }

      // ===========================
      // ❌ Unsupported Task
      // ===========================
      default:
        return res.status(400).json({ error: "Unsupported task" });
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
