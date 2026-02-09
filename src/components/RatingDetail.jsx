import RatingCard from "./RatingCard";

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

export default RatingDetail;
