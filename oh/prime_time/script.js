const NS = "http://www.w3.org/2000/svg";
const chart = document.getElementById("chart");
const curvesLayer = document.getElementById("curves");
const xAxis = document.getElementById("xAxis");
const marker = document.getElementById("ageMarker");
const markerDot = document.getElementById("markerDot");
const chartWrap = document.querySelector(".chart-wrap");
const leverButtons = [...document.querySelectorAll(".lever")];
const actionResult = document.getElementById("actionResult");
const stageSteps = [...document.querySelectorAll(".stage-step")];
const shareInsightButton = document.getElementById("shareInsight");
const copyInsightButton = document.getElementById("copyInsight");
const compact = window.matchMedia("(max-width: 720px)").matches;
let currentShareText = "";

const plot = {
  left: 40,
  right: compact ? 500 : 880,
  top: 52,
  bottom: 472,
  minAge: 10,
  maxAge: 80,
};

const viewWidth = compact ? 540 : 900;

const ticks = [15, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

const levers = [
  {
    id: "startup",
    color: "#80baff",
    width: 4.8,
    dash: "",
    value(age) {
      return 0.12 + 0.78 * bell(age, 42, 17);
    },
  },
  {
    id: "risk",
    color: "rgba(214, 229, 249, 0.78)",
    width: 3.4,
    dash: "10 12",
    value(age) {
      return 0.08 + 0.64 * bell(age, 34, 10);
    },
  },
  {
    id: "technical",
    color: "rgba(214, 229, 249, 0.72)",
    width: 3.1,
    dash: "2 10",
    value(age) {
      return 0.07 + 0.52 * bell(age, 31, 11);
    },
  },
  {
    id: "judgement",
    color: "#a8d669",
    width: 4.8,
    dash: "",
    value(age) {
      return 0.03 + 0.86 * logistic(age, 50, 0.16) - 0.07 * logistic(age, 75, 0.55);
    },
  },
  {
    id: "capital",
    color: "rgba(194, 220, 166, 0.72)",
    width: 3.3,
    dash: "9 10",
    value(age) {
      return 0.02 + 0.78 * logistic(age, 56, 0.13) - 0.1 * logistic(age, 73, 0.65);
    },
  },
  {
    id: "deals",
    color: "rgba(194, 220, 166, 0.68)",
    width: 3.1,
    dash: "2 10",
    value(age) {
      return 0.02 + 0.6 * logistic(age, 59, 0.12) - 0.04 * logistic(age, 74, 0.7);
    },
  },
];

const curveEls = new Map();

const stages = [
  { id: "20", min: 0, max: 29, text: "В 20 важно исследовать." },
  { id: "30", min: 30, max: 39, text: "В 30 - строить." },
  { id: "40", min: 40, max: 49, text: "В 40 - масштабировать." },
  { id: "50", min: 50, max: 59, text: "В 50 - усиливать других." },
  { id: "60", min: 60, max: 120, text: "В 60+ - передавать мудрость и создавать наследие." },
];

function configureChartFrame() {
  chart.setAttribute("viewBox", `0 0 ${viewWidth} 590`);
  document.getElementById("xBaseLine").setAttribute("x2", plot.right);
  document.querySelector(".x-title").setAttribute("x", (plot.left + plot.right) / 2);

  const founderStart = ageToX(30);
  const founderEnd = ageToX(45);
  const investorStart = ageToX(45);
  const investorEnd = ageToX(75);
  const founderBandRect = document.getElementById("founderBandRect");
  const investorBandRect = document.getElementById("investorBandRect");

  founderBandRect.setAttribute("x", founderStart);
  founderBandRect.setAttribute("width", founderEnd - founderStart);
  investorBandRect.setAttribute("x", investorStart);
  investorBandRect.setAttribute("width", investorEnd - investorStart);

  positionStage(".founder-stage", compact
    ? { circle: ageToX(31), text: ageToX(34), range: ageToX(35) }
    : { circle: 298, text: 338, range: 370 });
  positionStage(".investor-stage", compact
    ? { circle: ageToX(52), text: ageToX(55), range: ageToX(57) }
    : { circle: 610, text: 650, range: 682 });
}

function positionStage(selector, positions) {
  const group = document.querySelector(selector);
  const circle = group.querySelector("circle");
  const text = [...group.querySelectorAll("text")];

  circle.setAttribute("cx", positions.circle);
  text[0].setAttribute("x", positions.text);
  text[1].setAttribute("x", positions.text);
  text[2].setAttribute("x", positions.range);
}

function bell(x, center, spread) {
  return Math.exp(-Math.pow((x - center) / spread, 2));
}

function logistic(x, center, steepness) {
  return 1 / (1 + Math.exp(-steepness * (x - center)));
}

function ageToX(age) {
  const progress = (age - plot.minAge) / (plot.maxAge - plot.minAge);
  return plot.left + progress * (plot.right - plot.left);
}

function xToAge(x) {
  const progress = (x - plot.left) / (plot.right - plot.left);
  return plot.minAge + progress * (plot.maxAge - plot.minAge);
}

function valueToY(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return plot.bottom - clamped * (plot.bottom - plot.top);
}

function makePath(lever) {
  const points = [];
  for (let age = plot.minAge; age <= plot.maxAge; age += 1) {
    points.push([ageToX(age), valueToY(lever.value(age))]);
  }

  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function renderAxis() {
  ticks.forEach((tick) => {
    const x = ageToX(tick);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.setAttribute("y1", plot.bottom);
    line.setAttribute("y2", plot.bottom + 12);
    xAxis.appendChild(line);

    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", plot.bottom + 43);
    text.setAttribute("text-anchor", "middle");
    text.textContent = tick;
    xAxis.appendChild(text);
  });
}

function renderCurves() {
  levers.forEach((lever) => {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "curve");
    path.setAttribute("data-lever", lever.id);
    path.setAttribute("d", makePath(lever));
    path.setAttribute("stroke", lever.color);
    path.setAttribute("stroke-width", lever.width);
    if (lever.dash) path.setAttribute("stroke-dasharray", lever.dash);
    curvesLayer.appendChild(path);
    curveEls.set(lever.id, path);
  });
}

function activeLeverForAge(age) {
  return levers
    .map((lever) => ({ lever, value: lever.value(age) }))
    .sort((a, b) => b.value - a.value)[0].lever;
}

function stageForAge(age) {
  return stages.find((stage) => age >= stage.min && age <= stage.max) || stages[0];
}

function setActive(id) {
  curveEls.forEach((path, leverId) => {
    path.classList.toggle("active", leverId === id);
    path.classList.toggle("ghosted", leverId !== id);
  });

  leverButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lever === id);
  });
}

