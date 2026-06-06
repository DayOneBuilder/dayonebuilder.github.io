const ROOT = document.getElementById("pixel-world-root");
const CANVAS = document.getElementById("pixel-world-canvas");
const EXIT = document.getElementById("pixel-world-exit");
const CTX = CANVAS.getContext("2d", { alpha: false });
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  start: performance.now(),
  pointer: { x: -1000, y: -1000, active: false },
  poke: new Map(),
  tracked: new Set(),
  images: new Map(),
  characters: [],
  actions: {},
  scene: null,
  actors: [],
  artifact: { ready: false, x: 0, y: 0, w: 0, h: 0, pulse: 0 }
};

function track(name, params = {}) {
  if (state.tracked.has(name) && name === "pixel_world_view") return;
  state.tracked.add(name);
  if (typeof window.gtag === "function") {
    window.gtag("event", name, {
      event_category: "dayonebuilder_pixel_world",
      ...params
    });
  }
}

async function readJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

function loadImage(src) {
  if (state.images.has(src)) return state.images.get(src);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image ${src}`));
    image.src = src;
  });
  state.images.set(src, promise);
  return promise;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, Math.floor(window.innerWidth));
  const height = Math.max(420, Math.floor(window.innerHeight));
  state.width = width;
  state.height = height;
  state.dpr = dpr;
  CANVAS.width = Math.floor(width * dpr);
  CANVAS.height = Math.floor(height * dpr);
  CANVAS.style.width = `${width}px`;
  CANVAS.style.height = `${height}px`;
  CTX.setTransform(dpr, 0, 0, dpr, 0, 0);
  CTX.imageSmoothingEnabled = false;
}

function characterById(id) {
  return state.characters.find((character) => character.id === id);
}

function actionById(id) {
  return state.actions[id] || state.actions.idle;
}

function worldScale() {
  if (state.width < 480) return 0.74;
  if (state.width < 760) return 0.84;
  return 1;
}

function frameFor(character, pose) {
  const actualPose = character.frames[pose]
    ? pose
    : character.fallbacks?.[pose] || "idle";
  return character.loadedFrames[actualPose] || character.loadedFrames.idle;
}

function sceneTime(now) {
  const length = 14800;
  if (REDUCED_MOTION) return Math.min(now - state.start, 9800);
  return (now - state.start) % length;
}

function actorSnapshot(actor, now) {
  const character = characterById(actor.character);
  const t = sceneTime(now);
  let actionStep = actor.timeline[0];
  let previousPosition = actor.start;
  let lastPosition = actor.start;
  let nextStepAt = 14800;

  for (let index = 0; index < actor.timeline.length; index += 1) {
    const step = actor.timeline[index];
    if (step.at <= t) {
      actionStep = step;
      previousPosition = lastPosition;
      if (step.to) lastPosition = step.to;
      nextStepAt = actor.timeline[index + 1]?.at || 14800;
    } else {
      nextStepAt = step.at;
      break;
    }
  }

  const action = actionById(actionStep.action);
  const duration = Math.max(1, Math.min(action.duration || 1200, nextStepAt - actionStep.at));
  const local = clamp((t - actionStep.at) / duration, 0, 1);
  let x = lastPosition.x * state.width;
  let y = lastPosition.y * state.height;

  if (actionStep.to) {
    const moved = ease(local);
    x = (previousPosition.x + (actionStep.to.x - previousPosition.x) * moved) * state.width;
    y = (previousPosition.y + (actionStep.to.y - previousPosition.y) * moved) * state.height;
  }

  const pokeUntil = state.poke.get(actor.character) || 0;
  const poked = pokeUntil > now;
  const motion = poked ? "pop" : action.motion || "breathe";
  const pose = poked ? "wave" : action.pose || "idle";
  const offset = motionOffset(motion, local, now, actor.character);

  return {
    character,
    action,
    pose,
    x: x + offset.x,
    y: y + offset.y,
    scale: character.scale * offset.scale * worldScale(),
    local,
    actionId: actionStep.action
  };
}

function motionOffset(motion, local, now, seed) {
  const slow = now / 1000 + seed.length * 0.31;
  if (REDUCED_MOTION) return { x: 0, y: 0, scale: 1 };
  switch (motion) {
    case "hop_arc":
      return { x: 0, y: -Math.sin(local * Math.PI) * 46, scale: 1 + Math.sin(local * Math.PI) * 0.05 };
    case "tiny_sway":
      return { x: Math.sin(slow * 6) * 5, y: Math.sin(slow * 9) * 3, scale: 1 };
    case "lean_in":
      return { x: Math.sin(local * Math.PI) * 12, y: Math.sin(local * Math.PI) * 5, scale: 1.02 };
    case "walk_bob":
      return { x: Math.sin(slow * 14) * 3, y: Math.abs(Math.sin(slow * 14)) * -7, scale: 1 };
    case "workbench_bounce":
      return { x: Math.sin(slow * 18) * 5, y: Math.sin(slow * 24) * 4, scale: 1 };
    case "proud_reveal":
      return { x: 0, y: Math.sin(local * Math.PI) * -18, scale: 1 + Math.sin(local * Math.PI) * 0.08 };
    case "sleepy_sway":
      return { x: Math.sin(slow * 2) * 2, y: Math.cos(slow * 2) * 2, scale: 1 };
    case "pop":
      return { x: 0, y: -Math.sin(local * Math.PI) * 26, scale: 1 + Math.sin(local * Math.PI) * 0.12 };
    case "breathe":
    default:
      return { x: 0, y: Math.sin(slow * 3) * 3, scale: 1 + Math.sin(slow * 3) * 0.015 };
  }
}

function drawPixelRect(x, y, w, h, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  CTX.fillStyle = color;
  CTX.fillRect(px, py, Math.round(w), Math.round(h));
}

function drawBackground(now) {
  const { width, height } = state;
  const grd = CTX.createLinearGradient(0, 0, 0, height);
  grd.addColorStop(0, "#30343f");
  grd.addColorStop(0.58, "#222733");
  grd.addColorStop(1, "#171a22");
  CTX.fillStyle = grd;
  CTX.fillRect(0, 0, width, height);

  const t = now / 1000;
  CTX.globalAlpha = 0.42;
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 97 + Math.sin(t * 0.3 + i) * 8) % width;
    const y = (i * 53) % (height * 0.62);
    const size = i % 5 === 0 ? 3 : 2;
    drawPixelRect(x, y, size, size, i % 3 === 0 ? "#6f7b92" : "#4d5668");
  }
  CTX.globalAlpha = 1;

  const floorY = height * 0.83;
  drawPixelRect(0, floorY, width, height - floorY, "#141820");
  for (let x = 0; x < width; x += 28) {
    drawPixelRect(x, floorY, 14, 2, "#2f3541");
  }

  const benchX = width * 0.5 - 138;
  const benchY = height * 0.67;
  drawPixelRect(benchX, benchY, 276, 18, "#3d2f34");
  drawPixelRect(benchX + 18, benchY + 18, 22, 92, "#2d2228");
  drawPixelRect(benchX + 236, benchY + 18, 22, 92, "#2d2228");
  drawPixelRect(benchX + 56, benchY - 14, 42, 12, "#9f7946");
  drawPixelRect(benchX + 112, benchY - 20, 30, 18, "#d9a34c");
  drawPixelRect(benchX + 170, benchY - 12, 52, 10, "#8fb7ff");
}

function drawArtifact(now) {
  const revealAt = state.scene.artifact.revealAt || 9400;
  const t = sceneTime(now);
  const ready = t >= revealAt || state.artifact.ready;
  const x = state.width * 0.5;
  const y = state.height * 0.59;
  state.artifact.ready = ready;
  state.artifact.x = x - 58;
  state.artifact.y = y - 50;
  state.artifact.w = 116;
  state.artifact.h = 92;
  state.artifact.pulse = ready ? (Math.sin(now / 260) + 1) / 2 : 0;
  EXIT.classList.toggle("is-ready", ready);
  EXIT.style.left = `${x}px`;
  EXIT.style.top = `${y}px`;
  EXIT.style.width = `${state.artifact.w}px`;
  EXIT.style.height = `${state.artifact.h}px`;

  if (!ready) {
    if (t > 5200) {
      CTX.globalAlpha = clamp((t - 5200) / 3800, 0, 0.9);
      drawSparks(x, y, now, 10);
      CTX.globalAlpha = 1;
    }
    return;
  }

  if (!state.tracked.has("artifact_reveal")) track("artifact_reveal", { product: state.scene.productSlug });
  const glow = 0.18 + state.artifact.pulse * 0.16;
  CTX.globalAlpha = glow;
  CTX.fillStyle = "#ffd36f";
  CTX.beginPath();
  CTX.arc(x, y, 86, 0, Math.PI * 2);
  CTX.fill();
  CTX.globalAlpha = 1;

  drawPixelRect(x - 44, y - 26, 88, 52, "#f3ead2");
  drawPixelRect(x - 44, y - 26, 88, 8, "#fff8dd");
  drawPixelRect(x - 38, y - 16, 72, 6, "#7083a3");
  drawPixelRect(x - 38, y - 4, 54, 6, "#d69a41");
  drawPixelRect(x - 38, y + 8, 66, 6, "#7083a3");
  drawPixelRect(x + 30, y - 34, 22, 22, "#75d67d");
  drawPixelRect(x + 35, y - 29, 12, 12, "#1b3d2e");
  drawSparks(x, y - 12, now, 7);
}

function drawSparks(cx, cy, now, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = now / 700 + i * 1.9;
    const radius = 18 + (i % 4) * 8 + Math.sin(now / 400 + i) * 5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle * 1.3) * radius * 0.48;
    drawPixelRect(x, y, i % 2 ? 4 : 3, i % 2 ? 4 : 3, i % 3 === 0 ? "#ffe19a" : "#8fc7ff");
  }
}

function drawCharacter(snapshot) {
  const { character, pose, x, y, scale } = snapshot;
  const image = frameFor(character, pose);
  const size = 224 * scale;
  const anchor = character.anchor || { x: 0.5, y: 0.88 };
  const drawX = Math.round(x - size * anchor.x);
  const drawY = Math.round(y - size * anchor.y);

  CTX.globalAlpha = 0.35;
  CTX.fillStyle = "#07090d";
  CTX.beginPath();
  CTX.ellipse(Math.round(x), Math.round(y + 5), Math.max(22, size * 0.25), Math.max(5, size * 0.055), 0, 0, Math.PI * 2);
  CTX.fill();
  CTX.globalAlpha = 1;
  CTX.drawImage(image, drawX, drawY, Math.round(size), Math.round(size));

  const dx = state.pointer.x - x;
  const dy = state.pointer.y - (y - size * 0.45);
  const close = state.pointer.active && Math.sqrt(dx * dx + dy * dy) < size * 0.65;
  if (close) {
    CTX.globalAlpha = 0.75;
    drawPixelRect(x - 5, drawY - 12 + Math.sin(performance.now() / 120) * 3, 10, 10, "#ffe19a");
    CTX.globalAlpha = 1;
  }
}

function render(now) {
  drawBackground(now);
  drawArtifact(now);
  const snapshots = state.actors
    .map((actor) => actorSnapshot(actor, now))
    .sort((a, b) => a.y - b.y);
  for (const snapshot of snapshots) drawCharacter(snapshot);
  requestAnimationFrame(render);
}

function nearestActor(x, y, now) {
  let best = null;
  let bestDistance = Infinity;
  for (const actor of state.actors) {
    const snap = actorSnapshot(actor, now);
    const dx = x - snap.x;
    const dy = y - snap.y + 42;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = actor;
    }
  }
  return bestDistance < 145 ? best : null;
}

function pointFromEvent(event) {
  const rect = CANVAS.getBoundingClientRect();
  const pointer = event.touches?.[0] || event;
  return {
    x: pointer.clientX - rect.left,
    y: pointer.clientY - rect.top
  };
}

function artifactContains(point) {
  const a = state.artifact;
  return a.ready && point.x >= a.x && point.x <= a.x + a.w && point.y >= a.y && point.y <= a.y + a.h;
}

function onPointerMove(event) {
  const point = pointFromEvent(event);
  state.pointer = { ...point, active: true };
}

function onPointerLeave() {
  state.pointer.active = false;
}

function onPointerDown(event) {
  const point = pointFromEvent(event);
  state.pointer = { ...point, active: true };
  if (artifactContains(point)) {
    track("product_exit", { product: state.scene.productSlug, exit_url: state.scene.exitUrl });
    window.location.href = state.scene.exitUrl;
    return;
  }
  const actor = nearestActor(point.x, point.y, performance.now());
  if (actor) {
    state.poke.set(actor.character, performance.now() + 1150);
    const action = Math.random() > 0.5 ? "character_poke" : "character_hop";
    track(action, { character: actor.character });
    return;
  }
  state.start = performance.now();
  track("world_restart");
}

async function boot() {
  resize();
  window.addEventListener("resize", resize);
  CANVAS.addEventListener("pointermove", onPointerMove);
  CANVAS.addEventListener("pointerleave", onPointerLeave);
  CANVAS.addEventListener("pointerdown", onPointerDown);
  EXIT.addEventListener("click", () => track("product_exit", { product: state.scene.productSlug, exit_url: state.scene.exitUrl }));

  const [characterData, actionData, sceneData] = await Promise.all([
    readJson("/assets/pixel-world/characters.json"),
    readJson("/assets/pixel-world/actions.json"),
    readJson("/assets/pixel-world/scenes.json")
  ]);
  state.actions = actionData.actions || {};
  state.characters = await Promise.all((characterData.characters || []).map(async (character) => {
    const loadedFrames = {};
    for (const [pose, src] of Object.entries(character.frames || {})) {
      loadedFrames[pose] = await loadImage(src);
    }
    return { ...character, loadedFrames };
  }));
  state.scene = (sceneData.scenes || []).find((scene) => scene.id === sceneData.defaultScene) || sceneData.scenes[0];
  state.actors = state.scene.actors || [];
  track("pixel_world_view", { scene: state.scene.id });
  requestAnimationFrame(render);
}

boot().catch((error) => {
  ROOT.classList.add("pixel-world-failed");
  console.error(error);
});
