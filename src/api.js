// ComfyUI workflow template
const WORKFLOW = {
  "314": { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_edit_2511_bf16.safetensors", weight_dtype: "fp8_e4m3fn" } },
  "315": { class_type: "CLIPLoader", inputs: { clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", type: "qwen_image", device: "default" } },
  "316": { class_type: "VAELoader", inputs: { vae_name: "qwen_image_vae.safetensors" } },
  "328": { class_type: "LoraLoaderModelOnly", inputs: { model: ["314", 0], lora_name: "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-fp32.safetensors", strength_model: 1 } },
  "318": { class_type: "ModelSamplingAuraFlow", inputs: { model: ["328", 0], shift: 3.1 } },
  "317": { class_type: "CFGNorm", inputs: { model: ["318", 0], strength: 1 } },
  "312": { class_type: "LoadImage", inputs: { image: "person.png" } },
  "305": { class_type: "LoadImage", inputs: { image: "costume.png" } },
  "307": { class_type: "LoadImage", inputs: { image: "background.png" } },
  "311": { class_type: "FluxKontextImageScale", inputs: { image: ["312", 0] } },
  "304": { class_type: "FluxKontextImageScale", inputs: { image: ["305", 0] } },
  "306": { class_type: "FluxKontextImageScale", inputs: { image: ["307", 0] } },
  "327": { class_type: "TextEncodeQwenImageEditPlus", inputs: { clip: ["315", 0], vae: ["316", 0], image1: ["311", 0], image2: ["304", 0], image3: ["306", 0], prompt: "" } },
  "319": { class_type: "FluxKontextMultiReferenceLatentMethod", inputs: { conditioning: ["327", 0], reference_latents_method: "index_timestep_zero" } },
  "320": { class_type: "ConditioningZeroOut", inputs: { conditioning: ["319", 0] } },
  "321": { class_type: "EmptyLatentImage", inputs: { width: 824, height: 1376, batch_size: 1 } },
  "324": { class_type: "KSampler", inputs: { model: ["317", 0], positive: ["319", 0], negative: ["320", 0], latent_image: ["321", 0], seed: 0, steps: 4, cfg: 1, sampler_name: "euler", scheduler: "simple", denoise: 1 } },
  "329": { class_type: "VAEDecode", inputs: { samples: ["324", 0], vae: ["316", 0] } },
  save_image: { class_type: "SaveImage", inputs: { images: ["329", 0], filename_prefix: "vibe_output" } },
};

// Fixed prompt for Pass 1 (outfit generation)
const OUTFIT_PROMPT =
  "Dress the person in Image 1 in the complete outfit, accessories, jewelry, bags, and shoes from Image 2. " +
  "Place them on the plain background from Image 3. The person should be in a natural standing pose.";

// ─── Image Processing ────────────────────────────────────────────────────────

function processImage(file, { cropPortrait = true, maxSize = 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      // Crop to 9:16 portrait
      if (cropPortrait) {
        const target = 9 / 16;
        const current = sw / sh;
        if (Math.abs(current - target) > 0.05) {
          if (current > target) {
            sw = Math.round(sh * target);
            sx = Math.round((img.width - sw) / 2);
          } else {
            sh = Math.round(sw / target);
            sy = Math.round((img.height - sh) / 2);
          }
        }
      }

      // Scale down
      const scale = Math.min(1, maxSize / Math.max(sw, sh));
      const cw = Math.round(sw * scale);
      const ch = Math.round(sh * scale);

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    if (file instanceof File || file instanceof Blob) {
      img.src = URL.createObjectURL(file);
    } else {
      img.src = file;
    }
  });
}

// Generate a plain neutral background for Pass 1
function generateNeutralBackground() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1344;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e8e8e8";
  ctx.fillRect(0, 0, 768, 1344);
  return canvas.toDataURL("image/png");
}

// ─── API Communication ───────────────────────────────────────────────────────

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (window.location.hostname !== "localhost") return "/api";
  return "/api";
};

// Submit a workflow to RunPod and poll until complete
async function runWorkflow(prompt, images, onStatus) {
  const wf = JSON.parse(JSON.stringify(WORKFLOW));
  wf["327"].inputs.prompt = prompt;
  wf["324"].inputs.seed = Math.floor(Math.random() * 4294967295);

  const base = getApiBase();
  const submitResp = await fetch(`${base}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { workflow: wf, images } }),
  });

  if (!submitResp.ok) {
    const errText = await submitResp.text();
    throw new Error(`Submit failed (${submitResp.status}): ${errText}`);
  }

  const { id: jobId } = await submitResp.json();

  while (true) {
    await new Promise(r => setTimeout(r, 3000));
    const statusResp = await fetch(`${base}/status/${jobId}`);
    if (!statusResp.ok) throw new Error(`Status check failed: ${statusResp.status}`);
    const data = await statusResp.json();

    if (data.status === "COMPLETED") {
      const imgs = data.output?.images || [];
      if (imgs.length > 0) return `data:image/png;base64,${imgs[0].data}`;
      throw new Error("No images in output");
    }
    if (data.status === "FAILED") throw new Error(data.error || "Generation failed");
    onStatus?.();
  }
}

// ─── Pass 1: Generate person in outfit on neutral background ─────────────────

export async function generateOutfit({ selfieFile, costumeUrl, onStatus }) {
  onStatus?.("Preparing images...");

  const selfieB64 = await processImage(selfieFile, { cropPortrait: true });
  const costumeBlob = await fetch(costumeUrl).then(r => r.blob());
  const costumeB64 = await processImage(costumeBlob, { cropPortrait: false });
  const neutralBg = generateNeutralBackground();

  onStatus?.("Pass 1: Generating outfit...");

  return await runWorkflow(OUTFIT_PROMPT, [
    { name: "person.png", image: selfieB64 },
    { name: "costume.png", image: costumeB64 },
    { name: "background.png", image: neutralBg },
  ], () => onStatus?.("Pass 1: Generating outfit..."));
}

// ─── Pass 2: Place person into background scene ─────────────────────────────

export async function placeInScene({ personImage, backgroundUrl, prompt, onStatus }) {
  onStatus?.("Pass 2: Preparing scene...");

  const bgBlob = await fetch(backgroundUrl).then(r => r.blob());
  const bgB64 = await processImage(bgBlob, { cropPortrait: false });

  onStatus?.("Pass 2: Placing in scene...");

  return await runWorkflow(prompt, [
    { name: "person.png", image: personImage },
    { name: "costume.png", image: personImage },
    { name: "background.png", image: bgB64 },
  ], () => onStatus?.("Pass 2: Placing in scene..."));
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export async function getVibeAssets(vibeId, gender) {
  const base = getApiBase();
  const resp = await fetch(`${base}/assets/${vibeId}/${gender}`);
  if (!resp.ok) throw new Error("Failed to load vibe assets");
  return resp.json();
}
