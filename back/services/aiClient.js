const REQUEST_TIMEOUT_MS = 25000;

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
}

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || "";
}

function hasRemoteAi() {
  return Boolean(getOpenAiKey() || getGeminiKey());
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

async function completeOpenAi(systemPrompt, userPrompt) {
  const apiKey = getOpenAiKey();
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error("openai request failed");
    error.code = "AI_UNAVAILABLE";
    error.detail = detail.slice(0, 500);
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return {
    provider: "openai",
    model,
    json: extractJson(content),
  };
}

async function completeGemini(systemPrompt, userPrompt) {
  const apiKey = getGeminiKey();
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error("gemini request failed");
    error.code = "AI_UNAVAILABLE";
    error.detail = detail.slice(0, 500);
    throw error;
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return {
    provider: "gemini",
    model,
    json: extractJson(content),
  };
}

async function completeJson(systemPrompt, userPrompt) {
  if (getOpenAiKey()) {
    return completeOpenAi(systemPrompt, userPrompt);
  }
  if (getGeminiKey()) {
    return completeGemini(systemPrompt, userPrompt);
  }
  return null;
}

module.exports = {
  hasRemoteAi,
  completeJson,
  extractJson,
};
