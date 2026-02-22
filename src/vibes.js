// ─── Default Prompt (V: Extract + Place — winner from Round 4 testing) ───

export const DEFAULT_PROMPT =
  "Extract the person from Image 1, removing their original background completely. " +
  "Dress them in the full outfit and all accessories from Image 2. Place them " +
  "naturally into the scene from Image 3 with matching lighting and shadows. " +
  "Maintain the original scale and proportions of all elements in Image 3's scene — " +
  "objects like cars, buildings, and furniture must remain their real-world size relative to the person. " +
  "The final image should look like a real photo taken at Image 3's location with no " +
  "remnants of Image 1's environment. The person should be in the most suitable pose for the setting and outfit.";

export const VIBES = [
  { id: "old_money", name: "Old Money", emoji: "💎", gradient: ["#C9A96E", "#8B6914"], tagline: "Quiet luxury, loud impact" },
  { id: "office_siren", name: "Office Siren", emoji: "🔥", gradient: ["#1a1a2e", "#4a2545"], tagline: "Corporate power meets style" },
  { id: "airport_look", name: "Airport Look", emoji: "✈️", gradient: ["#5B86A6", "#87CEEB"], tagline: "Travel in style, always" },
  { id: "cyberpunk_gamer", name: "Cyberpunk", emoji: "🎮", gradient: ["#ff006e", "#8338ec"], tagline: "Future is now" },
  { id: "south_delhi_sobo", name: "South Delhi", emoji: "🛍️", gradient: ["#E8B4B8", "#C77B8B"], tagline: "Hauz Khas to Bandra energy" },
  { id: "bali_bohemian", name: "Bali Bohemian", emoji: "🌺", gradient: ["#8B6914", "#4A7C59"], tagline: "Free spirit, island soul" },
  { id: "mountain_mornings", name: "Mountain Mornings", emoji: "🏔️", gradient: ["#4A7C59", "#2D5016"], tagline: "Cozy and adventurous" },
  { id: "phi_phi_look", name: "Phi Phi Island", emoji: "🏝️", gradient: ["#00CED1", "#008B8B"], tagline: "Paradise found" },
  { id: "dubai_rich", name: "Dubai Rich", emoji: "🤑", gradient: ["#DAA520", "#B8860B"], tagline: "Ultra luxury lifestyle" },
  { id: "santorini", name: "Santorini", emoji: "🇬🇷", gradient: ["#0066CC", "#4169E1"], tagline: "Mediterranean dreams" },
  { id: "himalayan_odyssey", name: "Himalayan Odyssey", emoji: "⛰️", gradient: ["#6B7B8D", "#4A5568"], tagline: "Conquer the peaks" },
  { id: "emily_in_paris", name: "Emily in Paris", emoji: "🗼", gradient: ["#C8385A", "#8B2252"], tagline: "Très chic, très you" },
  { id: "nyc_streets", name: "NYC Streets", emoji: "🗽", gradient: ["#333333", "#555555"], tagline: "Concrete jungle style" },
  { id: "holi_calm", name: "Holi Calm", emoji: "🎨", gradient: ["#FF6B35", "#9B59B6"], tagline: "Colors of celebration" },
];
