// src/utils/vehicleUtils.js

// This is the single source of truth for grouping vehicle models
export const normalizeModelName = (name) => {
  const lower = (name || "").toLowerCase();
  if (lower.includes("12m")) return "12m";
  if (lower.includes("9m")) return "9m";
  if (lower.includes("7m")) return "7m";
  if (lower.includes("1.5t")) return "1.5t";
  
  // --- THESE ARE THE FIXES ---
  if (lower.includes("6s")) return "6s"; // Was "6S"
  if (lower.includes("3s")) return "3s"; // Was "3S"
  if (lower.includes("55t")) return "55t"; // Already correct, but good to check
  if (lower.includes("5t")) return "5t"; // Already correct
  if (lower.includes("coach") || lower.includes("13.5m")) return "13.5m"; // Was "Coach"
  // --- END OF FIXES ---

  return name || "Other";
};