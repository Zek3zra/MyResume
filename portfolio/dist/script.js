document.getElementById('year').textContent = new Date().getFullYear();

const siteHeader = document.querySelector('.header');
const navigationToggle = document.querySelector('.nav-toggle');
const siteNavigation = document.getElementById('site-navigation');
function setNavigationOpen(open) {
  siteHeader.classList.toggle('menu-open', open);
  navigationToggle.setAttribute('aria-expanded', String(open));
  navigationToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
navigationToggle.addEventListener('click', () => setNavigationOpen(navigationToggle.getAttribute('aria-expanded') !== 'true'));
siteNavigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) setNavigationOpen(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && siteHeader.classList.contains('menu-open')) {
    setNavigationOpen(false);
    navigationToggle.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!siteHeader.contains(event.target)) setNavigationOpen(false);
});
window.matchMedia('(min-width: 1101px)').addEventListener('change', (event) => {
  if (event.matches) setNavigationOpen(false);
});

const previewDialog = document.getElementById('image-dialog');
const previewImage = document.getElementById('preview-image');
const previewTitle = document.getElementById('image-dialog-title');
let previewTrigger;

const previewStage = document.getElementById('preview-stage');
const previewZoomIn = document.getElementById('preview-zoom-in');
const previewZoomOut = document.getElementById('preview-zoom-out');
const previewZoomLevel = document.getElementById('preview-zoom-level');
let previewScale = 1;
let previewPan = { x: 0, y: 0 };
const previewPointers = new Map();

