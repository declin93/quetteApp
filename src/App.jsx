import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEY, COLLECTIONS_KEY, emptyDraft, createId, normalizeIngredient } from "./constants";
import { shareAsImage, copyShareImage } from "./shareImage";
import Home from "./components/Home";
import NewRating from "./components/NewRating";
import AllRatings from "./components/AllRatings";
import RatingDetail from "./components/RatingDetail";
import Collections from "./components/Collections";
import CollectionDetail from "./components/CollectionDetail";

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
            onShareAsImage={shareAsImage}
            onCopyShareImage={copyShareImage}
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

export default App;
