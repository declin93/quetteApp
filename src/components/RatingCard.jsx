import { formatDate } from "../constants";
import PizzaMeter from "./PizzaMeter";

function RatingCard({
  rating,
  compact = false,  // true → layout ridotto (Home), false → card completa (AllRatings)
  delay = 0,        // indice usato per sfasare l'animazione CSS di ingresso
  onEdit,
  onDelete,
  onOpen,           // se presente, la card diventa cliccabile come un link
}) {
  // Accessibilità tastiera: Enter e Spazio attivano onOpen come farebbe un click
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
      // animationDelay sfasato per le card: 0.08s × indice crea un effetto "a cascata"
      style={{ animationDelay: `${delay * 0.08}s` }}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      // tabIndex=0 rende l'elemento raggiungibile col Tab, ma solo se è cliccabile
      tabIndex={onOpen ? 0 : undefined}
      // role e aria-label comunicano ai screen reader che si tratta di un elemento interattivo
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
              // stopPropagation evita che il click sul bottone apra il dettaglio della card
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
      {/* La data viene nascosta nella versione compact (Home) */}
      {!compact ? (
        <p className="muted">Inserito il {formatDate(rating.createdAt)}</p>
      ) : null}
    </article>
  );
}

export default RatingCard;
