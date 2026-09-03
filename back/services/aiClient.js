const { aiConfig, hasRemoteAi } = require("../config");

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

async function completeOpenAi(systemPrompt, userPrompt, apiKey) {
  const { baseUrl, model } = aiConfig.openai;

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
    signal: AbortSignal.timeout(aiConfig.timeoutMs),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error("openai request failed");
    error.code = "AI_UNAVAILABLE";
    error.detail = detail.slice(0, 500);
    throw error;
  }

  const data = await response.json();
  return {
    provider: "openai",
    model,
    json: extractJson(data?.choices?.[0]?.message?.content),
  };
}

async function completeGemini(systemPrompt, userPrompt, apiKey) {
  const { model } = aiConfig.gemini;
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
    signal: AbortSignal.timeout(aiConfig.timeoutMs),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error("gemini request failed");
    error.code = "AI_UNAVAILABLE";
    error.detail = detail.slice(0, 500);
    throw error;
  }

  const data = await response.json();
  return {
    provider: "gemini",
    model,
    json: extractJson(data?.candidates?.[0]?.content?.parts?.[0]?.text),
  };
}

async function completeJson(systemPrompt, userPrompt, options = {}) {
  const overrideKey = options.apiKey || "";
  if (aiConfig.openai.apiKey) {
    return completeOpenAi(systemPrompt, userPrompt, aiConfig.openai.apiKey);
  }
  if (aiConfig.gemini.apiKey) {
    return completeGemini(systemPrompt, userPrompt, aiConfig.gemini.apiKey);
  }
  if (overrideKey) {
    return completeOpenAi(systemPrompt, userPrompt, overrideKey);
  }
  return null;
}

module.exports = {
  hasRemoteAi,
  completeJson,
  extractJson,
};
