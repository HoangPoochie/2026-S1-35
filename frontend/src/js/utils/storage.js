const PUBLIC_PROGRESS_KEY = "bvom.publicProgress.v1";

function getStorage() {
  try {
    const storage = window.localStorage;
    const testKey = "__bvom_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

function createEmptyProgress() {
  return {
    version: 1,
    pages: {}
  };
}

export function readPublicProgress() {
  const storage = getStorage();

  if (!storage) {
    return createEmptyProgress();
  }

  try {
    const parsed = JSON.parse(storage.getItem(PUBLIC_PROGRESS_KEY));

    if (!parsed || typeof parsed !== "object" || !parsed.pages) {
      return createEmptyProgress();
    }

    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

export function writePublicProgress(progress) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(PUBLIC_PROGRESS_KEY, JSON.stringify(progress));
}

export function clearPublicProgress() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(PUBLIC_PROGRESS_KEY);
}

export function getPublicProgressEntry(pageId) {
  return readPublicProgress().pages[pageId] || null;
}

export function markPublicPageVisited(pageId) {
  const progress = readPublicProgress();
  const existing = progress.pages[pageId] || {};
  const now = new Date().toISOString();

  progress.pages[pageId] = {
    ...existing,
    visitedAt: existing.visitedAt || now,
    lastVisitedAt: now
  };

  writePublicProgress(progress);
  return progress.pages[pageId];
}

export function setPublicPageCompleted(pageId, completed) {
  const progress = readPublicProgress();
  const existing = progress.pages[pageId] || {};
  const next = {
    ...existing,
    visitedAt: existing.visitedAt || new Date().toISOString(),
    lastVisitedAt: new Date().toISOString()
  };

  if (completed) {
    next.completedAt = new Date().toISOString();
  } else {
    delete next.completedAt;
  }

  progress.pages[pageId] = next;
  writePublicProgress(progress);
  return next;
}
