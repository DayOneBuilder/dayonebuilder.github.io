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
  renderStarted: false,
  characters: [],
  actions: {},
  experiment: null,
  scene: null,
  actors: [],
  artifact: { ready: false, x: 0, y: 0, w: 0, h: 0, pulse: 0 },
  nudge: { until: 0, x: 0, y: 0, phase: "idle", startedAt: 0 },
  miniUsers: []
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

function trackOnce(key, name, params = {}) {
  if (state.tracked.has(key)) return;
  state.tracked.add(key);
  track(name, params);
}

function eventParams(params = {}) {
  return {
    scene_id: state.scene?.id,
    hypothesis_id: state.experiment?.id,
    product_slug: state.experiment?.productSlug || state.scene?.productSlug,
    target_url: state.experiment?.targetUrl || state.scene?.exitUrl,
    ...params
  };
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
  return character.loadedFrames[actualPose] || character.loadedFrames.idle || null;
}

function sceneLength() {
  return state.scene?.duration || 14800;
}

function firstActorAt() {
  return Math.min(...state.actors.map((actor) => actor.visibleFrom ?? actor.timeline?.[0]?.at ?? 0));
}

function sceneTime(now) {
  const length = sceneLength();
  if (REDUCED_MOTION) {
    const revealAt = state.scene?.artifact?.revealAt || Math.round(length * 0.64);
    return Math.min(now - state.start, revealAt + 3600);
  }
  return (now - state.start) % length;
}

function selectHypothesis(experimentData, sceneData) {
  const hypotheses = experimentData?.hypotheses || [];
  const activeId = experimentData?.activeHypothesisId;
  const explicit = hypotheses.find((item) => item.id === activeId && item.status === "active");
  const active = explicit || hypotheses.find((item) => item.status === "active") || null;
  if (active) return active;
  const scene = (sceneData.scenes || []).find((item) => item.id === sceneData.defaultScene) || sceneData.scenes[0];
  return {
    id: "default_scene_transition",
    sceneId: scene?.id,
    productSlug: scene?.productSlug,
    targetUrl: scene?.exitUrl,
    transition: "artifact_click",
    transitionTargets: ["artifact"]
  };
}

function nudgePhase(t) {
  const story = state.scene?.story || {};
  const revealAt = state.scene?.artifact?.revealAt || 17600;
  if (state.artifact.ready || t >= revealAt) return "artifact_focus";
  if (t < firstActorAt()) return "summon";
  if (t < (story.blueprintAt || 5600)) return "sort_problem";
  if (t < (story.machineAt || 10400)) return "plan_blueprint";
  if (t < revealAt) return "build_test";
  return "artifact_focus";
}

function pullNextBeatCloser(t) {
  const story = state.scene?.story || {};
  const beats = [
    firstActorAt(),
    story.blueprintAt,
    story.machineAt,
    story.testAt,
    state.scene?.artifact?.revealAt,
    story.feedbackAt,
    story.nextSignalAt
  ].filter((beat) => Number.isFinite(beat) && beat > t + 900);
  if (!beats.length) return 0;
  const next = Math.min(...beats);
  const jump = clamp(next - t - 900, 0, 850);
  state.start -= jump;
  return jump;
}

function nudgeWorld(point, now) {
  const t = sceneTime(now);
  const phase = nudgePhase(t);
  const jumpMs = phase === "artifact_focus" ? 0 : pullNextBeatCloser(t);
  state.nudge = {
    until: now + 1250,
    x: point.x,
    y: point.y,
    phase,
    startedAt: now
  };

  if (phase === "artifact_focus") {
    track("pixel_artifact_focus", eventParams({ interaction_phase: phase }));
  } else {
    track("pixel_table_nudge", eventParams({ interaction_phase: phase, accelerated_ms: jumpMs }));
  }
}

function transitionTargetUrl() {
  return state.experiment?.targetUrl || state.scene?.exitUrl || "/";
}

function transitionProductSlug() {
  return state.experiment?.productSlug || state.scene?.productSlug || "";
}

function transitionToProduct(type) {
  const targetUrl = transitionTargetUrl();
  const params = eventParams({
    transition_type: type,
    target_url: targetUrl,
    product_slug: transitionProductSlug()
  });
  track("pixel_transition_click", params);
  track("product_exit", params);
  window.location.href = targetUrl;
}

