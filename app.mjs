import { LEVELS } from './levels.mjs';
import { initialAngles, rotate, trace, loadProgress, saveProgress } from './core.mjs';

const $ = id => document.getElementById(id);
// Accessing window.localStorage itself may throw in privacy modes.
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const restored = loadProgress(storage, LEVELS);
let progress = restored.progress;
let storageAvailable = restored.available;
let level = LEVELS[progress.current];
let angles = progress.states[level.id] || initialAngles(level);
let history = [];
let hintIndex = null;
let soundEnabled = false;
let audioContext = null;
const mirrorArt = '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="24" fill="#edf1e7"/><path class="mirror-back" d="M20 60 60 20"/><path class="mirror-glass" d="M20 60 60 20"/><path class="mirror-glint" d="M20 57 56 21"/></svg>';
const stoneArt = '<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="51" cy="76" rx="29" ry="8" fill="#b8bba733"/><path d="m22 65 5-28 24-15 26 18 4 26-15 13H38Z" fill="#c3c8b5"/><path d="m27 37 24-15 5 29-34 14Z" fill="#d8dcce"/><path d="m56 51 21-11 4 26-15 13Z" fill="#b4bca7"/><path d="m40 37 9-5" stroke="#edf0e3" stroke-width="3" stroke-linecap="round"/></svg>';