function updateFromAge(age) {
  const clampedAge = Math.max(plot.minAge, Math.min(plot.maxAge, age));
  const active = activeLeverForAge(clampedAge);
  const roundedAge = Math.round(clampedAge);
  const activeStage = stageForAge(roundedAge);
  const x = ageToX(clampedAge);
  const y = valueToY(active.value(clampedAge));

  marker.setAttribute("x1", x);
  marker.setAttribute("x2", x);
  markerDot.setAttribute("cx", x);
  markerDot.setAttribute("cy", y);
  setActive(active.id);
  updateAction(roundedAge, activeStage);
}

function updateAction(age, stage) {
  actionResult.textContent = stage.text;
  currentShareText = `Мне ${age}. ${stage.text} ПРАЙМ-ТАЙМ предпринимателей и инвесторов: https://dayonebuilder.online/oh/prime_time/`;

  stageSteps.forEach((step) => {
    step.classList.toggle("active", step.dataset.stage === stage.id);
  });
}

async function copyInsight() {
  try {
    await navigator.clipboard.writeText(currentShareText);
  } catch (error) {
    window.prompt("Скопируй текст", currentShareText);
  }
  copyInsightButton.textContent = "Скопировано";
  window.setTimeout(() => {
    copyInsightButton.textContent = "Скопировать";
  }, 1400);
}

async function shareInsight() {
  const shareData = {
    title: "ПРАЙМ-ТАЙМ предпринимателей и инвесторов",
    text: currentShareText,
    url: "https://dayonebuilder.online/oh/prime_time/",
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      if (error.name !== "AbortError") {
        await copyInsight();
      }
    }
    return;
  }

  await copyInsight();
}

function pointerToChartAge(event) {
  const rect = chart.getBoundingClientRect();
  const viewX = ((event.clientX - rect.left) / rect.width) * viewWidth;
  return xToAge(viewX);
}

function handlePointer(event) {
  updateFromAge(pointerToChartAge(event));
}

configureChartFrame();
renderAxis();
renderCurves();
updateFromAge(38);

chartWrap.addEventListener("pointerdown", (event) => {
  chartWrap.setPointerCapture(event.pointerId);
  handlePointer(event);
});

chartWrap.addEventListener("pointermove", handlePointer);
chartWrap.addEventListener("pointerup", (event) => {
  if (chartWrap.hasPointerCapture(event.pointerId)) {
    chartWrap.releasePointerCapture(event.pointerId);
  }
});

leverButtons.forEach((button) => {
  button.addEventListener("pointerenter", () => setActive(button.dataset.lever));
  button.addEventListener("focus", () => setActive(button.dataset.lever));
});

copyInsightButton.addEventListener("click", copyInsight);
shareInsightButton.addEventListener("click", shareInsight);
