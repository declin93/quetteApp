import { useState } from "react";

function DataManagement({ onExport, onImport, importStatus }) {
  const [importMode, setImportMode] = useState("merge");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImport(file, importMode);
      e.target.value = "";
    }
  };

  return (
    <div className="data-management">
      <h3>Backup e ripristino</h3>
      <div className="data-actions">
        <button
          type="button"
          className="nav-button"
          onClick={onExport}
        >
          Esporta dati
        </button>
        <div className="import-group">
          <div className="pill-grid">
            <button
              type="button"
              className={`pill ${importMode === "merge" ? "active" : ""}`}
              onClick={() => setImportMode("merge")}
            >
              Unisci
            </button>
            <button
              type="button"
              className={`pill ${importMode === "replace" ? "active" : ""}`}
              onClick={() => setImportMode("replace")}
            >
              Sostituisci
            </button>
          </div>
          <input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="import-file-input"
          />
          <button
            type="button"
            className="nav-button"
            onClick={() => document.getElementById("import-file-input").click()}
          >
            Importa dati
          </button>
        </div>
      </div>
      {importStatus && (
        <div className="import-status">
          <p>{importStatus}</p>
        </div>
      )}
    </div>
  );
}

export default DataManagement;
