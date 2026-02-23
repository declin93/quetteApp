import { MEDIA_TYPES } from "../constants";
import RatingCard from "./RatingCard";

function AllRatings({ ratings, total, searchTerm, filterType, onFilterChange, sortBy, onSortChange, onEdit, onDelete }) {
  // hasFilters serve per mostrare un contatore "X risultati su Y" anziché solo "Y voti"
  const hasFilters = searchTerm || filterType;

  // Messaggio diverso a seconda che non ci siano dati o che i filtri non abbiano match
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
          {/* filterType === "" significa "nessun filtro" → mostra tutti */}
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

export default AllRatings;
