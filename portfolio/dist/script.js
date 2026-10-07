document.getElementById('year').textContent = new Date().getFullYear();

const siteHeader = document.querySelector('.header');
const navigationToggle = document.querySelector('.nav-toggle');
const siteNavigation = document.getElementById('site-navigation');
function setNavigationOpen(open) {
  siteHeader.classList.toggle('menu-open', open);
  navigationToggle.setAttribute('aria-expanded', String(open));
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

document.querySelectorAll('[data-preview]').forEach((button) => {
  button.addEventListener('click', () => {
    previewTrigger = button;
    previewImage.src = button.dataset.preview;
    previewImage.alt = button.querySelector('img').alt;
    previewTitle.textContent = button.dataset.title;
    previewDialog.showModal();
    document.body.classList.add('preview-open');
  });
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
