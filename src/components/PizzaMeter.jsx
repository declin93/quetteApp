import { PIZZA_SLICES } from "../constants";

// Componente duale: display-only se onSelect è assente, interattivo (form) se è presente
function PizzaMeter({ value, max = PIZZA_SLICES, onSelect }) {
  // Genera un array [1, 2, ..., max] — l'underscore è per convenzione per ignorare il valore dell'elemento
  const slices = Array.from({ length: max }, (_, index) => index + 1);

  return (
    <div className={`pizza-meter ${onSelect ? "interactive" : ""}`}>
      <div className="slices">
        {slices.map((slice) => {
          const active = slice <= value;
          if (onSelect) {
            // Versione interattiva: ogni fetta è un <button> cliccabile
            return (
              <button
                key={slice}
                type="button"
                className={`slice ${active ? "on" : "off"}`}
                onClick={() => onSelect(slice)}
                aria-pressed={active}  // indica ai screen reader se la fetta è "premuta"
                aria-label={`${slice} fette`}
              />
            );
          }
          // Versione display: solo <span>, nessuna interazione
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

export default PizzaMeter;
