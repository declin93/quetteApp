import RatingCard from "./RatingCard";
import DataManagement from "./DataManagement";

// Mostra gli ultimi 4 voti (già filtrati da App) + il pannello backup
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
          {/* compact=true riduce il layout della card; delay=index sfasa l'animazione di ingresso */}
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

export default Home;
