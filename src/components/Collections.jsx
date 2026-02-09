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

export default Collections;
