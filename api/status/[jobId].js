// Vercel Serverless Function: GET /api/status/[jobId]
// Proxies status polling to RunPod

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { jobId } = req.query;
  const API_KEY = process.env.RUNPOD_API_KEY;
  const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || "rbgsokk5io7v6s";

  if (!API_KEY) {
    return res.status(500).json({ error: "RUNPOD_API_KEY not configured" });
  }

  try {
    const response = await fetch(`https://api.runpod.ai/v2/${ENDPOINT_ID}/status/${jobId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("Status error:", err);
    return res.status(500).json({ error: err.message });
  }
}