function actorSnapshot(actor, now) {
  const character = characterById(actor.character);
  if (!character) return null;

  const t = sceneTime(now);
  const visibleFrom = actor.visibleFrom ?? actor.timeline?.[0]?.at ?? 0;
  if (t < visibleFrom) return null;

  let actionStep = actor.timeline[0];
  let previousPosition = actor.start;
  let lastPosition = actor.start;
  let nextStepAt = sceneLength();

  for (let index = 0; index < actor.timeline.length; index += 1) {
    const step = actor.timeline[index];
    if (step.at <= t) {
      actionStep = step;
      previousPosition = lastPosition;
      if (step.to) lastPosition = step.to;
      nextStepAt = actor.timeline[index + 1]?.at || sceneLength();
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
    opacity: clamp((t - visibleFrom) / 520, 0, 1),
    local,
    actionId: actionStep.action
  };
}

function motionOffset(motion, local, now, seed) {
  const slow = now / 1000 + seed.length * 0.31;
  if (REDUCED_MOTION) return { x: 0, y: 0, scale: 1 };
  switch (motion) {
    case "enter_slide":
      return { x: 0, y: -Math.sin(local * Math.PI) * 18, scale: 0.88 + ease(local) * 0.12 };
    case "hop_arc":
      return { x: 0, y: -Math.sin(local * Math.PI) * 46, scale: 1 + Math.sin(local * Math.PI) * 0.05 };
    case "tiny_sway":
      return { x: Math.sin(slow * 6) * 5, y: Math.sin(slow * 9) * 3, scale: 1 };
    case "lean_in":
      return { x: Math.sin(local * Math.PI) * 12, y: Math.sin(local * Math.PI) * 5, scale: 1.02 };
    case "scan":
      return { x: Math.sin(slow * 5) * 6, y: Math.cos(slow * 4) * 2, scale: 1.01 };
    case "sort_bob":
      return { x: Math.sin(slow * 9) * 8, y: Math.abs(Math.sin(slow * 11)) * -5, scale: 1 };
    case "walk_bob":
      return { x: Math.sin(slow * 14) * 3, y: Math.abs(Math.sin(slow * 14)) * -7, scale: 1 };
    case "workbench_bounce":
      return { x: Math.sin(slow * 18) * 5, y: Math.sin(slow * 24) * 4, scale: 1 };
    case "test_shake":
      return { x: Math.sin(slow * 34) * 4, y: Math.sin(slow * 28) * 3, scale: 1 + Math.sin(slow * 18) * 0.02 };
    case "proud_reveal":
      return { x: 0, y: Math.sin(local * Math.PI) * -18, scale: 1 + Math.sin(local * Math.PI) * 0.08 };
    case "celebrate":
      return { x: Math.sin(slow * 10) * 5, y: -Math.abs(Math.sin(slow * 8)) * 13, scale: 1.04 };
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

function fadeIn(t, start, duration = 700) {
  return clamp((t - start) / duration, 0, 1);
}

function fadeOut(t, start, duration = 700) {
  return 1 - clamp((t - start) / duration, 0, 1);
}

function drawProblemPile(t) {
  const story = state.scene.story || {};
  const start = story.problemAt || 0;
  const alpha = fadeIn(t, start, 500) * fadeOut(t, 13400, 1600);
  if (alpha <= 0) return;

  const x = state.width * 0.45;
  const y = state.height * 0.64;
  CTX.globalAlpha = alpha;
  drawPixelRect(x - 82, y - 18, 38, 30, "#f2e7c9");
  drawPixelRect(x - 77, y - 12, 28, 4, "#6e7f9e");
  drawPixelRect(x - 76, y - 2, 22, 4, "#c9594a");
  drawPixelRect(x - 26, y - 26, 22, 22, "#d9a34c");
  drawPixelRect(x - 20, y - 20, 10, 10, "#7a5828");
  drawPixelRect(x + 14, y - 16, 36, 24, "#8fb7ff");
  drawPixelRect(x + 20, y - 10, 8, 8, "#f2e7c9");
  drawPixelRect(x + 34, y - 10, 8, 8, "#f2e7c9");
  drawPixelRect(x + 66, y - 8, 18, 18, "#d65f5a");
  drawPixelRect(x + 72, y - 2, 6, 6, "#f5d1bf");
  CTX.globalAlpha = alpha * (0.4 + Math.sin(performance.now() / 180) * 0.16);
  drawPixelRect(x - 4, y - 46, 8, 8, "#ffe19a");
  CTX.globalAlpha = 1;
}

function drawBlueprint(t) {
  const story = state.scene.story || {};
  const alpha = fadeIn(t, story.blueprintAt || 5600, 700) * fadeOut(t, 13800, 1300);
  if (alpha <= 0) return;

  const x = state.width * 0.55;
  const y = state.height * 0.57;
  CTX.globalAlpha = alpha;
  drawPixelRect(x - 68, y - 36, 136, 72, "#224e7a");
  drawPixelRect(x - 60, y - 28, 120, 56, "#8fc7ff");
  for (let gx = -48; gx <= 48; gx += 24) drawPixelRect(x + gx, y - 28, 2, 56, "#4f8ab9");
  for (let gy = -18; gy <= 18; gy += 18) drawPixelRect(x - 60, y + gy, 120, 2, "#4f8ab9");
  drawPixelRect(x - 34, y - 8, 28, 16, "#f3ead2");
  drawPixelRect(x + 18, y - 14, 24, 30, "#d9a34c");
  drawPixelRect(x - 2, y + 16, 58, 4, "#23435f");
  CTX.globalAlpha = 1;
}

function drawTestMachine(t, now) {
  const story = state.scene.story || {};
  const alpha = fadeIn(t, story.machineAt || 10400, 650) * fadeOut(t, 23600, 2200);
  if (alpha <= 0) return;

  const x = state.width * 0.5;
  const y = state.height * 0.64;
  const testing = t >= (story.testAt || 14200) && t < (state.scene.artifact?.revealAt || 17600);
  CTX.globalAlpha = alpha;
  drawPixelRect(x - 72, y - 34, 144, 52, "#242f3f");
  drawPixelRect(x - 62, y - 24, 46, 32, "#40516a");
  drawPixelRect(x + 20, y - 22, 40, 28, testing ? "#d65f5a" : "#617087");
  drawPixelRect(x - 8, y - 8, 16, 16, "#d9a34c");
  drawPixelRect(x + 28, y - 14, 24, 6, testing ? "#ffe19a" : "#75d67d");
  drawPixelRect(x - 48, y + 18, 16, 28, "#1a202b");
  drawPixelRect(x + 44, y + 18, 16, 28, "#1a202b");
  if (testing) {
    drawSparks(x + Math.sin(now / 110) * 12, y - 34, now, 8);
  }
  CTX.globalAlpha = 1;
}

function drawNextSignal(t, now) {
  const story = state.scene.story || {};
  const alpha = fadeIn(t, story.nextSignalAt || 23800, 900);
  if (alpha <= 0) return;

  const x = state.width * 0.83;
  const y = state.height * 0.52;
  const pulse = (Math.sin(now / 220) + 1) / 2;
  CTX.globalAlpha = alpha;
  drawPixelRect(x - 18, y + 30, 36, 10, "#3d2f34");
  drawPixelRect(x - 4, y - 6, 8, 38, "#8fb7ff");
  drawPixelRect(x - 18, y - 18, 36, 16, "#f3ead2");
  CTX.globalAlpha = alpha * (0.24 + pulse * 0.32);
  CTX.beginPath();
  CTX.arc(x, y - 10, 42 + pulse * 20, 0, Math.PI * 2);
  CTX.fillStyle = "#8fc7ff";
  CTX.fill();
  CTX.globalAlpha = 1;
}

function drawStoryProps(now) {
  const t = sceneTime(now);
  drawProblemPile(t);
  drawBlueprint(t);
  drawTestMachine(t, now);
  drawNextSignal(t, now);
}

function drawNudge(now) {
  if (now >= state.nudge.until) return;
  const alpha = clamp((state.nudge.until - now) / 900, 0, 1);
  const age = now - state.nudge.startedAt;
  const phase = state.nudge.phase;
  const focusArtifact = phase === "artifact_focus";
  const x = focusArtifact ? state.artifact.x + state.artifact.w / 2 : state.nudge.x;
  const y = focusArtifact ? state.artifact.y + state.artifact.h / 2 : state.nudge.y;
  const radius = 18 + age / 18;

  CTX.save();
  CTX.globalAlpha = alpha * 0.56;
  CTX.strokeStyle = focusArtifact ? "#ffe19a" : "#8fc7ff";
  CTX.lineWidth = 4;
  CTX.beginPath();
  CTX.arc(x, y, radius, 0, Math.PI * 2);
  CTX.stroke();
  CTX.globalAlpha = alpha;
  for (let i = 0; i < 7; i += 1) {
    const angle = age / 150 + i * 0.9;
    drawPixelRect(x + Math.cos(angle) * (radius + 12), y + Math.sin(angle) * (radius * 0.4 + 8), 4, 4, focusArtifact ? "#ffe19a" : "#8fc7ff");
  }
  CTX.restore();
}

function drawArtifact(now) {
  const revealAt = state.scene.artifact.revealAt || 9400;
  const t = sceneTime(now);
  const hideAt = state.scene.artifact.hideAt || sceneLength() - 1000;
  const ready = t >= revealAt && t <= hideAt;
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
    if (t > 10400 && t < revealAt) {
      CTX.globalAlpha = clamp((t - 10400) / 3800, 0, 0.9);
      drawSparks(x, y, now, 10);
      CTX.globalAlpha = 1;
    }
    return;
  }

  trackOnce("pixel_artifact_reveal", "pixel_artifact_reveal", eventParams({ transition_type: state.experiment?.transition || "artifact_click" }));
  const focused = now < state.nudge.until && state.nudge.phase === "artifact_focus";
  const glow = 0.18 + state.artifact.pulse * 0.16 + (focused ? 0.22 : 0);
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
  const { character, pose, x, y, scale, opacity } = snapshot;
  const image = frameFor(character, pose);
  if (!image) return;
  const size = 224 * scale;
  const anchor = character.anchor || { x: 0.5, y: 0.88 };
  const drawX = Math.round(x - size * anchor.x);
  const drawY = Math.round(y - size * anchor.y);

  CTX.save();
  CTX.globalAlpha = 0.35 * opacity;
  CTX.fillStyle = "#07090d";
  CTX.beginPath();
  CTX.ellipse(Math.round(x), Math.round(y + 5), Math.max(22, size * 0.25), Math.max(5, size * 0.055), 0, 0, Math.PI * 2);
  CTX.fill();
  CTX.globalAlpha = opacity;
  CTX.drawImage(image, drawX, drawY, Math.round(size), Math.round(size));

  const dx = state.pointer.x - x;
  const dy = state.pointer.y - (y - size * 0.45);
  const close = state.pointer.active && Math.sqrt(dx * dx + dy * dy) < size * 0.65;
  if (close) {
    CTX.globalAlpha = 0.75 * opacity;
    drawPixelRect(x - 5, drawY - 12 + Math.sin(performance.now() / 120) * 3, 10, 10, "#ffe19a");
  }
  CTX.restore();
}

function drawMiniUser(x, y, color, signal) {
  drawPixelRect(x - 6, y - 18, 12, 12, color);
  drawPixelRect(x - 8, y - 6, 16, 18, "#263445");
  drawPixelRect(x - 10, y + 12, 6, 12, "#101722");
  drawPixelRect(x + 4, y + 12, 6, 12, "#101722");
  if (signal === "star") {
    drawPixelRect(x + 12, y - 24, 6, 6, "#ffe19a");
    drawPixelRect(x + 14, y - 28, 2, 14, "#ffe19a");
    drawPixelRect(x + 8, y - 22, 14, 2, "#ffe19a");
  } else if (signal === "coin") {
    drawPixelRect(x + 12, y - 22, 12, 12, "#d9a34c");
    drawPixelRect(x + 16, y - 18, 4, 4, "#7a5828");
  }
}

function miniUserSnapshots(now) {
  const t = sceneTime(now);
  const feedbackAt = state.scene.story?.feedbackAt || 19600;
  const alpha = fadeIn(t, feedbackAt, 700) * fadeOut(t, 26300, 1000);
  if (alpha <= 0) return [];

  const baseY = state.height * 0.82;
  const destinations = [
    { start: -26, x: state.width * 0.43, color: "#8fc7ff", signal: "star", delay: 0 },
    { start: state.width + 24, x: state.width * 0.54, color: "#f3ead2", signal: "coin", delay: 520 },
    { start: state.width * 0.5, x: state.width * 0.49, color: "#75d67d", signal: "none", delay: 980 }
  ];
  return destinations.map((item) => {
    const local = ease(clamp((t - feedbackAt - item.delay) / 1600, 0, 1));
    return {
      x: item.start + (item.x - item.start) * local,
      y: baseY + Math.sin((now + item.delay) / 180) * 3,
      color: item.color,
      signal: item.signal,
      alpha
    };
  });
}

function drawMiniUsers(now) {
  const snapshots = miniUserSnapshots(now);
  if (!snapshots.length) return;

  CTX.globalAlpha = snapshots[0].alpha;
  for (const item of snapshots) drawMiniUser(item.x, item.y, item.color, item.signal);
  CTX.globalAlpha = 1;
}

function miniUserContains(point, now) {
  const targets = state.experiment?.transitionTargets || [];
  if (!targets.includes("mini_user_signal")) return false;
  return miniUserSnapshots(now).some((user) => {
    const dx = point.x - user.x;
    const dy = point.y - user.y;
    return Math.sqrt(dx * dx + dy * dy) < 32;
  });
}

function trackStoryProgress(now) {
  const t = sceneTime(now);
  const story = state.scene?.story || {};
  if (t >= (story.problemAt || 0)) {
    trackOnce("pixel_problem_seen", "pixel_problem_seen", eventParams());
  }
  for (const actor of state.actors) {
    const visibleFrom = actor.visibleFrom ?? actor.timeline?.[0]?.at ?? 0;
    if (t >= visibleFrom) {
      trackOnce(`pixel_actor_enter:${actor.character}`, "pixel_actor_enter", eventParams({
        character: actor.character,
        actor_role: actor.role || ""
      }));
    }
  }
  if (t >= (story.nextSignalAt || sceneLength() - 1800)) {
    trackOnce("pixel_scene_complete", "pixel_scene_complete", eventParams());
  }
}

function render(now) {
  trackStoryProgress(now);
  drawBackground(now);
  drawStoryProps(now);
  drawArtifact(now);
  drawNudge(now);
  const snapshots = state.actors
    .map((actor) => actorSnapshot(actor, now))
    .filter(Boolean)
    .sort((a, b) => a.y - b.y);
  for (const snapshot of snapshots) drawCharacter(snapshot);
  drawMiniUsers(now);
  requestAnimationFrame(render);
}

function startRender() {
  if (state.renderStarted) return;
  state.renderStarted = true;
  requestAnimationFrame(render);
}

function nearestActor(x, y, now) {
  let best = null;
  let bestDistance = Infinity;
  for (const actor of state.actors) {
    const snap = actorSnapshot(actor, now);
    if (!snap) continue;
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
  const now = performance.now();
  state.pointer = { ...point, active: true };
  if (artifactContains(point)) {
    transitionToProduct("artifact_click");
    return;
  }
  if (miniUserContains(point, now)) {
    transitionToProduct("mini_user_signal");
    return;
  }
  const actor = nearestActor(point.x, point.y, now);
  if (actor) {
    state.poke.set(actor.character, now + 1150);
    const action = Math.random() > 0.5 ? "character_poke" : "character_hop";
    track(action, eventParams({ character: actor.character }));
    return;
  }
  nudgeWorld(point, now);
}

async function boot() {
  resize();
  drawBackground(performance.now());
  window.addEventListener("resize", resize);
  CANVAS.addEventListener("pointermove", onPointerMove);
  CANVAS.addEventListener("pointerleave", onPointerLeave);
  CANVAS.addEventListener("pointerdown", onPointerDown);
  EXIT.addEventListener("click", () => track("product_exit", eventParams({ transition_type: "artifact_link" })));

  const [characterData, actionData, sceneData, experimentData] = await Promise.all([
    readJson("/assets/pixel-world/characters.json"),
    readJson("/assets/pixel-world/actions.json"),
    readJson("/assets/pixel-world/scenes.json"),
    readJson("/assets/pixel-world/experiments.json")
  ]);
  state.actions = actionData.actions || {};
  state.experiment = selectHypothesis(experimentData, sceneData);
  state.scene = (sceneData.scenes || []).find((scene) => scene.id === state.experiment.sceneId) ||
    (sceneData.scenes || []).find((scene) => scene.id === sceneData.defaultScene) ||
    sceneData.scenes[0];
  state.actors = state.scene.actors || [];
  EXIT.href = transitionTargetUrl();
  state.characters = (characterData.characters || []).map((character) => ({ ...character, loadedFrames: {} }));
  startRender();
  for (const character of state.characters) {
    for (const [pose, src] of Object.entries(character.frames || {})) {
      loadImage(src).then((image) => {
        character.loadedFrames[pose] = image;
      }).catch((error) => {
        console.error(error);
      });
    }
  }
  trackOnce("pixel_world_view", "pixel_world_view", eventParams());
  trackOnce("pixel_scene_start", "pixel_scene_start", eventParams({ transition_type: state.experiment.transition || "artifact_click" }));
}

boot().catch((error) => {
  ROOT.classList.add("pixel-world-failed");
  console.error(error);
});
