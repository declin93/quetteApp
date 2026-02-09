# Quette App

React PWA for rating media (films, TV series, video games, books) using pizza slices as a scoring metaphor. Italian-language UI.

## Development commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

Deploy: push to `main` — GitHub Pages serves from the `dist/` folder. Base path is `/quetteApp/`.

## Architecture

**Monolithic single-file app.** All logic lives in `src/App.jsx` (~1700 lines) — no router, no external state library, no TypeScript, no tests, no linter.

### File structure

```
index.html              HTML entry (lang="it")
vite.config.js          Vite + React + vite-plugin-pwa
src/
  main.jsx              ReactDOM root
  App.jsx               All components and logic
  styles.css            All styles
public/
  icon.svg              App icon / favicon
```

### View-based routing

Navigation is managed via a `view` state string in the root `App` component. No URL-based router.

| `view` value          | Component            | Description                     |
|-----------------------|----------------------|---------------------------------|
| `"home"`              | `Home`               | Recent ratings + data import/export |
| `"new"`               | `NewRating`          | Create or edit a rating         |
| `"all"`               | `AllRatings`         | Filterable/sortable list        |
| `"detail"`            | `RatingDetail`       | Single rating + share + collections |
| `"collections"`       | `Collections`        | Manage collections              |
| `"collection-detail"` | `CollectionDetail`   | Ratings within a collection     |

### State management

All state is `useState` in the root `App` component, passed down as props. No context or reducers.

### Data persistence

localStorage with cross-tab sync via `storage` event listeners.

| Key                    | Contents             |
|------------------------|----------------------|
| `quette.pizzaVotes`   | `Rating[]` (JSON)    |
| `quette.collections`  | `Collection[]` (JSON)|

Export/import: JSON backup files with `{ version: 1, exportedAt, ratings, collections }`.

## Data models

### Rating

```js
{
  id: string,           // crypto.randomUUID() or fallback
  title: string,
  type: string,         // "film" | "serie tv" | "videogiochi" | "libri"
  slices: number,       // 1–10 (PIZZA_SLICES = 10)
  flavor: string,       // custom pizza flavor name
  ingredients: string[],// selected from STANDARD_INGREDIENTS or custom
  createdAt: number     // Date.now() timestamp
}
```

### Collection

```js
{
  id: string,
  name: string,
  ratingIds: string[],  // references to Rating.id
  createdAt: number
}
```

## Key constants

- `PIZZA_SLICES = 10` — max score
- `MEDIA_TYPES` — `["film", "serie tv", "videogiochi", "libri"]`
- `STANDARD_INGREDIENTS` — 15 Italian pizza toppings (pomodoro, mozzarella, basilico, etc.)
- Dates formatted with `it-IT` locale (`dd/mm/yyyy`)

## Sharing

Rating cards can be shared as PNG images rendered via Canvas API using the "Press Start 2P" font. Two options: download image or copy to clipboard.

## PWA

Configured via `vite-plugin-pwa` with `registerType: "autoUpdate"`. Manifest uses `#f3b06f` theme color, standalone display, SVG icon.
