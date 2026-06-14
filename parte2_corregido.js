const SYMBOLS = ["🍎", "🚀", "🐱", "🌵", "🎲", "🎧", "⚽", "🍕"];
const STORAGE_PREFIX = "memoria-auditada-mejor-";

// FIX: usar un unico objeto state deja una fuente de verdad clara.
// BUG: la version original mezclaba estado real con texto/clases del DOM.
const state = {
  playerName: "",
  pairCount: 8,
  cards: [],
  selected: [],
  locked: false,
  moves: 0,
  startedAt: null,
  timerId: null,
  elapsedSeconds: 0,
  gameWon: false
};

const elements = {
  board: document.querySelector("#tablero"),
  name: document.querySelector("#nombre"),
  difficulty: document.querySelector("#dificultad"),
  restart: document.querySelector("#reiniciar"),
  moves: document.querySelector("#movimientos"),
  time: document.querySelector("#tiempo"),
  best: document.querySelector("#mejor"),
  status: document.querySelector("#estado")
};

// FIX: delegacion de eventos; hay un listener en el tablero, no uno por carta.
// BUG: la version original recreaba listeners por cada carta en cada render.
elements.board.addEventListener("click", handleBoardClick);
elements.restart.addEventListener("click", resetGame);
elements.difficulty.addEventListener("change", handleDifficultyChange);
elements.name.addEventListener("input", handleNameInput);
document.addEventListener("keydown", handleKeydown);

resetGame();

function handleBoardClick(event) {
  const cardButton = event.target.closest(".card");

  if (!cardButton || !elements.board.contains(cardButton)) {
    return;
  }

  flipCard(Number(cardButton.dataset.index));
}

function handleDifficultyChange(event) {
  state.pairCount = Number(event.target.value);
  resetGame();
}

function handleNameInput(event) {
  state.playerName = event.target.value.trim();
}

function handleKeydown(event) {
  if (isFormField(event.target)) {
    return;
  }

  if (event.key.toLowerCase() === "r") {
    resetGame();
  }
}

function isFormField(element) {
  return ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName);
}

function resetGame() {
  stopTimer();

  state.playerName = elements.name.value.trim();
  state.pairCount = Number(elements.difficulty.value);
  state.cards = createDeck(state.pairCount);
  state.selected = [];
  state.locked = false;
  state.moves = 0;
  state.startedAt = null;
  state.elapsedSeconds = 0;
  state.gameWon = false;

  render();
}

function createDeck(pairCount) {
  const chosenSymbols = SYMBOLS.slice(0, pairCount);
  const deck = chosenSymbols.flatMap((symbol, pairId) => [
    createCard(symbol, pairId, 1),
    createCard(symbol, pairId, 2)
  ]);

  return shuffle(deck);
}

function createCard(symbol, pairId, copyNumber) {
  return {
    id: `${pairId}-${copyNumber}`,
    symbol,
    pairId,
    isOpen: false,
    isFound: false
  };
}

function shuffle(cards) {
  const shuffled = [...cards];

  // FIX: Fisher-Yates entrega un barajado correcto.
  // BUG: sort(() => Math.random() - 0.5) produce orden sesgado.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function flipCard(index) {
  const card = state.cards[index];

  // FIX: bloquear aqui evita tercera carta, doble click y cartas ya encontradas.
  // BUG: la version original dejaba re-voltear la misma carta y podia compararla consigo misma.
  if (state.locked || !card || card.isOpen || card.isFound || state.selected.includes(index)) {
    return;
  }

  startTimer();

  card.isOpen = true;
  state.selected.push(index);
  render();

  if (state.selected.length === 2) {
    resolveTurn();
  }
}

function resolveTurn() {
  const [firstIndex, secondIndex] = state.selected;
  const firstCard = state.cards[firstIndex];
  const secondCard = state.cards[secondIndex];

  state.moves++;
  state.locked = true;

  // FIX: comparar por pairId del estado, no por textContent del DOM.
  // BUG: leer el DOM para decidir logica rompe la fuente unica de verdad.
  if (firstCard.pairId === secondCard.pairId) {
    firstCard.isFound = true;
    secondCard.isFound = true;
    state.selected = [];
    state.locked = false;
    checkVictory();
    render();
    return;
  }

  render();

  setTimeout(() => {
    firstCard.isOpen = false;
    secondCard.isOpen = false;
    state.selected = [];
    state.locked = false;
    render();
  }, 800);
}

function checkVictory() {
  state.gameWon = state.cards.every((card) => card.isFound);

  if (!state.gameWon) {
    return;
  }

  stopTimer();
  saveBestScore();
}

function startTimer() {
  if (state.timerId) {
    return;
  }

  state.startedAt = Date.now() - state.elapsedSeconds * 1000;
  state.timerId = setInterval(() => {
    state.elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
    elements.time.textContent = formatTime(state.elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
}

function saveBestScore() {
  const storageKey = STORAGE_PREFIX + state.pairCount;
  const currentBest = readBestScore();
  const newScore = {
    moves: state.moves,
    seconds: state.elapsedSeconds
  };

  if (!currentBest || isBetterScore(newScore, currentBest)) {
    localStorage.setItem(storageKey, JSON.stringify(newScore));
  }
}

function readBestScore() {
  const stored = localStorage.getItem(STORAGE_PREFIX + state.pairCount);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function isBetterScore(candidate, currentBest) {
  return candidate.moves < currentBest.moves ||
    (candidate.moves === currentBest.moves && candidate.seconds < currentBest.seconds);
}

function render() {
  elements.board.style.setProperty("--columns", "4");
  elements.board.replaceChildren(...state.cards.map(createCardButton));
  elements.moves.textContent = String(state.moves);
  elements.time.textContent = formatTime(state.elapsedSeconds);
  elements.best.textContent = formatBestScore(readBestScore());
  updateStatus();
}

function createCardButton(card, index) {
  const button = document.createElement("button");
  const isVisible = card.isOpen || card.isFound;

  button.type = "button";
  button.className = "card";
  button.dataset.index = String(index);

  // FIX: textContent evita interpretar HTML escrito por usuarios.
  // BUG: la version original usaba innerHTML con el nombre al ganar, lo que permite XSS.
  button.textContent = isVisible ? card.symbol : "?";
  button.setAttribute("aria-label", isVisible ? `Carta ${card.symbol}` : "Carta oculta");

  if (card.isOpen) {
    button.classList.add("is-open");
  }

  if (card.isFound) {
    button.classList.add("is-found");
  }

  if (state.locked || card.isOpen || card.isFound) {
    button.disabled = true;
  }

  return button;
}

function updateStatus() {
  if (state.gameWon) {
    const player = state.playerName || "jugador";
    elements.status.textContent = `Ganaste, ${player}. Movimientos: ${state.moves}. Tiempo: ${formatTime(state.elapsedSeconds)}.`;
    return;
  }

  if (state.locked) {
    elements.status.textContent = "Comparando cartas...";
    return;
  }

  elements.status.textContent = "Encuentra todas las parejas. Presiona R para reiniciar.";
}

function formatBestScore(best) {
  return best ? `${best.moves} mov. / ${formatTime(best.seconds)}` : "--";
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
