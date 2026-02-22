import { useState, useRef, useEffect } from "react";
import { VIBES, DEFAULT_PROMPT } from "./vibes";
import { generateOutfit, placeInScene, getVibeAssets } from "./api";

// ─── Sub-Components ──────────────────────────────────────────────────────────

function Header({ onReset }) {
  return (
    <header style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1 onClick={onReset} style={{
        fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900,
        margin: 0, cursor: "pointer", letterSpacing: 1,
        background: "linear-gradient(135deg, #C9A96E, #F0D78C)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>DASHYN</h1>
    </header>
  );
}

function UploadStep({ onFileSelect }) {
  const fileRef = useRef(null);
  return (
    <div className="fade-up" style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ width: 120, height: 120, margin: "0 auto 28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.04))", border: "2px dashed rgba(201,169,110,0.25)" }}>
        <span style={{ fontSize: 48 }}>📸</span>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, marginBottom: 10 }}>Upload Your Photo</h2>
      <p style={{ color: "#777", fontSize: 15, marginBottom: 40, lineHeight: 1.7, maxWidth: 280, margin: "0 auto 40px" }}>Full body or half body works best. We'll transform your look with AI.</p>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} style={{ display: "none" }} />
      <button onClick={() => fileRef.current?.click()} className="btn-primary" style={{ padding: "16px 52px", fontSize: 17, background: "linear-gradient(135deg, #C9A96E, #8B6914)", color: "#fff", boxShadow: "0 8px 32px rgba(201,169,110,0.25)" }}>Choose Photo</button>
    </div>
  );
}

function VibeGrid({ selfiePreview, onSelect, onBack }) {
  return (
    <div className="fade-in">
      {selfiePreview && (
        <div style={{ textAlign: "center", marginBottom: 20 }} className="scale-in">
          <div style={{ position: "relative", display: "inline-block" }}>
            <img src={selfiePreview} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid #C9A96E" }} />
            <button onClick={onBack} style={{ position: "absolute", top: -4, right: -8, width: 22, height: 22, borderRadius: "50%", background: "#333", border: "none", color: "#aaa", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
      )}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, textAlign: "center", marginBottom: 20 }}>Choose Your Vibe</h2>
      <div className="stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {VIBES.map((vibe) => (
          <div key={vibe.id} className="vibe-card" onClick={() => onSelect(vibe)} style={{ padding: "18px 12px", borderRadius: 16, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.05)", background: `linear-gradient(145deg, ${vibe.gradient[0]}18, ${vibe.gradient[1]}08)` }}>
            <div style={{ fontSize: 26, marginBottom: 5 }}>{vibe.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{vibe.name}</div>
            <div style={{ fontSize: 10, color: "#666", fontStyle: "italic" }}>{vibe.tagline}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenderStep({ vibe, onSelect, onBack }) {
  return (
    <div className="fade-up" style={{ textAlign: "center", paddingTop: 60 }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{vibe.emoji}</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 4 }}>{vibe.name}</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 40, fontStyle: "italic" }}>{vibe.tagline}</p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", padding: "0 20px" }}>
        {[{ id: "male", label: "Men's Look", icon: "👔" }, { id: "female", label: "Women's Look", icon: "👗" }].map((g) => (
          <button key={g.id} onClick={() => onSelect(g.id)} className="vibe-card" style={{ flex: 1, maxWidth: 160, padding: "28px 16px", borderRadius: 20, border: "1.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "#fff", cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{g.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{g.label}</div>
          </button>
        ))}
      </div>
      <button onClick={onBack} style={{ display: "block", margin: "32px auto 0", background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>← Change vibe</button>
    </div>
  );
}


// ─── Prompt Editor ──────────────────────────────────────────────────────────

function PromptEditStep({ vibe, prompt, onGenerate, onBack }) {
  const [text, setText] = useState(prompt);
  return (
    <div className="fade-up" style={{ paddingTop: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 32 }}>{vibe.emoji}</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, margin: "8px 0 4px" }}>Review Prompt</h2>
        <p style={{ color: "#666", fontSize: 12 }}>Edit if needed, then generate</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%", minHeight: 180, padding: "14px", borderRadius: 14,
          background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)",
          color: "#ddd", fontSize: 13, lineHeight: 1.6, resize: "vertical",
          fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(201,169,110,0.4)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "#555" }}>{text.length} chars</span>
        <button
          onClick={() => setText(prompt)}
          style={{ background: "none", border: "none", color: "#C9A96E", fontSize: 12, cursor: "pointer" }}
        >Reset to default</button>
      </div>
      <button
        onClick={() => onGenerate(text)}
        className="btn-primary"
        style={{
          display: "block", width: "100%", padding: "16px", fontSize: 16, marginTop: 20,
          background: "linear-gradient(135deg, #C9A96E, #8B6914)", color: "#fff",
          borderRadius: 14, border: "none", cursor: "pointer",
          boxShadow: "0 8px 32px rgba(201,169,110,0.25)",
        }}
      >Generate</button>
      <button onClick={onBack} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>← Change gender</button>
    </div>
  );
}

