const scoreSelectors = Array.from(document.querySelectorAll('[data-score-select]'));
const scoreValue = document.getElementById('auditScoreValue');
const scoreBox = document.getElementById('auditScoreBox');
const statusChip = document.getElementById('auditStatusChip');
const submitButton = document.getElementById('submitAuditButton');
const saveDraftButton = document.getElementById('saveDraftButton');
const clearDraftButton = document.getElementById('clearDraftButton');
const resetFormButton = document.getElementById('resetFormButton');
const undoResetButton = document.getElementById('undoResetButton');
const inlineAlert = document.getElementById('inlineAlert');
const draftIndicator = document.getElementById('draftIndicator');
const lastAutosaveInfo = document.getElementById('lastAutosaveInfo');
const autosaveActivityInfo = document.getElementById('autosaveActivityInfo');
const saveShortcutHint = document.getElementById('saveShortcutHint');
const auditUnit = document.getElementById('auditUnit');
const auditAuditor = document.getElementById('auditAuditor');
const auditDate = document.getElementById('auditDate');
const auditTemplate = document.getElementById('auditTemplate');
const auditFinding = document.getElementById('auditFinding');
const auditRecommendation = document.getElementById('auditRecommendation');
const auditFindingError = document.getElementById('auditFindingError');
const auditRecommendationError = document.getElementById('auditRecommendationError');
const draftKey = 'simpelappi.audit.draft.v1';
const resetSnapshotKey = 'simpelappi.audit.reset.snapshot.v1';
const autosaveDelayMs = 1200;
const debugEnabled = new URLSearchParams(window.location.search).has('debug-audit');
let autosaveTimer = null;
let hasUnsavedChanges = false;
let lastResetSnapshot = null;
let defaultValues = null;

const requiredElements = [
  scoreValue,
  scoreBox,
  statusChip,
  submitButton,
  saveDraftButton,
  clearDraftButton,
  resetFormButton,
  undoResetButton,
  inlineAlert,
  draftIndicator,
  lastAutosaveInfo,
  autosaveActivityInfo,
  saveShortcutHint,
  auditUnit,
  auditAuditor,
  auditDate,
  auditTemplate,
  auditFinding,
  auditRecommendation,
  auditFindingError,
  auditRecommendationError
];

const canInitializeAuditPage = scoreSelectors.length > 0 && requiredElements.every(Boolean);

function getSaveShortcutLabel() {
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  return /mac/i.test(platform) ? 'Cmd+S' : 'Ctrl+S';
}

function debugLog(message, details) {
  if (!debugEnabled) {
    return;
  }
  if (details !== undefined) {
    console.debug(`[audit] ${message}`, details);
    return;
  }
  console.debug(`[audit] ${message}`);
}

function formatLocalDateTime(iso) {
  return new Date(iso).toLocaleString('id-ID');
}

function setAutosaveActivity(text = '') {
  if (autosaveActivityInfo.textContent === text) {
    return;
  }
  autosaveActivityInfo.textContent = text;
  autosaveActivityInfo.hidden = !text;
  autosaveActivityInfo.classList.toggle('is-active', Boolean(text));
  debugLog('autosave activity updated', { text });
}

function setDraftIndicatorState(state, text) {
  draftIndicator.classList.remove('draft-dirty', 'draft-saving', 'draft-saved');
  if (state) {
    draftIndicator.classList.add(state);
  }
  if (text) {
    draftIndicator.textContent = text;
  }
}

function showInlineAlert(message, type) {
  inlineAlert.textContent = message;
  inlineAlert.classList.remove('alert-success', 'alert-error', 'alert-info');
  inlineAlert.classList.add(type);
}

function clearFieldErrors() {
  auditFindingError.textContent = '';
  auditRecommendationError.textContent = '';
}

function validateForm() {
  clearFieldErrors();
  let valid = true;

  if (!auditFinding.value.trim()) {
    auditFindingError.textContent = 'Temuan utama wajib diisi.';
    valid = false;
  }

  if (!auditRecommendation.value.trim()) {
    auditRecommendationError.textContent = 'Rekomendasi wajib diisi.';
    valid = false;
  }

  return valid;
}

function collectDraftPayload() {
  return {
    unit: auditUnit.value,
    auditor: auditAuditor.value,
    auditDate: auditDate.value,
    template: auditTemplate.value,
    finding: auditFinding.value,
    recommendation: auditRecommendation.value,
    checklist: scoreSelectors.map((item) => item.value),
    score: scoreValue.textContent,
    status: statusChip.textContent,
    savedAt: new Date().toISOString()
  };
}

function collectFormState() {
  return {
    unit: auditUnit.value,
    auditor: auditAuditor.value,
    auditDate: auditDate.value,
    template: auditTemplate.value,
    finding: auditFinding.value,
    recommendation: auditRecommendation.value,
    checklist: scoreSelectors.map((item) => item.value)
  };
}

