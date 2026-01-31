import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "quette.pizzaVotes";
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
  const [draft, setDraft] = useState(emptyDraft);
  const [customIngredient, setCustomIngredient] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [editReturnView, setEditReturnView] = useState("all");



  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  }, [ratings]);

  const sortedRatings = useMemo(() => {
    return [...ratings].sort((a, b) => b.createdAt - a.createdAt);
  }, [ratings]);

  const recentRatings = useMemo(
    () => sortedRatings.slice(0, 4),
    [sortedRatings]
  );

  const filteredRatings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedRatings;
    return sortedRatings.filter((rating) =>
      rating.title.toLowerCase().includes(term)
    );
  }, [sortedRatings, searchTerm]);

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
  };

  const handleStartNew = () => {
    setSearchTerm("");
    setEditingId(null);
    setEditReturnView("all");
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
          />
        )}

        {view === "new" && (
          <NewRating
            draft={draft}
            error={error}
            customIngredient={customIngredient}
            isEditing={Boolean(editingId)}
            onChangeDraft={setDraft}
            onChangeCustomIngredient={setCustomIngredient}
            onToggleIngredient={handleToggleIngredient}
            onRemoveIngredient={handleRemoveIngredient}
            onAddCustomIngredient={handleAddCustomIngredient}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
          />
        )}

        {view === "all" && (
          <AllRatings
            ratings={filteredRatings}
            total={ratings.length}
            searchTerm={searchTerm}
            onEdit={handleEditRating}
            onDelete={handleDeleteRating}
          />
        )}

        {view === "detail" && (
          <RatingDetail
            rating={ratings.find((item) => item.id === detailId) || null}
            onBack={() => handleViewChange("all")}
            onEdit={(rating) => handleEditRating(rating, "detail")}
            onDelete={handleDeleteRating}
          />
        )}
      </main>
    </div>
  );
}

function Home({ ratings, totalCount, onNew, onOpenDetail }) {
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
        {/* <button type="button" className="nav-button cta" onClick={onNew}>
          Aggiungi al volo
        </button> */}
      </header>
      {ratings.length === 0 ? (
        <div className="empty-state">
          {/* <p>
            Nessun voto salvato. Premi "Aggiungi al volo" per creare il primo.
          </p> */}
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
    </section>
  );
}

function NewRating({
  draft,
  error,
  customIngredient,
  isEditing,
  onChangeDraft,
  onChangeCustomIngredient,
  onToggleIngredient,
  onRemoveIngredient,
  onAddCustomIngredient,
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

function AllRatings({ ratings, total, searchTerm, onEdit, onDelete }) {
  const emptyMessage =
    total === 0
      ? "Nessun voto salvato."
      : "Nessun voto corrisponde alla ricerca.";
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Tutti i voti</h2>
          <p className="muted">
            {searchTerm
              ? `${ratings.length} risultati su ${total}.`
              : `${total} voti salvati.`}
          </p>
        </div>
      </header>
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

function RatingDetail({ rating, onBack, onEdit, onDelete }) {
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
      {rating ? (
        <RatingCard rating={rating} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <div className="empty-state">
          <p>Questo voto non esiste piu'.</p>
        </div>
      )}
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
              onClick={() => onEdit(rating)}
            >
              Modifica
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="nav-button danger"
              onClick={() => onDelete(rating)}
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

export default App;
