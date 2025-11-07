import Groq from "groq-sdk";

let cachedClient;

function getGroqClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Groq API key. Set GROQ_API_KEY in your environment.");
  }

  cachedClient = new Groq({ apiKey });
  return cachedClient;
}

export async function callGroqChat({
  model,
  messages,
  temperature = 0.7,
  maxCompletionTokens,
  topP = 1,
  stream = false,
  responseFormat = { type: "json_object" },
}) {
  const client = getGroqClient();

  try {
    const requestPayload = {
      model,
      messages,
      temperature,
      top_p: topP,
    };

    if (typeof maxCompletionTokens === "number") {
      requestPayload.max_completion_tokens = maxCompletionTokens;
    }

    if (stream) {
      requestPayload.stream = true;
    }

    if (responseFormat) {
      requestPayload.response_format = responseFormat;
    }

    const response = await client.chat.completions.create(requestPayload);

    return response.choices?.[0]?.message?.content;
  } catch (error) {
    const errorPayload = error.response?.data || error.message || error;
    console.error("Groq API Error:", errorPayload);
    throw new Error("Groq API request failed.");
  }
}