function applyFormState(state) {
  auditUnit.value = state.unit;
  auditAuditor.value = state.auditor;
  auditDate.value = state.auditDate;
  auditTemplate.value = state.template;
  auditFinding.value = state.finding;
  auditRecommendation.value = state.recommendation;
  scoreSelectors.forEach((item, idx) => {
    item.value = state.checklist[idx];
  });
}

function persistResetSnapshot(snapshot) {
  if (!snapshot) {
    sessionStorage.removeItem(resetSnapshotKey);
    return;
  }
  sessionStorage.setItem(resetSnapshotKey, JSON.stringify(snapshot));
}

function restoreResetSnapshotFromSession() {
  const raw = sessionStorage.getItem(resetSnapshotKey);
  if (!raw) {
    return;
  }

  try {
    const snapshot = JSON.parse(raw);
    if (!snapshot || !Array.isArray(snapshot.checklist) || snapshot.checklist.length !== scoreSelectors.length) {
      sessionStorage.removeItem(resetSnapshotKey);
      return;
    }
    lastResetSnapshot = snapshot;
    undoResetButton.disabled = false;
  } catch (err) {
    sessionStorage.removeItem(resetSnapshotKey);
  }
}

function saveDraft(options = {}) {
  const silent = Boolean(options.silent);
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  const payload = collectDraftPayload();
  setDraftIndicatorState('draft-saving', 'Menyimpan draft...');
  localStorage.setItem(draftKey, JSON.stringify(payload));
  setDraftIndicatorState('draft-saved', `Draft tersimpan ${formatLocalDateTime(payload.savedAt)}`);
  lastAutosaveInfo.textContent = `Last autosave: ${formatLocalDateTime(payload.savedAt)}`;
  setAutosaveActivity('');
  hasUnsavedChanges = false;
  debugLog('draft saved', { silent, savedAt: payload.savedAt, score: payload.score, status: payload.status });
  if (!silent) {
    showInlineAlert('Draft audit berhasil disimpan lokal.', 'alert-success');
  }
}

function flushAutosaveNow() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  if (hasUnsavedChanges) {
    debugLog('flushing pending autosave');
    saveDraft({ silent: true });
  }
}

function clearDraft() {
  const confirmed = window.confirm('Hapus draft audit yang tersimpan di browser ini?');
  if (!confirmed) {
    return;
  }
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  localStorage.removeItem(draftKey);
  hasUnsavedChanges = false;
  setDraftIndicatorState('', 'Draft dihapus');
  lastAutosaveInfo.textContent = 'Belum pernah autosave.';
  setAutosaveActivity('');
  debugLog('draft cleared');
  showInlineAlert('Draft lokal berhasil dihapus.', 'alert-info');
}

function resetFormToDefaults() {
  const confirmed = window.confirm('Reset form ke nilai default template? Perubahan saat ini akan ditimpa.');
  if (!confirmed) {
    return;
  }
  lastResetSnapshot = collectFormState();
  persistResetSnapshot(lastResetSnapshot);
  debugLog('reset snapshot stored', lastResetSnapshot);
  applyFormState(defaultValues);
  undoResetButton.disabled = false;
  clearFieldErrors();
  recalculateScore();
  queueAutosave();
  showInlineAlert('Form dikembalikan ke nilai default template.', 'alert-info');
}

function undoResetForm() {
  if (!lastResetSnapshot) {
    showInlineAlert('Tidak ada reset yang bisa dibatalkan.', 'alert-info');
    return;
  }
  applyFormState(lastResetSnapshot);
  lastResetSnapshot = null;
  persistResetSnapshot(null);
  undoResetButton.disabled = true;
  clearFieldErrors();
  recalculateScore();
  queueAutosave();
  debugLog('reset undone');
  showInlineAlert('Reset terakhir berhasil dibatalkan.', 'alert-success');
}

function handleGlobalKeydown(event) {
  const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
  if (!isSaveShortcut) {
    return;
  }
  event.preventDefault();
  saveDraft();
}

function loadDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) {
    setDraftIndicatorState('', 'Draft belum disimpan');
    showInlineAlert('Belum ada draft tersimpan untuk audit ini.', 'alert-info');
    debugLog('no saved draft found');
    return;
  }

  try {
    const draft = JSON.parse(raw);
    if (draft.unit) auditUnit.value = draft.unit;
    if (draft.auditor) auditAuditor.value = draft.auditor;
    if (draft.auditDate) auditDate.value = draft.auditDate;
    if (draft.template) auditTemplate.value = draft.template;
    if (draft.finding !== undefined) auditFinding.value = draft.finding;
    if (draft.recommendation !== undefined) auditRecommendation.value = draft.recommendation;
    if (Array.isArray(draft.checklist) && draft.checklist.length === scoreSelectors.length) {
      scoreSelectors.forEach((item, idx) => {
        item.value = draft.checklist[idx];
      });
    }
    if (draft.savedAt) {
      setDraftIndicatorState('draft-saved', `Draft dimuat ${formatLocalDateTime(draft.savedAt)}`);
      lastAutosaveInfo.textContent = `Last autosave: ${formatLocalDateTime(draft.savedAt)}`;
    } else {
      lastAutosaveInfo.textContent = 'Belum pernah autosave.';
    }
    hasUnsavedChanges = false;
    debugLog('draft loaded', { savedAt: draft.savedAt, score: draft.score, status: draft.status });
    showInlineAlert('Draft audit berhasil dimuat dari penyimpanan lokal.', 'alert-info');
  } catch (err) {
    lastAutosaveInfo.textContent = 'Belum pernah autosave.';
    debugLog('draft load failed', err);
    showInlineAlert('Draft tidak dapat dibaca. Silakan simpan ulang draft.', 'alert-error');
  }
}

function queueAutosave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  hasUnsavedChanges = true;
  setDraftIndicatorState('draft-dirty', 'Perubahan belum disimpan');
  setAutosaveActivity('Autosave aktif');
  debugLog('autosave queued', { delayMs: autosaveDelayMs });
  autosaveTimer = setTimeout(() => {
    saveDraft({ silent: true });
  }, autosaveDelayMs);
}

function handleBeforeUnload(event) {
  flushAutosaveNow();
  if (!hasUnsavedChanges) {
    return;
  }
  debugLog('beforeunload prompt requested');
  event.preventDefault();
  event.returnValue = '';
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    debugLog('visibility hidden');
    flushAutosaveNow();
  }
}

function handlePageHide() {
  debugLog('pagehide');
  flushAutosaveNow();
}

function recalculateScore() {
  const total = scoreSelectors.length;
  const sum = scoreSelectors.reduce((acc, item) => acc + Number(item.value), 0);
  const score = Math.round((sum / total) * 100);

  scoreValue.textContent = String(score);

  scoreBox.classList.remove('score-low', 'score-mid', 'score-good');
  statusChip.classList.remove('status-low', 'status-mid', 'status-good');

  if (score >= 85) {
    scoreBox.classList.add('score-good');
    statusChip.classList.add('status-good');
    statusChip.textContent = 'Compliant';
  } else if (score >= 70) {
    scoreBox.classList.add('score-mid');
    statusChip.classList.add('status-mid');
    statusChip.textContent = 'Need Review';
  } else {
    scoreBox.classList.add('score-low');
    statusChip.classList.add('status-low');
    statusChip.textContent = 'Critical';
  }
}

if (!canInitializeAuditPage) {
  console.warn('audit.js dimuat tanpa elemen audit yang lengkap. Inisialisasi dilewati.');
} else {
  defaultValues = {
    unit: auditUnit.value,
    auditor: auditAuditor.value,
    auditDate: auditDate.value,
    template: auditTemplate.value,
    finding: auditFinding.value,
    recommendation: auditRecommendation.value,
    checklist: scoreSelectors.map((item) => item.value)
  };

  scoreSelectors.forEach((item) => {
    item.addEventListener('change', () => {
      recalculateScore();
      queueAutosave();
    });
  });

  [auditUnit, auditAuditor, auditDate, auditTemplate, auditFinding, auditRecommendation].forEach((field) => {
    field.addEventListener('input', queueAutosave);
    field.addEventListener('change', queueAutosave);
  });

  submitButton.addEventListener('click', () => {
    const isValid = validateForm();

    if (!isValid) {
      showInlineAlert('Form belum lengkap. Mohon periksa field yang ditandai.', 'alert-error');
      return;
    }

    saveDraft();
    localStorage.removeItem(draftKey);
    hasUnsavedChanges = false;
    lastResetSnapshot = null;
    persistResetSnapshot(null);
    undoResetButton.disabled = true;
    window.removeEventListener('beforeunload', handleBeforeUnload);
    setDraftIndicatorState('', 'Draft sudah diproses saat submit');

    window.location.href = 'success-state.html';
  });

  saveDraftButton.addEventListener('click', () => {
    saveDraft();
  });

  clearDraftButton.addEventListener('click', () => {
    clearDraft();
  });

  resetFormButton.addEventListener('click', () => {
    resetFormToDefaults();
  });

  undoResetButton.addEventListener('click', () => {
    undoResetForm();
  });

  saveShortcutHint.textContent = `Tip: tekan ${getSaveShortcutLabel()} untuk simpan draft.`;
  debugLog('audit page initialized', { debugEnabled });
  window.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  restoreResetSnapshotFromSession();
  loadDraft();
  recalculateScore();
}