function renderPreviewTransform() {
  const width = previewStage.clientWidth;
  const height = previewStage.clientHeight;
  const imageStyle = getComputedStyle(previewImage);
  const availableWidth = Math.max(0, width - parseFloat(imageStyle.paddingLeft) - parseFloat(imageStyle.paddingRight));
  const availableHeight = Math.max(0, height - parseFloat(imageStyle.paddingTop) - parseFloat(imageStyle.paddingBottom));
  const fit = previewImage.naturalWidth && previewImage.naturalHeight ? Math.min(availableWidth / previewImage.naturalWidth, availableHeight / previewImage.naturalHeight) : 0;
  const limitX = Math.max(0, (previewImage.naturalWidth * fit * previewScale - width) / 2);
  const limitY = Math.max(0, (previewImage.naturalHeight * fit * previewScale - height) / 2);
  previewPan.x = Math.max(-limitX, Math.min(limitX, previewPan.x));
  previewPan.y = Math.max(-limitY, Math.min(limitY, previewPan.y));
  previewImage.style.transform = `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewScale})`;
  previewStage.classList.toggle('is-zoomed', previewScale > 1);
  previewZoomIn.disabled = previewScale >= 5;
  previewZoomOut.disabled = previewScale <= 1;
  const label = `${Math.round(previewScale * 100)}%`;
  if (previewZoomLevel.textContent !== label) previewZoomLevel.textContent = label;
}
function resetPreviewZoom() {
  previewScale = 1;
  previewPan = { x: 0, y: 0 };
  previewPointers.clear();
  previewStage.classList.remove('is-dragging');
  renderPreviewTransform();
}
function zoomPreview(scale, anchor = { x: 0, y: 0 }) {
  const next = Math.max(1, Math.min(5, scale));
  const ratio = next / previewScale;
  previewPan.x = anchor.x - (anchor.x - previewPan.x) * ratio;
  previewPan.y = anchor.y - (anchor.y - previewPan.y) * ratio;
  previewScale = next;
  if (next === 1) previewPan = { x: 0, y: 0 };
  renderPreviewTransform();
}
function previewAnchor(point) {
  const bounds = previewStage.getBoundingClientRect();
  return { x: point.x - bounds.left - bounds.width / 2, y: point.y - bounds.top - bounds.height / 2 };
}
previewZoomIn.addEventListener('click', () => zoomPreview(previewScale + .25));
previewZoomOut.addEventListener('click', () => zoomPreview(previewScale - .25));
document.getElementById('preview-fit').addEventListener('click', resetPreviewZoom);
previewImage.addEventListener('load', renderPreviewTransform);
new ResizeObserver(renderPreviewTransform).observe(previewStage);
previewStage.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomPreview(previewScale * Math.exp(-event.deltaY * .002), previewAnchor({ x: event.clientX, y: event.clientY }));
}, { passive: false });
previewStage.addEventListener('dblclick', (event) => {
  zoomPreview(previewScale > 1 ? 1 : 2, previewAnchor({ x: event.clientX, y: event.clientY }));
});
previewStage.addEventListener('pointerdown', (event) => {
  if ((event.pointerType === 'mouse' && event.button !== 0) || previewPointers.size >= 2) return;
  event.preventDefault();
  previewStage.focus({ preventScroll: true });
  previewPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  previewStage.setPointerCapture(event.pointerId);
  previewStage.classList.toggle('is-dragging', previewScale > 1);
});
previewStage.addEventListener('pointermove', (event) => {
  const previous = previewPointers.get(event.pointerId);
  if (!previous) return;
  const before = [...previewPointers.values()];
  const current = { x: event.clientX, y: event.clientY };
  previewPointers.set(event.pointerId, current);
  if (previewPointers.size === 2) {
    const after = [...previewPointers.values()];
    const distance = (points) => Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    const center = (points) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
    const oldCenter = center(before);
    const newCenter = center(after);
    const oldDistance = distance(before);
    if (oldDistance > 0) zoomPreview(previewScale * distance(after) / oldDistance, previewAnchor(oldCenter));
    previewPan.x += newCenter.x - oldCenter.x;
    previewPan.y += newCenter.y - oldCenter.y;
  } else if (previewScale > 1) {
    previewPan.x += current.x - previous.x;
    previewPan.y += current.y - previous.y;
  }
  renderPreviewTransform();
  previewStage.classList.toggle('is-dragging', previewScale > 1);
});
function releasePreviewPointer(event) {
  previewPointers.delete(event.pointerId);
  if (!previewPointers.size) previewStage.classList.remove('is-dragging');
}
previewStage.addEventListener('pointerup', releasePreviewPointer);
previewStage.addEventListener('pointercancel', releasePreviewPointer);
previewStage.addEventListener('lostpointercapture', releasePreviewPointer);
previewDialog.addEventListener('keydown', (event) => {
  if (event.key === '+' || event.key === '=') zoomPreview(previewScale + .25);
  else if (event.key === '-') zoomPreview(previewScale - .25);
  else if (event.key === '0') resetPreviewZoom();
  else if (previewScale > 1 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    previewPan.x += event.key === 'ArrowLeft' ? 40 : event.key === 'ArrowRight' ? -40 : 0;
    previewPan.y += event.key === 'ArrowUp' ? 40 : event.key === 'ArrowDown' ? -40 : 0;
    renderPreviewTransform();
  } else return;
  event.preventDefault();
});


function openImagePreview(button, trigger = button) {
  previewTrigger = trigger;
  previewImage.src = button.dataset.preview;
  previewImage.alt = button.querySelector('img').alt;
  previewTitle.textContent = button.dataset.title;
  previewDialog.showModal();
  resetPreviewZoom();
  document.body.classList.add('preview-open');
}
document.querySelectorAll('[data-preview]').forEach((button) => {
  button.addEventListener('click', () => openImagePreview(button));
});

document.getElementById('close-preview').addEventListener('click', () => previewDialog.close());
previewDialog.addEventListener('click', (event) => {
  if (event.target === previewDialog) {
    const bounds = previewDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) previewDialog.close();
  }
});
previewDialog.addEventListener('close', () => {
  document.body.classList.remove('preview-open');
  resetPreviewZoom();
  previewImage.removeAttribute('src');
  previewTrigger?.focus({ preventScroll: true });
});

