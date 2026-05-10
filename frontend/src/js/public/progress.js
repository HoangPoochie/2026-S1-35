import {
  clearPublicProgress,
  getPublicProgressEntry,
  markPublicPageVisited,
  readPublicProgress,
  setPublicPageCompleted
} from "../utils/storage.js";

const TOPIC_PATH_PREFIX = "/src/topics/";

function normalizePath(value, base = window.location.href) {
  return new URL(value, base).pathname;
}

function getCurrentPageId() {
  return normalizePath(window.location.href);
}

function isTopicPage(pageId) {
  return pageId.startsWith(TOPIC_PATH_PREFIX);
}

function getProgressCounts() {
  const progress = readPublicProgress();
  const entries = Object.values(progress.pages);

  return {
    started: entries.filter((entry) => entry.visitedAt).length,
    completed: entries.filter((entry) => entry.completedAt).length
  };
}

function createProgressPanel(currentPageId) {
  const existingPanel = document.querySelector("[data-public-progress-panel]");

  if (existingPanel) {
    existingPanel.remove();
  }

  const counts = getProgressCounts();
  const panel = document.createElement("section");
  panel.className = "local-progress";
  panel.dataset.publicProgressPanel = "true";

  const summary = document.createElement("div");
  summary.className = "local-progress__summary";
  summary.innerHTML = `
    <span class="local-progress__label">Progress</span>
    <strong>${counts.completed} done</strong>
    <span>${counts.started} started</span>
    <span>Saved on this browser</span>
  `;

  const actions = document.createElement("div");
  actions.className = "local-progress__actions";

  if (isTopicPage(currentPageId)) {
    const currentEntry = getPublicProgressEntry(currentPageId);
    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "local-progress__button";
    toggleButton.dataset.progressCompleteToggle = "true";
    toggleButton.textContent = currentEntry?.completedAt
      ? "Mark incomplete"
      : "Mark complete";
    actions.append(toggleButton);
  }

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "local-progress__button local-progress__button--secondary";
  clearButton.dataset.progressClear = "true";
  clearButton.textContent = "Reset progress";
  actions.append(clearButton);

  panel.append(summary, actions);
  return panel;
}

function placeProgressPanel(panel) {
  const hero = document.querySelector(".topic-hero, .hero");
  const topics = document.querySelector(".topics");

  if (hero?.parentNode) {
    hero.insertAdjacentElement("afterend", panel);
    return;
  }

  if (topics?.parentNode) {
    topics.insertAdjacentElement("beforebegin", panel);
    return;
  }

  document.body.prepend(panel);
}

function decorateProgressCards() {
  document.querySelectorAll("a.card[href]").forEach((card) => {
    const targetPageId = normalizePath(card.getAttribute("href"), window.location.href);
    const entry = getPublicProgressEntry(targetPageId);
    const existingBadge = card.querySelector("[data-progress-badge]");

    if (existingBadge) {
      existingBadge.remove();
    }

    card.classList.remove("card--visited", "card--complete");

    if (!entry?.visitedAt) {
      return;
    }

    const badge = document.createElement("span");
    badge.className = "progress-badge";
    badge.dataset.progressBadge = "true";

    if (entry.completedAt) {
      card.classList.add("card--complete");
      badge.textContent = "Done";
    } else {
      card.classList.add("card--visited");
      badge.textContent = "Started";
    }

    card.append(badge);
  });
}

function refreshProgressUi(currentPageId) {
  placeProgressPanel(createProgressPanel(currentPageId));
  decorateProgressCards();
}

function bindProgressActions(currentPageId) {
  document.addEventListener("click", (event) => {
    const completeButton = event.target.closest("[data-progress-complete-toggle]");

    if (completeButton) {
      const currentEntry = getPublicProgressEntry(currentPageId);
      setPublicPageCompleted(currentPageId, !currentEntry?.completedAt);
      refreshProgressUi(currentPageId);
      return;
    }

    const clearButton = event.target.closest("[data-progress-clear]");

    if (clearButton) {
      clearPublicProgress();

      if (isTopicPage(currentPageId)) {
        markPublicPageVisited(currentPageId);
      }

      refreshProgressUi(currentPageId);
    }
  });
}

export function initPublicProgress() {
  const currentPageId = getCurrentPageId();
  const hasPublicContent =
    isTopicPage(currentPageId) || document.querySelector(".topics, .cards");

  if (!hasPublicContent) {
    return;
  }

  if (isTopicPage(currentPageId)) {
    markPublicPageVisited(currentPageId);
  }

  refreshProgressUi(currentPageId);
  bindProgressActions(currentPageId);
}
