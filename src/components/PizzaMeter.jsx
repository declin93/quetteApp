import { PIZZA_SLICES } from "../constants";

function PizzaMeter({ value, max = PIZZA_SLICES, onSelect }) {
  const slices = Array.from({ length: max }, (_, index) => index + 1);

  return (
    <div className={`pizza-meter ${onSelect ? "interactive" : ""}`}>
      <div className="slices">
        {slices.map((slice) => {
          const active = slice <= value;
          if (onSelect) {
            return (
              <button
                key={slice}
                type="button"
                className={`slice ${active ? "on" : "off"}`}
                onClick={() => onSelect(slice)}
                aria-pressed={active}
                aria-label={`${slice} fette`}
              />
            );
          }
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
