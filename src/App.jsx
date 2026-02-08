import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "quette.pizzaVotes";
const COLLECTIONS_KEY = "quette.collections";
const PIZZA_SLICES = 10;
const STANDARD_INGREDIENTS = [
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
const MEDIA_TYPES = [
  { value: "film", label: "film" },
  { value: "serie tv", label: "serie tv" },
  { value: "videogiochi", label: "videogiochi" },
  { value: "libri", label: "libri" },
];

const emptyDraft = {
  title: "",
  type: "film",
  slices: 6,
  flavor: "",
  ingredients: [],
};

const normalizeIngredient = (value) => value.trim().toLowerCase();

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

function App() {
  const [view, setView] = useState("home");
  const [ratings, setRatings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn("Invalid local data", err);
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [draft, setDraft] = useState(emptyDraft);
  const [customIngredient, setCustomIngredient] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [editReturnView, setEditReturnView] = useState("all");
  const [collections, setCollections] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLECTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn("Invalid collections data", err);
    }
    return [];
  });
  const [collectionDetailId, setCollectionDetailId] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [renamingCollectionId, setRenamingCollectionId] = useState(null);
  const [renamingCollectionName, setRenamingCollectionName] = useState("");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
  const [importStatus, setImportStatus] = useState("");



  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) setRatings(parsed);
      } catch { /* ignore malformed data */ }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== COLLECTIONS_KEY) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed)) setCollections(parsed);
      } catch { /* ignore malformed data */ }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const sortedRatings = useMemo(() => {
    return [...ratings].sort((a, b) => b.createdAt - a.createdAt);
  }, [ratings]);

  const recentRatings = useMemo(
    () => sortedRatings.slice(0, 4),
    [sortedRatings]
  );

  const filteredRatings = useMemo(() => {
    let result = [...ratings];

    if (filterType) {
      result = result.filter((rating) => rating.type === filterType);
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((rating) =>
        rating.title.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "highest":
        result.sort((a, b) => b.slices - a.slices);
        break;
      case "lowest":
        result.sort((a, b) => a.slices - b.slices);
        break;
      case "az":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "za":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [ratings, filterType, searchTerm, sortBy]);

  const handleToggleIngredient = (ingredient) => {
    setDraft((prev) => {
      const exists = prev.ingredients.some(
        (item) => normalizeIngredient(item) === normalizeIngredient(ingredient)
      );
      const nextIngredients = exists
        ? prev.ingredients.filter(
            (item) =>
              normalizeIngredient(item) !== normalizeIngredient(ingredient)
          )
        : [...prev.ingredients, ingredient];
      return { ...prev, ingredients: nextIngredients };
    });
  };

  const handleRemoveIngredient = (ingredient) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter(
        (item) => normalizeIngredient(item) !== normalizeIngredient(ingredient)
      ),
    }));
  };

  const handleAddCustomIngredient = () => {
    const cleaned = customIngredient.trim();
    if (!cleaned) return;
    setDraft((prev) => {
      const exists = prev.ingredients.some(
        (item) => normalizeIngredient(item) === normalizeIngredient(cleaned)
      );
      if (exists) return prev;
      return { ...prev, ingredients: [...prev.ingredients, cleaned] };
    });
    setCustomIngredient("");
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setCustomIngredient("");
    setError("");
    setSelectedCollectionIds([]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    const title = draft.title.trim();
    const flavor = draft.flavor.trim();

    if (!title) {
      setError("Inserisci il nome del titolo.");
      return;
    }
    if (!flavor) {
      setError("Inserisci il nome del gusto.");
      return;
    }
    if (draft.ingredients.length === 0) {
      setError("Scegli almeno un ingrediente.");
      return;
    }

    if (editingId) {
      const targetId = editingId;
      setRatings((prev) => {
        const target = prev.find((item) => item.id === targetId);
        if (!target) return prev;
        return prev.map((item) =>
          item.id === targetId
            ? {
                ...item,
                title,
                type: draft.type,
                slices: draft.slices,
                flavor,
                ingredients: draft.ingredients,
              }
            : item
        );
      });
      setEditingId(null);
      resetDraft();
      if (editReturnView === "detail") {
        setDetailId(targetId);
        setView("detail");
      } else {
        setDetailId(null);
        setView("all");
      }
      return;
    }

    const newEntry = {
      id: createId(),
      title,
      type: draft.type,
      slices: draft.slices,
      flavor,
      ingredients: draft.ingredients,
      createdAt: Date.now(),
    };

    setRatings((prev) => [newEntry, ...prev]);

    if (selectedCollectionIds.length > 0) {
      setCollections((prev) =>
        prev.map((col) =>
          selectedCollectionIds.includes(col.id)
            ? { ...col, ratingIds: [...col.ratingIds, newEntry.id] }
            : col
        )
      );
    }

    resetDraft();
    setView("home");
  };

  const handleViewChange = (nextView) => {
    setView(nextView);
    if (nextView !== "new") {
      setEditingId(null);
    }
    if (nextView !== "detail") {
      setDetailId(null);
    }
    if (nextView !== "collection-detail") {
      setCollectionDetailId(null);
    }
  };

  const handleStartNew = () => {
    setSearchTerm("");
    setEditingId(null);
    setEditReturnView("all");
    setSelectedCollectionIds([]);
    resetDraft();
    setView("new");
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (view !== "all") {
      setView("all");
    }
  };

  const handleEditRating = (rating, returnView = "all") => {
    setDraft({
      title: rating.title,
      type: rating.type,
      slices: rating.slices,
      flavor: rating.flavor,
      ingredients: rating.ingredients,
    });
    setCustomIngredient("");
    setError("");
    setEditingId(rating.id);
    setEditReturnView(returnView);
    setView("new");
  };

  const handleDeleteRating = (rating) => {
    const confirmed = window.confirm(
      `Eliminare il voto per "${rating.title}"?`
    );
    if (!confirmed) return;
    setRatings((prev) => prev.filter((item) => item.id !== rating.id));
    setCollections((prev) =>
      prev.map((col) => ({
        ...col,
        ratingIds: col.ratingIds.filter((id) => id !== rating.id),
      }))
    );
    if (editingId === rating.id) {
      setEditingId(null);
      resetDraft();
      setView("all");
    }
    if (detailId === rating.id) {
      setDetailId(null);
      setView("all");
    }
  };

  const handleOpenDetail = (ratingId) => {
    setDetailId(ratingId);
    setView("detail");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetDraft();
    if (editReturnView === "detail") {
      setView("detail");
    } else {
      setDetailId(null);
      setView("all");
    }
  };

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const newCollection = {
      id: createId(),
      name,
      ratingIds: [],
      createdAt: Date.now(),
    };
    setCollections((prev) => [newCollection, ...prev]);
    setNewCollectionName("");
  };

  const handleRenameCollection = (collectionId, newName) => {
    const name = newName.trim();
    if (!name) return;
    setCollections((prev) =>
      prev.map((col) => (col.id === collectionId ? { ...col, name } : col))
    );
    setRenamingCollectionId(null);
    setRenamingCollectionName("");
  };

  const handleDeleteCollection = (collection) => {
    const confirmed = window.confirm(
      `Eliminare la collezione "${collection.name}"?`
    );
    if (!confirmed) return;
    setCollections((prev) => prev.filter((col) => col.id !== collection.id));
    if (collectionDetailId === collection.id) {
      setCollectionDetailId(null);
      setView("collections");
    }
  };

  const handleToggleRatingInCollection = (collectionId, ratingId) => {
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id !== collectionId) return col;
        const exists = col.ratingIds.includes(ratingId);
        const nextRatingIds = exists
          ? col.ratingIds.filter((id) => id !== ratingId)
          : [...col.ratingIds, ratingId];
        return { ...col, ratingIds: nextRatingIds };
      })
    );
  };

  const handleOpenCollectionDetail = (collectionId) => {
    setCollectionDetailId(collectionId);
    setView("collection-detail");
  };

  const handleToggleSelectedCollection = (collectionId) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleExportData = () => {
    const exportData = {
      version: 1,
      exportedAt: Date.now(),
      ratings,
      collections,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `quette-backup-${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file, mode) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.version || !Array.isArray(imported.ratings)) {
          setImportStatus("File non valido: struttura errata.");
          return;
        }
        if (mode === "replace") {
          setRatings(imported.ratings || []);
          setCollections(imported.collections || []);
          setImportStatus("Dati sostituiti con successo.");
        } else if (mode === "merge") {
          const existingIds = new Set(ratings.map((r) => r.id));
          const newRatings = (imported.ratings || []).filter(
            (r) => !existingIds.has(r.id)
          );
          setRatings((prev) => [...prev, ...newRatings]);
          const existingCollectionIds = new Set(collections.map((c) => c.id));
          const newCollections = (imported.collections || []).filter(
            (c) => !existingCollectionIds.has(c.id)
          );
          setCollections((prev) => [...prev, ...newCollections]);
          setImportStatus(
            `Uniti ${newRatings.length} voti e ${newCollections.length} collezioni.`
          );
        }
      } catch (err) {
        setImportStatus("Errore durante la lettura del file.");
      }
    };
    reader.readAsText(file);
  };

  const handleShareAsImage = async (rating) => {
    await document.fonts.ready;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const padding = 40;
    const cardWidth = 600;

    ctx.font = '16px "Press Start 2P"';
    const titleLines = wrapText(ctx, rating.title, cardWidth - padding * 2);
    ctx.font = '12px "Press Start 2P"';
    const flavorLines = wrapText(ctx, rating.flavor, cardWidth - padding * 2);
    const ingredientChipsHeight =
      Math.ceil(rating.ingredients.length / 3) * 40;
    const cardHeight =
      padding * 2 +
      60 +
      titleLines.length * 24 +
      20 +
      40 +
      20 +
      120 +
      20 +
      flavorLines.length * 20 +
      20 +
      ingredientChipsHeight +
      40;

    canvas.width = cardWidth;
    canvas.height = cardHeight;

    ctx.fillStyle = "#fff3da";
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    ctx.strokeStyle = "#2d2016";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);

    let y = padding;

    ctx.fillStyle = "#4bb4b3";
    ctx.fillRect(padding, y, 120, 40);
    ctx.strokeStyle = "#2d2016";
    ctx.lineWidth = 4;
    ctx.strokeRect(padding, y, 120, 40);
    ctx.fillStyle = "#2d2016";
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rating.type.toUpperCase(), padding + 60, y + 20);

    y += 60;

    ctx.fillStyle = "#2d2016";
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (const line of titleLines) {
      ctx.fillText(line, padding, y);
      y += 24;
    }

    y += 20;

    const sliceWidth = 30;
    const sliceHeight = 28;
    const sliceGap = 10;
    const slicesPerRow = 5;
    for (let i = 0; i < PIZZA_SLICES; i++) {
      const col = i % slicesPerRow;
      const row = Math.floor(i / slicesPerRow);
      const x = padding + col * (sliceWidth + sliceGap);
      const sliceY = y + row * (sliceHeight + sliceGap);

      ctx.fillStyle = i < rating.slices ? "#f7c84b" : "#d0d0d0";
      ctx.beginPath();
      ctx.moveTo(x + sliceWidth / 2, sliceY);
      ctx.lineTo(x + sliceWidth, sliceY + sliceHeight);
      ctx.lineTo(x, sliceY + sliceHeight);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#b67a39";
      ctx.lineWidth = 3;
      ctx.stroke();

      if (i < rating.slices) {
        ctx.fillStyle = "#e4492c";
        ctx.beginPath();
        ctx.arc(x + sliceWidth / 2 - 4, sliceY + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + sliceWidth / 2 + 6, sliceY + 16, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    y += 120;

    ctx.fillStyle = "#2d2016";
    ctx.font = '12px "Press Start 2P"';
    for (const line of flavorLines) {
      ctx.fillText(line, padding, y);
      y += 20;
    }

    y += 20;

    const chipWidth = (cardWidth - padding * 2 - 20) / 3;
    rating.ingredients.forEach((ingredient, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const chipX = padding + col * (chipWidth + 10);
      const chipY = y + row * 40;

      ctx.fillStyle = "#fffdfa";
      ctx.fillRect(chipX, chipY, chipWidth, 30);
      ctx.strokeStyle = "#2d2016";
      ctx.lineWidth = 2;
      ctx.strokeRect(chipX, chipY, chipWidth, 30);

      ctx.fillStyle = "#2d2016";
      ctx.font = '9px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.fillText(
        ingredient.length > 12
          ? ingredient.substring(0, 10) + ".."
          : ingredient,
        chipX + chipWidth / 2,
        chipY + 15
      );
    });

    y += Math.ceil(rating.ingredients.length / 3) * 40 + 20;

    ctx.fillStyle = "#2d2016";
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = "center";
    ctx.fillText("QUETTE", cardWidth / 2, y);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${rating.title.replace(/\s+/g, "-")}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleCopyShareImage = async (rating) => {
    await document.fonts.ready;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const padding = 40;
    const cardWidth = 600;

    ctx.font = '16px "Press Start 2P"';
    const titleLines = wrapText(ctx, rating.title, cardWidth - padding * 2);
    ctx.font = '12px "Press Start 2P"';
    const flavorLines = wrapText(ctx, rating.flavor, cardWidth - padding * 2);
    const ingredientChipsHeight =
      Math.ceil(rating.ingredients.length / 3) * 40;
    const cardHeight =
      padding * 2 +
      60 +
      titleLines.length * 24 +
      20 +
      40 +
      20 +
      120 +
      20 +
      flavorLines.length * 20 +
      20 +
      ingredientChipsHeight +
      40;

    canvas.width = cardWidth;
    canvas.height = cardHeight;

    ctx.fillStyle = "#fff3da";
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    ctx.strokeStyle = "#2d2016";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);

    let y = padding;

    ctx.fillStyle = "#4bb4b3";
    ctx.fillRect(padding, y, 120, 40);
    ctx.strokeStyle = "#2d2016";
    ctx.lineWidth = 4;
    ctx.strokeRect(padding, y, 120, 40);
    ctx.fillStyle = "#2d2016";
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rating.type.toUpperCase(), padding + 60, y + 20);

    y += 60;

    ctx.fillStyle = "#2d2016";
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (const line of titleLines) {
      ctx.fillText(line, padding, y);
      y += 24;
    }

    y += 20;

    const sliceWidth = 30;
    const sliceHeight = 28;
    const sliceGap = 10;
    const slicesPerRow = 5;
    for (let i = 0; i < PIZZA_SLICES; i++) {
      const col = i % slicesPerRow;
      const row = Math.floor(i / slicesPerRow);
      const x = padding + col * (sliceWidth + sliceGap);
      const sliceY = y + row * (sliceHeight + sliceGap);

      ctx.fillStyle = i < rating.slices ? "#f7c84b" : "#d0d0d0";
      ctx.beginPath();
      ctx.moveTo(x + sliceWidth / 2, sliceY);
      ctx.lineTo(x + sliceWidth, sliceY + sliceHeight);
      ctx.lineTo(x, sliceY + sliceHeight);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#b67a39";
      ctx.lineWidth = 3;
      ctx.stroke();

      if (i < rating.slices) {
        ctx.fillStyle = "#e4492c";
        ctx.beginPath();
        ctx.arc(x + sliceWidth / 2 - 4, sliceY + 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + sliceWidth / 2 + 6, sliceY + 16, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    y += 120;

    ctx.fillStyle = "#2d2016";
    ctx.font = '12px "Press Start 2P"';
    for (const line of flavorLines) {
      ctx.fillText(line, padding, y);
      y += 20;
    }

    y += 20;

    const chipWidth = (cardWidth - padding * 2 - 20) / 3;
    rating.ingredients.forEach((ingredient, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const chipX = padding + col * (chipWidth + 10);
      const chipY = y + row * 40;

      ctx.fillStyle = "#fffdfa";
      ctx.fillRect(chipX, chipY, chipWidth, 30);
      ctx.strokeStyle = "#2d2016";
      ctx.lineWidth = 2;
      ctx.strokeRect(chipX, chipY, chipWidth, 30);

      ctx.fillStyle = "#2d2016";
      ctx.font = '9px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.fillText(
        ingredient.length > 12
          ? ingredient.substring(0, 10) + ".."
          : ingredient,
        chipX + chipWidth / 2,
        chipY + 15
      );
    });

    y += Math.ceil(rating.ingredients.length / 3) * 40 + 20;

    ctx.fillStyle = "#2d2016";
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = "center";
    ctx.fillText("QUETTE", cardWidth / 2, y);

    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        alert("Immagine copiata negli appunti!");
      } catch (err) {
        alert("Errore durante la copia negli appunti.");
      }
    });
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">
          <div className="logo-pixel">Q</div>
          <div>
            <p className="brand-title">QUETTE</p>
            <p className="brand-subtitle">
              Voti per film, serie tv, videogiochi e libri, tutto in fette di pizza. Because pizza is the fricking best.
            </p>
          </div>
        </div>
        <nav className="nav">
          <button
            type="button"
            className={`nav-button ${view === "home" ? "active" : ""}`}
            onClick={() => handleViewChange("home")}
          >
            Home
          </button>
          <button
            type="button"
            className={`nav-button ${view === "all" ? "active" : ""}`}
            onClick={() => handleViewChange("all")}
          >
            Tutti i voti
          </button>
          <button
            type="button"
            className={`nav-button ${view === "collections" || view === "collection-detail" ? "active" : ""}`}
            onClick={() => handleViewChange("collections")}
          >
            Collezioni
          </button>
          <button
            type="button"
            className="nav-button cta"
            onClick={handleStartNew}
          >
            Nuovo voto
          </button>
        </nav>
        <div className="search-bar">
          <input
            type="search"
            placeholder="Cerca per nome..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button
            type="button"
            className="ghost"
            onClick={() => setSearchTerm("")}
          >
            Reset
          </button>
        </div>
      </header>

      <main className="page">
        {view === "home" && (
          <Home
            ratings={recentRatings}
            totalCount={ratings.length}
            onNew={handleStartNew}
            onOpenDetail={handleOpenDetail}
            onExport={handleExportData}
            onImport={handleImportData}
            importStatus={importStatus}
          />
        )}

        {view === "new" && (
          <NewRating
            draft={draft}
            error={error}
            customIngredient={customIngredient}
            isEditing={Boolean(editingId)}
            collections={collections}
            selectedCollectionIds={selectedCollectionIds}
            onChangeDraft={setDraft}
            onChangeCustomIngredient={setCustomIngredient}
            onToggleIngredient={handleToggleIngredient}
            onRemoveIngredient={handleRemoveIngredient}
            onAddCustomIngredient={handleAddCustomIngredient}
            onToggleSelectedCollection={handleToggleSelectedCollection}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
          />
        )}

        {view === "all" && (
          <AllRatings
            ratings={filteredRatings}
            total={ratings.length}
            searchTerm={searchTerm}
            filterType={filterType}
            onFilterChange={setFilterType}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onEdit={handleEditRating}
            onDelete={handleDeleteRating}
          />
        )}

        {view === "detail" && (
          <RatingDetail
            rating={ratings.find((item) => item.id === detailId) || null}
            collections={collections}
            onBack={() => handleViewChange("all")}
            onEdit={(rating) => handleEditRating(rating, "detail")}
            onDelete={handleDeleteRating}
            onToggleRatingInCollection={handleToggleRatingInCollection}
            onShareAsImage={handleShareAsImage}
            onCopyShareImage={handleCopyShareImage}
          />
        )}

        {view === "collections" && (
          <Collections
            collections={collections}
            newCollectionName={newCollectionName}
            renamingCollectionId={renamingCollectionId}
            renamingCollectionName={renamingCollectionName}
            onChangeNewCollectionName={setNewCollectionName}
            onCreateCollection={handleCreateCollection}
            onStartRename={(id, name) => {
              setRenamingCollectionId(id);
              setRenamingCollectionName(name);
            }}
            onCancelRename={() => {
              setRenamingCollectionId(null);
              setRenamingCollectionName("");
            }}
            onChangeRenamingName={setRenamingCollectionName}
            onRenameCollection={handleRenameCollection}
            onDeleteCollection={handleDeleteCollection}
            onOpenDetail={handleOpenCollectionDetail}
          />
        )}

        {view === "collection-detail" && (
          <CollectionDetail
            collection={
              collections.find((col) => col.id === collectionDetailId) || null
            }
            ratings={ratings}
            onBack={() => handleViewChange("collections")}
            onRemoveRating={(collectionId, ratingId) =>
              handleToggleRatingInCollection(collectionId, ratingId)
            }
          />
        )}
      </main>
    </div>
  );
}

function Home({ ratings, totalCount, onNew, onOpenDetail, onExport, onImport, importStatus }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Ultimi voti</h2>
          <p className="muted">
            {totalCount === 0
              ? "Nessun voto ancora."
              : `${totalCount} voti totali in dispensa.`}
          </p>
        </div>
      </header>
      {ratings.length === 0 ? (
        <div className="empty-state">
          <p>
            Nessun voto salvato. Premi "Nuovo Voto" per inserire il primo.
          </p>
        </div>
      ) : (
        <div className="cards">
          {ratings.map((rating, index) => (
            <RatingCard
              key={rating.id}
              rating={rating}
              compact
              delay={index}
              onOpen={() => onOpenDetail(rating.id)}
            />
          ))}
        </div>
      )}
      <DataManagement
        onExport={onExport}
        onImport={onImport}
        importStatus={importStatus}
      />
    </section>
  );
}

function NewRating({
  draft,
  error,
  customIngredient,
  isEditing,
  collections,
  selectedCollectionIds,
  onChangeDraft,
  onChangeCustomIngredient,
  onToggleIngredient,
  onRemoveIngredient,
  onAddCustomIngredient,
  onToggleSelectedCollection,
  onSubmit,
  onCancel,
}) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>{isEditing ? "Modifica voto" : "Nuovo voto"}</h2>
          <p className="muted">
            {isEditing
              ? "Aggiorna gusto, ingredienti e fette."
              : "Crea un gusto unico e assegnagli delle fette."}
          </p>
        </div>
      </header>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Nome titolo</span>
            <input
              type="text"
              placeholder="Es: Il viaggio della pizza"
              value={draft.title}
              onChange={(event) =>
                onChangeDraft({ ...draft, title: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select
              value={draft.type}
              onChange={(event) =>
                onChangeDraft({ ...draft, type: event.target.value })
              }
            >
              {MEDIA_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Nome gusto</span>
            <input
              type="text"
              placeholder="Es: Margherita cosmica"
              value={draft.flavor}
              onChange={(event) =>
                onChangeDraft({ ...draft, flavor: event.target.value })
              }
            />
          </label>
          <div className="field">
            <span>Fette di pizza</span>
            <PizzaMeter
              value={draft.slices}
              onSelect={(value) =>
                onChangeDraft({ ...draft, slices: value })
              }
            />
          </div>
        </div>

        <div className="ingredient-section">
          <h3>Ingredienti standard</h3>
          <div className="pill-grid">
            {STANDARD_INGREDIENTS.map((ingredient) => {
              const active = draft.ingredients.some(
                (item) =>
                  normalizeIngredient(item) ===
                  normalizeIngredient(ingredient)
              );
              return (
                <button
                  key={ingredient}
                  type="button"
                  className={`pill ${active ? "active" : ""}`}
                  onClick={() => onToggleIngredient(ingredient)}
                >
                  {ingredient}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ingredient-section">
          <h3>Ingredienti bizzarri (definiti da te)</h3>
          <div className="custom-ingredient">
            <input
              type="text"
              placeholder="Es: liquirizia spaziale"
              value={customIngredient}
              onChange={(event) => onChangeCustomIngredient(event.target.value)}
            />
            <button type="button" onClick={onAddCustomIngredient}>
              Aggiungi
            </button>
          </div>
        </div>

        <div className="ingredient-section">
          <h3>Ingredienti selezionati</h3>
          {draft.ingredients.length === 0 ? (
            <p className="muted">Nessun ingrediente scelto.</p>
          ) : (
            <div className="chips">
              {draft.ingredients.map((ingredient) => (
                <button
                  key={ingredient}
                  type="button"
                  className="chip"
                  onClick={() => onRemoveIngredient(ingredient)}
                >
                  {ingredient} <span>x</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {collections.length > 0 && !isEditing && (
          <div className="ingredient-section">
            <h3>Aggiungi a collezioni (opzionale)</h3>
            <div className="pill-grid">
              {collections.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  className={`pill ${selectedCollectionIds.includes(col.id) ? "active" : ""}`}
                  onClick={() => onToggleSelectedCollection(col.id)}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error ? <p className="error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit" className="nav-button cta">
            {isEditing ? "Aggiorna voto" : "Salva voto"}
          </button>
          {isEditing ? (
            <button type="button" className="nav-button" onClick={onCancel}>
              Annulla
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function AllRatings({ ratings, total, searchTerm, filterType, onFilterChange, sortBy, onSortChange, onEdit, onDelete }) {
  const hasFilters = searchTerm || filterType;
  const emptyMessage =
    total === 0
      ? "Nessun voto salvato."
      : "Nessun voto corrisponde ai filtri.";
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Tutti i voti</h2>
          <p className="muted">
            {hasFilters
              ? `${ratings.length} risultati su ${total}.`
              : `${total} voti salvati.`}
          </p>
        </div>
      </header>
      <div className="filter-toolbar">
        <div className="pill-grid">
          <button
            type="button"
            className={`pill ${filterType === "" ? "active" : ""}`}
            onClick={() => onFilterChange("")}
          >
            Tutti
          </button>
          {MEDIA_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={`pill ${filterType === type.value ? "active" : ""}`}
              onClick={() => onFilterChange(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="newest">Più recenti</option>
          <option value="oldest">Meno recenti</option>
          <option value="highest">Voto più alto</option>
          <option value="lowest">Voto più basso</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>
      {ratings.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="cards">
          {ratings.map((rating, index) => (
            <RatingCard
              key={rating.id}
              rating={rating}
              delay={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RatingDetail({ rating, collections, onBack, onEdit, onDelete, onToggleRatingInCollection, onShareAsImage, onCopyShareImage }) {
  if (!rating) {
    return (
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Dettaglio voto</h2>
            <p className="muted">Controlla ingredienti e fette del voto.</p>
          </div>
          <button type="button" className="nav-button" onClick={onBack}>
            Torna ai voti
          </button>
        </header>
        <div className="empty-state">
          <p>Questo voto non esiste piu'.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Dettaglio voto</h2>
          <p className="muted">Controlla ingredienti e fette del voto.</p>
        </div>
        <button type="button" className="nav-button" onClick={onBack}>
          Torna ai voti
        </button>
      </header>
      <RatingCard rating={rating} onEdit={onEdit} onDelete={onDelete} />

      {collections.length > 0 && (
        <div className="collection-assign">
          <h3>Collezioni</h3>
          <div className="pill-grid">
            {collections.map((col) => {
              const isInCollection = col.ratingIds.includes(rating.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  className={`pill ${isInCollection ? "active" : ""}`}
                  onClick={() => onToggleRatingInCollection(col.id, rating.id)}
                >
                  {col.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="share-section">
        <h3>Condividi</h3>
        <div className="card-actions">
          <button
            type="button"
            className="nav-button"
            onClick={() => onShareAsImage(rating)}
          >
            Scarica immagine
          </button>
          <button
            type="button"
            className="nav-button"
            onClick={() => onCopyShareImage(rating)}
          >
            Copia immagine
          </button>
        </div>
      </div>
    </section>
  );
}

function RatingCard({
  rating,
  compact = false,
  delay = 0,
  onEdit,
  onDelete,
  onOpen,
}) {
  const handleKeyDown = (event) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      className={`card ${compact ? "compact" : ""} ${
        onOpen ? "clickable" : ""
      }`}
      style={{ animationDelay: `${delay * 0.08}s` }}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      tabIndex={onOpen ? 0 : undefined}
      role={onOpen ? "button" : undefined}
      aria-label={onOpen ? `Apri dettaglio ${rating.title}` : undefined}
    >
      <div className="card-header">
        <div>
          <h3>{rating.title}</h3>
          <p className="muted">Gusto: {rating.flavor}</p>
        </div>
        <span className="badge">{rating.type}</span>
      </div>
      <PizzaMeter value={rating.slices} />
      <div className="chips">
        {rating.ingredients.map((ingredient) => (
          <span key={ingredient} className="chip static">
            {ingredient}
          </span>
        ))}
      </div>
      {onEdit || onDelete ? (
        <div className="card-actions">
          {onEdit ? (
            <button
              type="button"
              className="nav-button"
              onClick={(event) => { event.stopPropagation(); onEdit(rating); }}
            >
              Modifica
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="nav-button danger"
              onClick={(event) => { event.stopPropagation(); onDelete(rating); }}
            >
              Elimina
            </button>
          ) : null}
        </div>
      ) : null}
      {!compact ? (
        <p className="muted">Inserito il {formatDate(rating.createdAt)}</p>
      ) : null}
    </article>
  );
}

function PizzaMeter({ value, max = PIZZA_SLICES, onSelect }) {
  const slices = Array.from({ length: max }, (_, index) => index + 1);

  return (
    <div className={`pizza-meter ${onSelect ? "interactive" : ""}`}>
      <div className="slices">
        {slices.map((slice) => {
          const active = slice <= value;
          if (onSelect) {
            return (
              <button
                key={slice}
                type="button"
                className={`slice ${active ? "on" : "off"}`}
                onClick={() => onSelect(slice)}
                aria-pressed={active}
                aria-label={`${slice} fette`}
              />
            );
          }
          return (
            <span
              key={slice}
              className={`slice ${active ? "on" : "off"}`}
            />
          );
        })}
      </div>
      <span className="slice-count">
        {value}/{max}
      </span>
    </div>
  );
}

function Collections({
  collections,
  newCollectionName,
  renamingCollectionId,
  renamingCollectionName,
  onChangeNewCollectionName,
  onCreateCollection,
  onStartRename,
  onCancelRename,
  onChangeRenamingName,
  onRenameCollection,
  onDeleteCollection,
  onOpenDetail,
}) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Collezioni</h2>
          <p className="muted">
            {collections.length === 0
              ? "Nessuna collezione ancora."
              : `${collections.length} collezioni salvate.`}
          </p>
        </div>
      </header>

      <div className="collection-create">
        <input
          type="text"
          placeholder="Nome nuova collezione..."
          value={newCollectionName}
          onChange={(e) => onChangeNewCollectionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCreateCollection();
            }
          }}
        />
        <button
          type="button"
          className="nav-button cta"
          onClick={onCreateCollection}
        >
          Crea
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="empty-state">
          <p>Nessuna collezione. Crea la prima collezione.</p>
        </div>
      ) : (
        <div className="collection-list">
          {collections.map((col) => (
            <div key={col.id} className="card">
              {renamingCollectionId === col.id ? (
                <div className="collection-rename">
                  <input
                    type="text"
                    value={renamingCollectionName}
                    onChange={(e) => onChangeRenamingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onRenameCollection(col.id, renamingCollectionName);
                      } else if (e.key === "Escape") {
                        onCancelRename();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="nav-button"
                    onClick={() =>
                      onRenameCollection(col.id, renamingCollectionName)
                    }
                  >
                    Salva
                  </button>
                  <button
                    type="button"
                    className="nav-button"
                    onClick={onCancelRename}
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <>
                  <div className="card-header">
                    <div>
                      <h3>{col.name}</h3>
                      <p className="muted">{col.ratingIds.length} voti</p>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="nav-button"
                      onClick={() => onOpenDetail(col.id)}
                    >
                      Apri
                    </button>
                    <button
                      type="button"
                      className="nav-button"
                      onClick={() => onStartRename(col.id, col.name)}
                    >
                      Rinomina
                    </button>
                    <button
                      type="button"
                      className="nav-button danger"
                      onClick={() => onDeleteCollection(col)}
                    >
                      Elimina
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CollectionDetail({ collection, ratings, onBack, onRemoveRating }) {
  if (!collection) {
    return (
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Dettaglio collezione</h2>
            <p className="muted">Questa collezione non esiste piu'.</p>
          </div>
          <button type="button" className="nav-button" onClick={onBack}>
            Torna alle collezioni
          </button>
        </header>
        <div className="empty-state">
          <p>Collezione non trovata.</p>
        </div>
      </section>
    );
  }

  const collectionRatings = ratings.filter((r) =>
    collection.ratingIds.includes(r.id)
  );

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>{collection.name}</h2>
          <p className="muted">{collectionRatings.length} voti nella collezione.</p>
        </div>
        <button type="button" className="nav-button" onClick={onBack}>
          Torna alle collezioni
        </button>
      </header>

      {collectionRatings.length === 0 ? (
        <div className="empty-state">
          <p>Nessun voto in questa collezione.</p>
        </div>
      ) : (
        <div className="cards">
          {collectionRatings.map((rating, index) => (
            <div key={rating.id}>
              <RatingCard rating={rating} delay={index} />
              <div className="card-actions" style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  className="nav-button danger"
                  onClick={() => onRemoveRating(collection.id, rating.id)}
                >
                  Rimuovi dalla collezione
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DataManagement({ onExport, onImport, importStatus }) {
  const [importMode, setImportMode] = useState("merge");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImport(file, importMode);
      e.target.value = "";
    }
  };

  return (
    <div className="data-management">
      <h3>Backup e ripristino</h3>
      <div className="data-actions">
        <button
          type="button"
          className="nav-button"
          onClick={onExport}
        >
          Esporta dati
        </button>
        <div className="import-group">
          <div className="pill-grid">
            <button
              type="button"
              className={`pill ${importMode === "merge" ? "active" : ""}`}
              onClick={() => setImportMode("merge")}
            >
              Unisci
            </button>
            <button
              type="button"
              className={`pill ${importMode === "replace" ? "active" : ""}`}
              onClick={() => setImportMode("replace")}
            >
              Sostituisci
            </button>
          </div>
          <input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="import-file-input"
          />
          <button
            type="button"
            className="nav-button"
            onClick={() => document.getElementById("import-file-input").click()}
          >
            Importa dati
          </button>
        </div>
      </div>
      {importStatus && (
        <div className="import-status">
          <p>{importStatus}</p>
        </div>
      )}
    </div>
  );
}

export default App;
