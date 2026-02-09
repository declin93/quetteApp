import { formatDate } from "../constants";
import PizzaMeter from "./PizzaMeter";

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

export default RatingCard;
