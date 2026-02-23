import { MEDIA_TYPES, STANDARD_INGREDIENTS, normalizeIngredient } from "../constants";
import PizzaMeter from "./PizzaMeter";

// Form unificato per creare e modificare un voto — isEditing controlla testo e comportamento
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
            {/* PizzaMeter riceve onSelect → diventa interattivo (bottoni invece di span) */}
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
              // Confronta normalizzato per non avere falsi negativi su maiuscole/spazi
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
              {/* Cliccare un chip lo rimuove dalla selezione */}
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

        {/* Il selettore di collezioni si mostra solo in fase di creazione, non di modifica */}
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
          {/* Il tasto Annulla compare solo in modifica, non in creazione */}
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

export default NewRating;
