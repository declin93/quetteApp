// Chiavi usate per leggere/scrivere su localStorage
export const STORAGE_KEY = "quette.pizzaVotes";
export const COLLECTIONS_KEY = "quette.collections";

export const PIZZA_SLICES = 10;

export const STANDARD_INGREDIENTS = [
  "pomodoro",
  "mozzarella",
  "basilico",
  "funghi",
  "olive",
  "cipolla",
  "salame",
  "prosciutto",
  "peperoni",
  "carciofi",
  "ananas",
  "tonno",
  "rucola",
  "gorgonzola",
  "wurstel",
];

// Ogni tipo ha sia un value (usato nei dati) che una label (mostrata in UI)
export const MEDIA_TYPES = [
  { value: "film", label: "film" },
  { value: "serie tv", label: "serie tv" },
  { value: "videogiochi", label: "videogiochi" },
  { value: "libri", label: "libri" },
];

// Stato iniziale del form vuoto, riusato ogni volta che si resetta il draft
export const emptyDraft = {
  title: "",
  type: "film",
  slices: 6,
  flavor: "",
  ingredients: [],
};

// Normalizza ingredienti prima di confrontarli, per evitare duplicati tipo "Funghi" vs "funghi"
export const normalizeIngredient = (value) => value.trim().toLowerCase();

// Usa crypto.randomUUID() nativo se disponibile, altrimenti genera un ID con timestamp + random
export const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
