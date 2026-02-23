import { PIZZA_SLICES } from "./constants";

// Spezza il testo in righe che non superano maxWidth pixel, misurando con il Canvas API
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

// Disegna la card del voto su un elemento <canvas> e lo restituisce
// L'altezza del canvas è calcolata dinamicamente in base al numero di righe di testo e ingredienti
function renderRatingCanvas(rating) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const padding = 40;
  const cardWidth = 600;

  // Pre-calcola le righe di testo per sapere quanto spazio occuperanno verticalmente
  ctx.font = '16px "Press Start 2P"';
  const titleLines = wrapText(ctx, rating.title, cardWidth - padding * 2);
  ctx.font = '12px "Press Start 2P"';
  const flavorLines = wrapText(ctx, rating.flavor, cardWidth - padding * 2);
  const ingredientChipsHeight =
    Math.ceil(rating.ingredients.length / 3) * 40;
  const cardHeight =
    padding * 2 +
    60 +
    titleLines.length * 24 +
    20 +
    40 +
    20 +
    120 +
    20 +
    flavorLines.length * 20 +
    20 +
    ingredientChipsHeight +
    40;

  canvas.width = cardWidth;
  canvas.height = cardHeight;

  // Sfondo e bordo della card
  ctx.fillStyle = "#fff3da";
  ctx.fillRect(0, 0, cardWidth, cardHeight);
  ctx.strokeStyle = "#2d2016";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);

  // "y" tiene traccia della posizione verticale corrente mentre si disegnano gli elementi dall'alto
  let y = padding;

  // Badge del tipo di media (film, serie tv, ecc.)
  ctx.fillStyle = "#4bb4b3";
  ctx.fillRect(padding, y, 120, 40);
  ctx.strokeStyle = "#2d2016";
  ctx.lineWidth = 4;
  ctx.strokeRect(padding, y, 120, 40);
  ctx.fillStyle = "#2d2016";
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rating.type.toUpperCase(), padding + 60, y + 20);

  y += 60;

  // Titolo (potenzialmente su più righe)
  ctx.fillStyle = "#2d2016";
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const line of titleLines) {
    ctx.fillText(line, padding, y);
    y += 24;
  }

  y += 20;

  // Griglia di fette di pizza: gialle se "attive" (slices raggiunte), grigie se no
  const sliceWidth = 30;
  const sliceHeight = 28;
  const sliceGap = 10;
  const slicesPerRow = 5;
  for (let i = 0; i < PIZZA_SLICES; i++) {
    const col = i % slicesPerRow;
    const row = Math.floor(i / slicesPerRow);
    const x = padding + col * (sliceWidth + sliceGap);
    const sliceY = y + row * (sliceHeight + sliceGap);

    ctx.fillStyle = i < rating.slices ? "#f7c84b" : "#d0d0d0";
    // Disegna un triangolo (fetta di pizza) con beginPath/moveTo/lineTo
    ctx.beginPath();
    ctx.moveTo(x + sliceWidth / 2, sliceY);
    ctx.lineTo(x + sliceWidth, sliceY + sliceHeight);
    ctx.lineTo(x, sliceY + sliceHeight);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#b67a39";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pallini rossi (pomodoro) solo sulle fette attive
    if (i < rating.slices) {
      ctx.fillStyle = "#e4492c";
      ctx.beginPath();
      ctx.arc(x + sliceWidth / 2 - 4, sliceY + 12, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + sliceWidth / 2 + 6, sliceY + 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  y += 120;

  // Nome del gusto (flavor), potenzialmente su più righe
  ctx.fillStyle = "#2d2016";
  ctx.font = '12px "Press Start 2P"';
  for (const line of flavorLines) {
    ctx.fillText(line, padding, y);
    y += 20;
  }

  y += 20;

  // Chip degli ingredienti disposti su 3 colonne
  const chipWidth = (cardWidth - padding * 2 - 20) / 3;
  rating.ingredients.forEach((ingredient, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const chipX = padding + col * (chipWidth + 10);
    const chipY = y + row * 40;

    ctx.fillStyle = "#fffdfa";
    ctx.fillRect(chipX, chipY, chipWidth, 30);
    ctx.strokeStyle = "#2d2016";
    ctx.lineWidth = 2;
    ctx.strokeRect(chipX, chipY, chipWidth, 30);

    ctx.fillStyle = "#2d2016";
    ctx.font = '9px "Press Start 2P"';
    ctx.textAlign = "center";
    // Tronca il testo se supera 12 caratteri per non uscire dal chip
    ctx.fillText(
      ingredient.length > 12
        ? ingredient.substring(0, 10) + ".."
        : ingredient,
      chipX + chipWidth / 2,
      chipY + 15
    );
  });

  y += Math.ceil(rating.ingredients.length / 3) * 40 + 20;

  // Firma dell'app in fondo alla card
  ctx.fillStyle = "#2d2016";
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = "center";
  ctx.fillText("QUETTE", cardWidth / 2, y);

  return canvas;
}

// Attende che i font siano caricati prima di renderizzare, altrimenti "Press Start 2P" potrebbe non essere disponibile
export async function shareAsImage(rating) {
  await document.fonts.ready;
  const canvas = renderRatingCanvas(rating);
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${rating.title.replace(/\s+/g, "-")}.png`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

export async function copyShareImage(rating) {
  await document.fonts.ready;
  const canvas = renderRatingCanvas(rating);
  // ClipboardItem richiede un blob con tipo MIME esplicito
  canvas.toBlob(async (blob) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      alert("Immagine copiata negli appunti!");
    } catch (err) {
      alert("Errore durante la copia negli appunti.");
    }
  });
}