// ─── Reference Images Banner ─────────────────────────────────────────────────

function ReferenceBanner({ selfiePreview, costumeUrl, backgroundUrl }) {
  if (!costumeUrl && !backgroundUrl) return null;
  const imgs = [
    { label: "Your Photo", src: selfiePreview },
    { label: "Costume", src: costumeUrl },
    { label: "Background", src: backgroundUrl },
  ];
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
      {imgs.map((img, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ width: 72, height: 96, borderRadius: 10, overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.1)", background: "#111" }}>
            {img.src && <img src={img.src} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ fontSize: 9, color: "#666", marginTop: 4 }}>{img.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Processing (single) ─────────────────────────────────────────────────────

function ProcessingStep({ vibe, status, elapsed, selfiePreview, costumeUrl, backgroundUrl }) {
  const passLabel = status?.startsWith("Pass 2") ? "Step 2/2: Placing in scene" : "Step 1/2: Generating outfit";
  const tips = ["AI is analyzing your photo...", "Matching outfit to your body...", "Blending the background...", "Adding final touches...", "Almost there..."];
  const tipIndex = Math.min(Math.floor(elapsed / 15), tips.length - 1);
  return (
    <div className="fade-up" style={{ textAlign: "center", paddingTop: 20 }}>
      <ReferenceBanner selfiePreview={selfiePreview} costumeUrl={costumeUrl} backgroundUrl={backgroundUrl} />
      <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 24px" }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", border: "3px solid rgba(201,169,110,0.1)", borderTopColor: "#C9A96E", animation: "spin 0.9s linear infinite" }} />
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{vibe.emoji}</span>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6 }}>Creating Your Look</h2>
      <p style={{ color: "#C9A96E", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{passLabel}</p>
      <p style={{ color: "#777", fontSize: 13, marginBottom: 12 }}>{tips[tipIndex]}</p>
      <div style={{ fontFamily: "'DM Sans', monospace", fontSize: 36, fontWeight: 700, background: "linear-gradient(135deg, #C9A96E, #F0D78C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>{elapsed}s</div>
      <div className="shimmer-bg" style={{ height: 4, borderRadius: 2, maxWidth: 200, margin: "0 auto" }} />
    </div>
  );
}

// ─── Result (single) ─────────────────────────────────────────────────────────

function ResultStep({ vibe, resultImage, elapsed, selfiePreview, costumeUrl, backgroundUrl, onTryAnother, onEditPrompt, onReset }) {
  const download = () => { const a = document.createElement("a"); a.href = resultImage; a.download = `dashyn_${vibe.id}_${Date.now()}.png`; a.click(); };
  const share = async () => {
    if (navigator.share) { try { const blob = await (await fetch(resultImage)).blob(); const file = new File([blob], `dashyn_${vibe.id}.png`, { type: "image/png" }); await navigator.share({ files: [file], title: `My ${vibe.name} Look` }); } catch (e) {} } else { download(); }
  };
  return (
    <div className="scale-in" style={{ textAlign: "center", paddingTop: 12 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 4 }}>{vibe.emoji} {vibe.name}</h2>
      <p style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 12 }}>Generated in {elapsed}s</p>
      <ReferenceBanner selfiePreview={selfiePreview} costumeUrl={costumeUrl} backgroundUrl={backgroundUrl} />
      <div style={{ borderRadius: 20, overflow: "hidden", maxWidth: 380, margin: "0 auto 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <img src={resultImage} alt="Generated look" style={{ width: "100%", display: "block" }} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={download} className="btn-primary" style={{ padding: "10px 20px", fontSize: 13, background: "linear-gradient(135deg, #C9A96E, #8B6914)", color: "#fff" }}>💾 Save</button>
        <button onClick={share} className="btn-primary" style={{ padding: "10px 20px", fontSize: 13, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>📤 Share</button>
        <button onClick={onEditPrompt} className="btn-primary" style={{ padding: "10px 20px", fontSize: 13, background: "rgba(255,255,255,0.05)", color: "#ccc", border: "1px solid rgba(255,255,255,0.08)" }}>✏️ Edit Prompt</button>
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 14 }}>
        <button onClick={onTryAnother} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer" }}>Change Vibe</button>
        <button onClick={onReset} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer" }}>New Photo</button>
      </div>
    </div>
  );
}


// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(1);
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [gender, setGender] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [costumeUrl, setCostumeUrl] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [lastPrompt, setLastPrompt] = useState(DEFAULT_PROMPT);
  const [pass1Result, setPass1Result] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => { clearInterval(timerRef.current); }, []);

  const reset = () => {
    clearInterval(timerRef.current);
    setStep(1); setSelfie(null); setSelfiePreview(null);
    setSelectedVibe(null); setGender(null);
    setResultImage(null); setError(null); setElapsed(0);
    setCostumeUrl(null); setBackgroundUrl(null); setPass1Result(null);
  };

  const handleFileSelect = (file) => {
    setSelfie(file);
    const reader = new FileReader();
    reader.onload = () => setSelfiePreview(reader.result);
    reader.readAsDataURL(file);
    setStep(2);
  };

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    setStep(4);
  };

  // Full generation: Pass 1 (outfit) + Pass 2 (scene placement)
  const handleGenerate = async (prompt) => {
    setLastPrompt(prompt);
    setStep(5);
    setError(null); setElapsed(0);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    try {
      setStatus("Loading assets...");
      const assets = await getVibeAssets(selectedVibe.id, gender);
      setCostumeUrl(assets.costumeUrl);
      setBackgroundUrl(assets.backgroundUrl);

      // Pass 1: Generate person in outfit on neutral background
      const outfitImage = await generateOutfit({ selfieFile: selfie, costumeUrl: assets.costumeUrl, onStatus: setStatus });
      setPass1Result(outfitImage);

      // Pass 2: Place into scene
      const result = await placeInScene({ personImage: outfitImage, backgroundUrl: assets.backgroundUrl, prompt, onStatus: setStatus });
      setFinalElapsed(Math.floor((Date.now() - start) / 1000));
      setResultImage(result);
      setStep(6);
    } catch (err) {
      console.error(err); setError(err.message); setStep(4);
    } finally { clearInterval(timerRef.current); }
  };

  // Retry with edited prompt — only runs Pass 2 using cached Pass 1 result
  const handleRetryWithPrompt = async (prompt) => {
    setLastPrompt(prompt);
    setStep(5);
    setError(null); setElapsed(0);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    try {
      const result = await placeInScene({ personImage: pass1Result, backgroundUrl, prompt, onStatus: setStatus });
      setFinalElapsed(Math.floor((Date.now() - start) / 1000));
      setResultImage(result);
      setStep(6);
    } catch (err) {
      console.error(err); setError(err.message); setStep(7);
    } finally { clearInterval(timerRef.current); }
  };

  return (
    <div className="app-container" style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0a0f 0%, #12121f 40%, #0f1724 100%)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: -300, right: -200, width: 600, height: 600, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)" }} />
      <Header onReset={reset} />
      {error && (
        <div style={{ margin: "0 20px 12px", padding: "12px 16px", background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.2)", borderRadius: 12, fontSize: 13, color: "#ff6b6b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: 18, cursor: "pointer" }}>×</button>
        </div>
      )}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
        {step === 1 && <UploadStep onFileSelect={handleFileSelect} />}
        {step === 2 && <VibeGrid selfiePreview={selfiePreview} onSelect={(v) => { setSelectedVibe(v); setStep(3); }} onBack={reset} />}
        {step === 3 && <GenderStep vibe={selectedVibe} onSelect={handleGenderSelect} onBack={() => setStep(2)} />}
        {step === 4 && <PromptEditStep vibe={selectedVibe} prompt={DEFAULT_PROMPT} onGenerate={handleGenerate} onBack={() => setStep(3)} />}
        {step === 5 && <ProcessingStep vibe={selectedVibe} status={status} elapsed={elapsed} selfiePreview={selfiePreview} costumeUrl={costumeUrl} backgroundUrl={backgroundUrl} />}
        {step === 6 && <ResultStep vibe={selectedVibe} resultImage={resultImage} elapsed={finalElapsed} selfiePreview={selfiePreview} costumeUrl={costumeUrl} backgroundUrl={backgroundUrl} onEditPrompt={() => setStep(7)} onTryAnother={() => { setResultImage(null); setStep(2); }} onReset={reset} />}
        {step === 7 && <PromptEditStep vibe={selectedVibe} prompt={lastPrompt} onGenerate={handleRetryWithPrompt} onBack={() => setStep(6)} />}
      </div>
    </div>
  );
}
