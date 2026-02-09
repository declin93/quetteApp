import RatingCard from "./RatingCard";

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

export default CollectionDetail;