function plantArt(shade = false) {
  const dark = shade ? '#496f66' : '#47794d';
  const light = shade ? '#77998a' : '#91ad69';
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="88" rx="25" ry="5" fill="#40543812"/><path d="m31 62 6 24q13 7 26 0l6-24Z" fill="${shade ? '#bd8f76' : '#c68660'}"/><path d="m33 66 5 20q5 3 11 3V66Z" fill="#db9e7799"/><ellipse cx="50" cy="62" rx="20" ry="5.5" fill="#dfa881"/><ellipse cx="50" cy="61" rx="16" ry="3.5" fill="#826f4f"/><path d="M50 61V30" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><path d="M50 49C28 50 23 37 25 26c18-1 29 10 25 23Z" fill="${dark}"/><path d="M51 37C49 20 60 12 77 14c0 17-11 25-26 23Z" fill="${light}"/><path d="M50 49 31 32m21 4 18-16" stroke="#dce9b866" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`;
}

function announce(message) { $('announcement').textContent = message; }
function persist() {
  progress.states[level.id] = [...angles];
  storageAvailable = saveProgress(storage, progress, LEVELS);
  $('storage-note').textContent = storageAvailable ? '진행 상황은 이 브라우저에만 저장됩니다.' : '이 브라우저에서는 저장할 수 없어요. 현재 화면에서는 계속 플레이할 수 있어요.';
}
function soundNote(won = false) {
  if (!soundEnabled || !audioContext) return;
  const now = audioContext.currentTime;
  const notes = won ? [523.25, 659.25, 783.99] : [440 + (history.length % 4) * 55];
  notes.forEach((frequency, i) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now + i * .09);
    gain.gain.linearRampToValueAtTime(.045, now + i * .09 + .01);
    gain.gain.exponentialRampToValueAtTime(.001, now + i * .09 + .24);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(now + i * .09); oscillator.stop(now + i * .09 + .26);
  });
}
function drawSound() {
  $('sound').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4Z"/>${soundEnabled ? '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>' : '<path d="m16 9 5 6m0-6-5 6"/>'}</svg>`;
  const label = soundEnabled ? '소리 끄기' : '소리 켜기';
  $('sound').setAttribute('aria-label', label); $('sound').title = label;
  $('sound').setAttribute('aria-pressed', String(soundEnabled));
}
function sourcePosition() {
  const frame = $('board-frame');
  const padding = parseFloat(getComputedStyle(frame).paddingLeft);
  const inner = frame.clientWidth - padding * 2;
  const position = coordinate => coordinate < 0 ? padding / 2 : coordinate >= 4 ? frame.clientWidth - padding / 2 : padding + (47 + coordinate * 102) / 400 * inner;
  $('sun-source').style.left = `${position(level.source.x)}px`;
  $('sun-source').style.top = `${position(level.source.y)}px`;
}
function render(focusMirror = null) {
  const result = trace(level, angles);
  if (result.complete && !progress.completed.includes(level.id)) progress.completed.push(level.id);
  $('level-name').textContent = level.name;
  $('level-number').innerHTML = `${String(level.id).padStart(2, '0')} <span class="total">/ 12</span>`;
  $('choose-level').setAttribute('aria-label', `${level.id}번 정원, 12개 중. 정원 선택`);
  $('board').replaceChildren();
  for (let y = 0; y < 4; y += 1) for (let x = 0; x < 4; x += 1) {
    const mirrorIndex = level.mirrors.findIndex(item => item.x === x && item.y === y);
    const plantIndex = level.plants.findIndex(item => item.x === x && item.y === y);
    const shadeIndex = level.shadePlants.findIndex(item => item.x === x && item.y === y);
    const rock = level.rocks.some(item => item.x === x && item.y === y);
    const cell = document.createElement(mirrorIndex >= 0 ? 'button' : 'div');
    cell.className = 'cell';
    if (mirrorIndex >= 0) {
      cell.classList.add('mirror-cell');
      cell.type = 'button'; cell.dataset.mirror = mirrorIndex;
      cell.style.setProperty('--angle', `${angles[mirrorIndex] * 90}deg`);
      cell.setAttribute('aria-label', `${y + 1}행 ${x + 1}열 거울, ${angles[mirrorIndex] === 0 ? '오른쪽 위 방향' : '오른쪽 아래 방향'}. 누르면 회전`);
      if (mirrorIndex === hintIndex) cell.classList.add('hint');
      cell.innerHTML = mirrorArt;
      cell.addEventListener('click', () => {
        history.push([...angles]); angles = rotate(angles, mirrorIndex); hintIndex = null;
        const finished = render(mirrorIndex); soundNote(finished);
        announce(finished ? `정원 ${level.id} 완성. 모든 식물의 빛 조건을 맞췄어요. 다음 정원 버튼을 누르세요.` : `${y + 1}행 ${x + 1}열 거울 회전. 햇빛 화분 ${trace(level, angles).lit.length}개에 빛이 닿아요.`);
      });
      cell.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const backwards = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
        const next = (mirrorIndex + (backwards ? -1 : 1) + level.mirrors.length) % level.mirrors.length;
        $('board').querySelector(`[data-mirror="${next}"]`).focus();
      });
    } else if (plantIndex >= 0 || shadeIndex >= 0) {
      const shade = shadeIndex >= 0;
      const lit = !shade && result.lit.includes(plantIndex);
      const overheated = shade && result.overheated.includes(shadeIndex);
      cell.classList.add('plant-cell');
      if (lit) cell.classList.add('lit');
      if (shade) cell.classList.add('shade');
      if (overheated) cell.classList.add('overheated');
      cell.innerHTML = plantArt(shade) + (!shade ? '<span class="sun-dot" aria-hidden="true"></span>' : '');
      cell.setAttribute('role', 'img');
      cell.setAttribute('aria-label', `${y + 1}행 ${x + 1}열 ${shade ? `그늘 화분, ${overheated ? '직사광선을 피해야 해요' : '편안한 그늘'}` : `햇빛 화분, ${lit ? '햇빛이 닿았어요' : '햇빛을 기다려요'}`}`);
    } else if (rock) {
      cell.classList.add('rock'); cell.innerHTML = stoneArt;
      cell.setAttribute('role', 'img'); cell.setAttribute('aria-label', `${y + 1}행 ${x + 1}열 돌, 빛을 막아요`);
    } else { cell.classList.add('empty'); cell.setAttribute('aria-hidden', 'true'); }
    $('board').append(cell);
  }
  const coordinate = value => value < 0 ? -17 : value >= 4 ? 417 : 47 + value * 102;
  const path = result.segments.map((segment, i) => `${i === 0 ? `M${coordinate(segment.from.x)} ${coordinate(segment.from.y)}` : ''} L${coordinate(segment.to.x)} ${coordinate(segment.to.y)}`).join(' ');
  $('beam').innerHTML = `<path class="beam-halo" d="${path}"/><path class="beam-main" d="${path}"/><path class="beam-core" d="${path}"/>`;
  $('plant-count').textContent = `햇빛 ${result.lit.length} / ${level.plants.length}${level.shadePlants.length ? ` · 그늘 ${level.shadePlants.length - result.overheated.length} / ${level.shadePlants.length}` : ''}`;
  $('plant-count').classList.toggle('warning', result.overheated.length > 0);
  $('move-count').textContent = `이번 방문 ${history.length}번 회전`;
  $('level-note').textContent = hintIndex !== null ? '노란 테두리의 거울을 한 번 돌려 보세요.' : result.overheated.length ? '달 표시 화분은 그늘을 좋아해요. 빛을 다른 쪽으로 보내 주세요.' : level.note;
  $('undo').disabled = history.length === 0;
  $('hint').disabled = result.complete;
  $('success').hidden = !result.complete;
  const isFinal = level.id === LEVELS.length;
  $('success-title').textContent = isFinal ? '정원마다, 꼭 맞는 햇살.' : '햇살이 닿았어요.';
  $('success-copy').textContent = isFinal ? `${progress.completed.length}개의 정원을 완성했어요. 다른 창가도 들러 보세요.` : '오늘의 초록이 조금 더 자랐네요.';
  $('next').innerHTML = isFinal ? '정원 둘러보기 <span aria-hidden="true">▦</span>' : '다음 정원 <span aria-hidden="true">↗</span>';
  sourcePosition(); persist();
  if (focusMirror !== null) $('board').querySelector(`[data-mirror="${focusMirror}"]`)?.focus({ preventScroll: true });
  return result.complete;
}
function goTo(index) {
  progress.current = index; level = LEVELS[index]; angles = progress.states[level.id] || initialAngles(level);
  history = []; hintIndex = null; render();
  announce(`${level.id}번 정원, ${level.name}. ${level.note}`);
}
function showLevels() {
  $('level-list').replaceChildren();
  LEVELS.forEach((item, index) => {
    const done = progress.completed.includes(item.id);
    const button = document.createElement('button');
    button.type = 'button'; button.className = `level-tile${done ? ' done' : ''}${index === progress.current ? ' current' : ''}`;
    button.innerHTML = `${String(item.id).padStart(2, '0')}<small>${done ? '완료 ✓' : item.id >= 10 ? '그늘 식물' : '햇빛 화분'}</small>`;
    button.setAttribute('aria-label', `${item.id}번 ${item.name}${done ? ', 완료' : ''}`);
    button.addEventListener('click', () => { $('level-dialog').close(); goTo(index); $('choose-level').focus(); });
    $('level-list').append(button);
  });
  $('level-dialog').showModal();
}
$('sound').addEventListener('click', async () => {
  if (!soundEnabled) {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('No audio');
      audioContext ||= new Audio(); await audioContext.resume(); soundEnabled = true; soundNote();
    } catch { announce('이 브라우저에서는 소리를 켤 수 없어요. 소리 없이 계속 플레이할 수 있어요.'); return; }
  } else soundEnabled = false;
  drawSound(); announce(soundEnabled ? '소리를 켰어요.' : '소리를 껐어요.');
});
$('undo').addEventListener('click', () => { if (!history.length) return; angles = history.pop(); hintIndex = null; render(); announce('마지막 회전을 되돌렸어요.'); });
$('restart').addEventListener('click', () => { angles = initialAngles(level); history = []; hintIndex = null; render(); announce('이 정원을 처음 상태로 되돌렸어요. 완료 기록은 유지돼요.'); });
$('hint').addEventListener('click', () => { hintIndex = level.mirrors.findIndex((mirror, index) => mirror.solution !== angles[index]); render(); announce('노란 테두리의 거울을 한 번 돌려 보세요.'); if (hintIndex >= 0) $('board').querySelector(`[data-mirror="${hintIndex}"]`).focus(); });
$('next').addEventListener('click', () => { if (progress.current < LEVELS.length - 1) { goTo(progress.current + 1); $('choose-level').focus(); } else showLevels(); });
$('choose-level').addEventListener('click', showLevels);
$('close-dialog').addEventListener('click', () => $('level-dialog').close());
$('level-dialog').addEventListener('click', event => { if (event.target === $('level-dialog')) { const rect = $('level-dialog').getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('level-dialog').close(); } });
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(sourcePosition).observe($('board-frame'));
else window.addEventListener('resize', sourcePosition);
drawSound(); render();
if (!restored.available) $('storage-note').textContent = '이전 저장을 읽지 못해 새 정원으로 시작했어요. 저장이 가능하면 다음 조작부터 기록됩니다.';
