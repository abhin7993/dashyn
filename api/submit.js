// Vercel Serverless Function: POST /api/submit
// Proxies job submission to RunPod, keeping API key server-side

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const API_KEY = process.env.RUNPOD_API_KEY;
  const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || "rbgsokk5io7v6s";

  if (!API_KEY) {
    return res.status(500).json({ error: "RUNPOD_API_KEY not configured" });
  }

  try {
    const response = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Submit error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};