const contributionEndpoint = 'https://github-contributions-api.jogruber.de/v4/Zek3zra?y=last';
const contributionStatus = document.getElementById('contribution-status');
const contributionTotal = document.getElementById('contribution-total');
const contributionChart = document.getElementById('contribution-chart');
const contributionWeeks = document.getElementById('contribution-weeks');
const contributionMonths = document.getElementById('contribution-months');
const contributionDetail = document.getElementById('contribution-detail');
const refreshContributions = document.getElementById('refresh-contributions');
const dayMilliseconds = 24 * 60 * 60 * 1000;
const refreshInterval = 5 * 60 * 1000;
const contributionDateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
let contributionsLoading = false;
let lastContributionCheck = 0;
const contributionScroll = document.querySelector('.contribution-scroll');
function showLatestMobileContributions() {
  if (window.matchMedia('(max-width: 680px)').matches && !contributionChart.hidden) {
    requestAnimationFrame(() => { contributionScroll.scrollLeft = contributionScroll.scrollWidth; });
  }
}
window.addEventListener('resize', showLatestMobileContributions, {passive: true});

function contributionDescription(day) {
  return `${day.count} ${day.count === 1 ? 'contribution' : 'contributions'} on ${contributionDateFormat.format(new Date(`${day.date}T00:00:00Z`))}`;
}

function renderContributions(payload) {
  if (!Array.isArray(payload.contributions) || !payload.contributions.length) throw new Error('No contribution data');
  const days = [...payload.contributions].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const dates = new Set();
  days.forEach((day) => {
    const parsed = new Date(`${day.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day.date || !Number.isInteger(day.count) || day.count < 0 || !Number.isInteger(day.level) || day.level < 0 || day.level > 4 || dates.has(day.date)) throw new Error('Invalid contribution data');
    dates.add(day.date);
  });
  const firstDate = new Date(`${days[0].date}T00:00:00Z`);
  const start = firstDate.getTime() - firstDate.getUTCDay() * dayMilliseconds;
  const lastDate = new Date(`${days.at(-1).date}T00:00:00Z`);
  const weekCount = Math.floor((lastDate.getTime() - start) / (7 * dayMilliseconds)) + 1;
  if (weekCount > 54) throw new Error('Unexpected date range');
  const focusedDate = contributionWeeks.contains(document.activeElement) ? document.activeElement.dataset.date : null;
  const previousTabDate = contributionWeeks.querySelector('[tabindex="0"]')?.dataset.date;
  contributionChart.querySelector('.contribution-calendar').style.setProperty('--week-count', weekCount);
  const cellFragment = document.createDocumentFragment();
  const monthFragment = document.createDocumentFragment();
  let previousMonth;
  days.forEach((day, index) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const week = Math.floor((date.getTime() - start) / (7 * dayMilliseconds));
    const month = date.getUTCMonth();
    if (month !== previousMonth) {
      if (week <= weekCount - 3) {
        const label = document.createElement('span');
        label.textContent = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(date);
        label.style.gridColumn = week + 1;
        monthFragment.append(label);
      }
      previousMonth = month;
    }
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'contribution-day';
    cell.dataset.level = day.level;
    cell.dataset.date = day.date;
    cell.dataset.index = index;
    cell.title = contributionDescription(day);
    cell.setAttribute('aria-label', cell.title);
    cell.tabIndex = -1;
    cell.style.gridColumn = week + 1;
    cell.style.gridRow = date.getUTCDay() + 1;
    cellFragment.append(cell);
  });
  contributionWeeks.replaceChildren(cellFragment);
  contributionMonths.replaceChildren(monthFragment);
  const activeDate = focusedDate || previousTabDate;
  const activeCell = [...contributionWeeks.children].find(cell => cell.dataset.date === activeDate) || contributionWeeks.lastElementChild;
  activeCell.tabIndex = 0;
  contributionTotal.textContent = `${days.reduce((sum, day) => sum + day.count, 0).toLocaleString()} contributions in the last year`;
  contributionDetail.textContent = activeCell.title;
  contributionChart.hidden = false;
  if (focusedDate) activeCell.focus({ preventScroll: true });
  else showLatestMobileContributions();
}

async function loadContributions() {
  if (contributionsLoading) return;
  contributionsLoading = true;
  refreshContributions.disabled = true;
  refreshContributions.textContent = 'Refreshing…';
  contributionWeeks.setAttribute('aria-busy', 'true');
  contributionStatus.textContent = contributionChart.hidden ? 'Loading GitHub activity…' : 'Checking for new activity…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(contributionEndpoint, { signal: controller.signal, credentials: 'omit' });
    if (!response.ok) throw new Error('Contribution feed unavailable');
    renderContributions(await response.json());
    const checkedTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date());
    contributionStatus.textContent = `Last checked at ${checkedTime}.`;
  } catch {
    contributionStatus.textContent = contributionChart.hidden ? 'GitHub activity is temporarily unavailable. Try Refresh or visit my GitHub profile.' : 'Could not refresh activity. The calendar shows the last loaded data; try again shortly.';
  } finally {
    clearTimeout(timeout);
    contributionsLoading = false;
    lastContributionCheck = Date.now();
    refreshContributions.disabled = false;
    refreshContributions.textContent = 'Refresh';
    contributionWeeks.removeAttribute('aria-busy');
  }
}

function showContributionDetail(event) {
  const cell = event.target.closest('.contribution-day');
  if (!cell) return;
  contributionDetail.textContent = cell.title;
  if (event.type === 'focusin') {
    contributionWeeks.querySelector('[tabindex="0"]')?.setAttribute('tabindex', '-1');
    cell.tabIndex = 0;
  }
}
contributionWeeks.addEventListener('pointerover', showContributionDetail);
contributionWeeks.addEventListener('focusin', showContributionDetail);
contributionWeeks.addEventListener('click', showContributionDetail);
contributionWeeks.addEventListener('keydown', (event) => {
  const cell = event.target.closest('.contribution-day');
  if (!cell) return;
  const cells = contributionWeeks.children;
  const index = Number(cell.dataset.index);
  const moves = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
  let next;
  if (Object.hasOwn(moves, event.key)) next = Math.max(0, Math.min(cells.length - 1, index + moves[event.key]));
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = cells.length - 1;
  else return;
  event.preventDefault();
  cells[next].focus();
});
refreshContributions.addEventListener('click', loadContributions);
loadContributions();
setInterval(() => {
  if (document.visibilityState === 'visible') loadContributions();
}, refreshInterval);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && Date.now() - lastContributionCheck >= refreshInterval) loadContributions();
});


// Compact, touch-friendly electronics decks on phones; full galleries elsewhere.
const electronicsSection = document.getElementById('electronics');
const electronicsMobile = window.matchMedia('(max-width: 680px)');
const electronicsCategories = [...electronicsSection.querySelectorAll('.electronics-category')];
const electronicsLinks = [...electronicsSection.querySelectorAll('.electronics-category-nav a')];
let selectedElectronicsCategory = electronicsCategories[0];
const electronicsDecks = electronicsCategories.map((category) => {
  const gallery = category.querySelector('.electronics-gallery');
  const cards = [...gallery.querySelectorAll('.electronics-tile')];
  const controls = document.createElement('div');
  controls.className = 'electronics-deck-controls';
  const previous = document.createElement('button');
  previous.type = 'button';
  previous.textContent = '←';
  previous.setAttribute('aria-label', 'Previous image in ' + category.querySelector('h3').textContent);
  const status = document.createElement('p');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = '→';
  next.setAttribute('aria-label', 'Next image in ' + category.querySelector('h3').textContent);
  controls.append(previous, status, next);
  gallery.after(controls);
  const deck = { gallery, cards, status, index: 0 };
  function showCard(index) {
    deck.index = (index + cards.length) % cards.length;
    cards.forEach((card, i) => {
      const active = i === deck.index;
      card.classList.toggle('is-front-card', active);
      card.classList.toggle('is-next-card', i === (deck.index + 1) % cards.length && !active);
      card.classList.toggle('is-previous-card', cards.length > 2 && i === (deck.index - 1 + cards.length) % cards.length && !active);
      if (electronicsMobile.matches && !active) card.setAttribute('aria-hidden', 'true');
      else card.removeAttribute('aria-hidden');
      card.querySelector('[data-preview]').tabIndex = electronicsMobile.matches && !active ? -1 : 0;
    });
    status.textContent = `${deck.index + 1} / ${cards.length} · ${cards[deck.index].querySelector('h4').textContent}`;
  }
  deck.showCard = showCard;
  previous.addEventListener('click', () => showCard(deck.index - 1));
  next.addEventListener('click', () => showCard(deck.index + 1));
  let pointerStart;
  let suppressClickUntil = 0;
  gallery.addEventListener('pointerdown', (event) => {
    if (electronicsMobile.matches && event.pointerType !== 'mouse') pointerStart = { x: event.clientX, y: event.clientY };
  });
  gallery.addEventListener('pointercancel', () => { pointerStart = null; });
  gallery.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      showCard(deck.index + (dx < 0 ? 1 : -1));
      suppressClickUntil = Date.now() + 400;
    }
  });
  gallery.addEventListener('click', (event) => {
    if (!electronicsMobile.matches) return;
    const card = event.target.closest('.electronics-tile');
    if (!card) return;
    if (Date.now() < suppressClickUntil || !card.classList.contains('is-front-card')) {
      event.preventDefault();
      event.stopPropagation();
      if (Date.now() >= suppressClickUntil) showCard(cards.indexOf(card));
    }
  }, true);
  showCard(0);
  return deck;
});
function selectElectronicsCategory(category) {
  selectedElectronicsCategory = category;
  electronicsCategories.forEach((item) => item.classList.toggle('is-selected-category', item === category));
  electronicsLinks.forEach((link) => {
    if (link.hash === '#' + category.id) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}
function syncElectronicsDecks() {
  const target = document.getElementById(location.hash.slice(1));
  const category = target?.closest('.electronics-category');
  selectElectronicsCategory(category || selectedElectronicsCategory);
  electronicsDecks.forEach((deck) => deck.showCard(deck.index));
}
electronicsLinks.forEach((link) => link.addEventListener('click', () => selectElectronicsCategory(document.getElementById(link.hash.slice(1)))));
electronicsMobile.addEventListener('change', syncElectronicsDecks);
window.addEventListener('hashchange', syncElectronicsDecks);
syncElectronicsDecks();
electronicsSection.classList.add('electronics-decks-ready');


const electronicsFlipCards = [...electronicsSection.querySelectorAll('.electronics-tile')].map((card, index) => {
  const preview = card.querySelector('[data-preview]');
  const caption = card.querySelector('figcaption');
  caption.id = 'electronics-card-details-' + index;
  const front = document.createElement('div');
  front.className = 'electronics-card-front';
  const title = document.createElement('div');
  title.className = 'electronics-card-title';
  title.append(caption.querySelector('.meta-label').cloneNode(true), caption.querySelector('h4').cloneNode(true));
  card.prepend(front);
  front.append(preview, title);
  const actions = document.createElement('div');
  actions.className = 'electronics-card-actions';
  const back = document.createElement('button');
  back.type = 'button';
  back.textContent = 'Back to image';
  const enlarge = document.createElement('button');
  enlarge.type = 'button';
  enlarge.textContent = 'Enlarge image';
  enlarge.setAttribute('aria-label', 'Enlarge ' + preview.dataset.title);
  actions.append(back, enlarge);
  caption.append(actions);
  function setFlipped(flipped, moveFocus = false) {
    flipped = flipped && !electronicsMobile.matches;
    card.classList.toggle('is-flipped', flipped);
    front.inert = flipped;
    caption.inert = !electronicsMobile.matches && !flipped;
    if (electronicsMobile.matches) {
      preview.removeAttribute('aria-expanded');
      preview.removeAttribute('aria-controls');
      preview.setAttribute('aria-label', 'Enlarge ' + preview.dataset.title);
      preview.querySelector('.preview-label').textContent = 'Enlarge image';
    } else {
      preview.setAttribute('aria-expanded', String(flipped));
      preview.setAttribute('aria-controls', caption.id);
      preview.setAttribute('aria-label', 'Show details for ' + preview.dataset.title);
      preview.querySelector('.preview-label').textContent = 'View details';
    }
    if (moveFocus) (flipped ? back : preview).focus({preventScroll: true});
  }
  front.addEventListener('click', (event) => {
    if (electronicsMobile.matches) return;
    event.preventDefault();
    event.stopPropagation();
    setFlipped(true, true);
  }, true);
  back.addEventListener('click', () => setFlipped(false, true));
  caption.addEventListener('click', (event) => {
    if (!electronicsMobile.matches && !event.target.closest('button, a')) setFlipped(false, true);
  });
  caption.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !electronicsMobile.matches) {
      event.preventDefault();
      setFlipped(false, true);
    }
  });
  enlarge.addEventListener('click', () => openImagePreview(preview, enlarge));
  setFlipped(false);
  return {reset: () => setFlipped(false)};
});
electronicsMobile.addEventListener('change', () => {
  electronicsFlipCards.forEach((card) => card.reset());
});
electronicsSection.classList.add('electronics-flips-ready');


// Native swipe galleries keep the thesis photos compact on phones.
const thesisMobile = window.matchMedia('(max-width: 680px)');
const thesisGalleries = [...document.querySelectorAll('.thesis-gallery')].map((gallery) => {
  const cards = [...gallery.querySelectorAll('.thesis-card')];
  const groupTitle = gallery.closest('.thesis-gallery-group').querySelector('h3').textContent;
  const controls = document.createElement('div');
  controls.className = 'thesis-gallery-controls';
  const previous = document.createElement('button');
  previous.type = 'button';
  previous.textContent = '←';
  previous.setAttribute('aria-label', 'Previous image in ' + groupTitle);
  previous.setAttribute('aria-controls', gallery.id);
  const status = document.createElement('p');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = '→';
  next.setAttribute('aria-label', 'Next image in ' + groupTitle);
  next.setAttribute('aria-controls', gallery.id);
  controls.append(previous, status, next);
  gallery.after(controls);
  let index = 0;
  let scrollFrame;
  function update() {
    if (thesisMobile.matches) {
      index = cards.reduce((best, card, i) => Math.abs(card.offsetLeft - gallery.scrollLeft) < Math.abs(cards[best].offsetLeft - gallery.scrollLeft) ? i : best, 0);
    } else index = 0;
    cards.forEach((card, i) => { card.inert = thesisMobile.matches && i !== index; });
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    status.textContent = `${index + 1} / ${cards.length} · ${cards[index].querySelector('h4').textContent}`;
  }
  function move(step) {
    const target = Math.max(0, Math.min(cards.length - 1, index + step));
    gallery.scrollTo({left: cards[target].offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  gallery.addEventListener('keydown', (event) => {
    if (!thesisMobile.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  gallery.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(update);
  }, {passive: true});
  const observer = new ResizeObserver(update);
  observer.observe(gallery);
  update();
  return {update};
});
thesisMobile.addEventListener('change', () => thesisGalleries.forEach(({update}) => update()));
document.getElementById('thesis').classList.add('thesis-galleries-ready');
