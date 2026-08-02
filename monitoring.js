const isolationCategories = window.simpelappiIsolationCategories;

if (!Array.isArray(isolationCategories) || isolationCategories.length === 0) {
  throw new Error('Konfigurasi jenis kewaspadaan isolasi tidak tersedia.');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('isolationAssessmentForm');
  const categorySelect = document.getElementById('isolationCategory');
  const assessmentList = document.getElementById('isolationAssessmentList');
  const categoryDescription = document.getElementById('categoryDescription');
  const scoreValue = document.getElementById('isolationScore');
  const alertBox = document.getElementById('isolationAlert');
  const draftStatus = document.getElementById('isolationDraftStatus');
  const historyList = document.getElementById('isolationHistory');
  const auditorInput = document.getElementById('isolationAuditor');
  const dateInput = document.getElementById('isolationDate');
  const signatureLocationDate = document.getElementById('signatureLocationDate');
  const signatureNameInput = document.getElementById('signatureAuditorName');
  const signatureCanvas = document.getElementById('auditorSignature');
  const clearSignatureButton = document.getElementById('clearSignatureButton');
  const saveDraftButton = document.getElementById('saveIsolationDraftButton');
  const resetButton = document.getElementById('resetIsolationFormButton');
  const modeTabs = Array.from(document.querySelectorAll('[data-form-mode]'));
  const modeEyebrow = document.getElementById('formModeEyebrow');
  const modeTitle = document.getElementById('formModeTitle');

  if (
    !form ||
    !categorySelect ||
    !assessmentList ||
    !categoryDescription ||
    !scoreValue ||
    !alertBox ||
    !draftStatus ||
    !historyList ||
    !auditorInput ||
    !dateInput ||
    !signatureLocationDate ||
    !signatureNameInput ||
    !(signatureCanvas instanceof HTMLCanvasElement) ||
    !clearSignatureButton ||
    !saveDraftButton ||
    !resetButton ||
    !modeEyebrow ||
    !modeTitle
  ) {
    console.warn('Form kewaspadaan isolasi tidak dapat diinisialisasi karena elemen tidak lengkap.');
    return;
  }

  const signatureContext = signatureCanvas.getContext('2d');
  if (!signatureContext) {
    showAlert('Tanda tangan digital tidak didukung oleh browser ini.', 'alert-error');
    return;
  }

  const historyKey = 'simpelappi.isolation.submissions.v1';
  let currentMode = 'audit';
  let isDrawing = false;
  let hasSignature = false;

  function getLocalDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  }

  function updateSignatureDate() {
    const [year, month, day] = dateInput.value.split('-').map(Number);
    if (!year || !month || !day) {
      signatureLocationDate.textContent = 'Bandung, tanggal belum dipilih';
      return;
    }

    const assessmentDate = new Date(year, month - 1, day);
    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(assessmentDate);
    signatureLocationDate.textContent = `Bandung, ${formattedDate}`;
  }

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `inline-alert ${type}`;
  }

  function getDraftKey() {
    return `simpelappi.isolation.draft.${currentMode}.${categorySelect.value}.v1`;
  }

  function clearErrors() {
    document.querySelectorAll('[data-error-for]').forEach((element) => {
      element.textContent = '';
    });
  }

  function setError(field, message) {
    const errorElement = document.querySelector(`[data-error-for="${field}"]`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  function clearSignature() {
    signatureContext.fillStyle = '#ffffff';
    signatureContext.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureContext.strokeStyle = '#0f172a';
    signatureContext.lineWidth = 3;
    signatureContext.lineCap = 'round';
    signatureContext.lineJoin = 'round';
    hasSignature = false;
  }

  function getPointerPosition(event) {
    const bounds = signatureCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (signatureCanvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (signatureCanvas.height / bounds.height)
    };
  }

  function calculateScore() {
    const scores = Array.from(assessmentList.querySelectorAll('[data-assessment-score]'))
      .map((select) => select.value)
      .filter((value) => value !== '' && value !== 'na')
      .map(Number);
    const score = scores.length === 0 ? 0 : Math.round((scores.reduce((sum, value) => sum + value, 0) / (scores.length * 2)) * 100);
    scoreValue.textContent = String(score);
    return score;
  }

  function renderAssessmentItems() {
    const category = isolationCategories.find((item) => item.id === categorySelect.value) ?? isolationCategories[0];
    categoryDescription.textContent = category.description;
    assessmentList.innerHTML = category.items
      .map(
        (item, index) => `
          <div class="isolation-assessment-item">
            <div class="assessment-item-number">${index + 1}</div>
            <div class="assessment-item-copy">
              <strong>${item}</strong>
              <textarea rows="2" data-assessment-note="${index}" aria-label="Catatan untuk ${item}" placeholder="Catatan atau bukti (opsional)"></textarea>
            </div>
            <select data-assessment-score="${index}" aria-label="Nilai untuk ${item}" required>
              <option value="">Pilih nilai</option>
              <option value="2">Patuh</option>
              <option value="1">Sebagian</option>
              <option value="0">Tidak patuh</option>
              <option value="na">Tidak berlaku</option>
            </select>
          </div>
        `
      )
      .join('');
    assessmentList.querySelectorAll('[data-assessment-score]').forEach((select) => {
      select.addEventListener('change', calculateScore);
    });
    calculateScore();
  }

  function collectPayload() {
    return {
      mode: currentMode,
      category: categorySelect.value,
      categoryName: categorySelect.options[categorySelect.selectedIndex]?.textContent ?? '',
      auditor: auditorInput.value.trim(),
      assessmentDate: dateInput.value,
      unit: form.elements.unit.value,
      assessments: Array.from(assessmentList.querySelectorAll('.isolation-assessment-item')).map((item, index) => ({
        item: item.querySelector('strong')?.textContent ?? '',
        score: item.querySelector(`[data-assessment-score="${index}"]`)?.value ?? '',
        note: item.querySelector(`[data-assessment-note="${index}"]`)?.value.trim() ?? ''
      })),
      analysis: form.elements.analysis.value.trim(),
      findings: form.elements.findings.value.trim(),
      followUp: form.elements.followUp.value.trim(),
      recommendation: form.elements.recommendation.value.trim(),
      signatureName: signatureNameInput.value.trim(),
      signature: hasSignature ? signatureCanvas.toDataURL('image/png') : '',
      score: calculateScore(),
      savedAt: new Date().toISOString()
    };
  }

  function applyPayload(payload) {
    auditorInput.value = payload.auditor ?? '';
    dateInput.value = payload.assessmentDate ?? '';
    updateSignatureDate();
    form.elements.unit.value = payload.unit ?? '';
    form.elements.analysis.value = payload.analysis ?? '';
    form.elements.findings.value = payload.findings ?? '';
    form.elements.followUp.value = payload.followUp ?? '';
    form.elements.recommendation.value = payload.recommendation ?? '';
    signatureNameInput.value = payload.auditor ?? '';

    if (Array.isArray(payload.assessments)) {
      payload.assessments.forEach((assessment, index) => {
        const score = assessmentList.querySelector(`[data-assessment-score="${index}"]`);
        const note = assessmentList.querySelector(`[data-assessment-note="${index}"]`);
        if (score) score.value = assessment.score ?? '';
        if (note) note.value = assessment.note ?? '';
      });
    }

    clearSignature();
    if (payload.signature) {
      const image = new Image();
      image.addEventListener('load', () => {
        clearSignature();
        signatureContext.drawImage(image, 0, 0, signatureCanvas.width, signatureCanvas.height);
        hasSignature = true;
      });
      image.src = payload.signature;
    }
    calculateScore();
  }

  function loadDraft() {
    try {
      const rawDraft = localStorage.getItem(getDraftKey());
      if (!rawDraft) {
        draftStatus.textContent = 'Draft belum disimpan untuk formulir ini.';
        return;
      }
      const draft = JSON.parse(rawDraft);
      applyPayload(draft);
      draftStatus.textContent = `Draft dimuat: ${new Date(draft.savedAt).toLocaleString('id-ID')}`;
      showAlert('Draft formulir berhasil dimuat.', 'alert-info');
    } catch (error) {
      console.error('Draft kewaspadaan isolasi tidak dapat dibaca.', error);
      showAlert('Draft tersimpan rusak dan tidak dapat dimuat.', 'alert-error');
    }
  }

  function saveDraft() {
    const payload = collectPayload();
    try {
      localStorage.setItem(getDraftKey(), JSON.stringify(payload));
      draftStatus.textContent = `Draft tersimpan: ${new Date(payload.savedAt).toLocaleString('id-ID')}`;
      showAlert('Draft berhasil disimpan pada perangkat ini.', 'alert-success');
    } catch (error) {
      console.error('Draft kewaspadaan isolasi tidak dapat disimpan.', error);
      showAlert('Draft gagal disimpan. Periksa kapasitas penyimpanan browser.', 'alert-error');
    }
  }

  function validatePayload(payload) {
    clearErrors();
    let valid = true;
    const requiredFields = [
      ['auditor', payload.auditor, 'Nama auditor wajib diisi.'],
      ['assessmentDate', payload.assessmentDate, 'Tanggal wajib diisi.'],
      ['unit', payload.unit, 'Unit wajib dipilih.'],
      ['analysis', payload.analysis, 'Analisis wajib diisi.'],
      ['findings', payload.findings, 'Temuan wajib diisi.'],
      ['followUp', payload.followUp, 'Rencana tindak lanjut wajib diisi.'],
      ['recommendation', payload.recommendation, 'Rekomendasi wajib diisi.'],
      ['signatureName', payload.signatureName, 'Nama lengkap penanda tangan wajib diisi.']
    ];
    requiredFields.forEach(([field, value, message]) => {
      if (!value) {
        setError(field, message);
        valid = false;
      }
    });
    if (payload.assessments.some((assessment) => !assessment.score)) {
      setError('assessments', 'Semua item penilaian wajib diberi nilai.');
      valid = false;
    }
    if (!payload.signature) {
      setError('signature', 'Tanda tangan digital auditor wajib dibubuhkan.');
      valid = false;
    }
    if (
      payload.auditor &&
      payload.signatureName &&
      payload.auditor.toLocaleLowerCase('id-ID') !== payload.signatureName.toLocaleLowerCase('id-ID')
    ) {
      setError('signatureName', 'Nama penanda tangan harus sama dengan nama auditor.');
      valid = false;
    }
    return valid;
  }

  function readHistory() {
    try {
      const rawHistory = localStorage.getItem(historyKey);
      if (!rawHistory) return [];
      const history = JSON.parse(rawHistory);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('Riwayat formulir tidak dapat dibaca.', error);
      showAlert('Riwayat formulir tersimpan rusak.', 'alert-error');
      return [];
    }
  }

  function renderHistory() {
    const history = readHistory();
    if (history.length === 0) {
      historyList.innerHTML = '<li class="isolation-history-empty">Belum ada formulir yang disubmit.</li>';
      return;
    }
    historyList.replaceChildren();
    history.slice(0, 8).forEach((entry) => {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      const detail = document.createElement('span');
      const score = document.createElement('small');
      title.textContent = `${entry.mode === 'audit' ? 'Audit' : 'Supervisi'} - ${entry.categoryName}`;
      detail.textContent = `${entry.unit} | ${entry.assessmentDate}`;
      score.textContent = `${entry.auditor} - Skor ${entry.score}`;
      item.append(title, detail, score);
      historyList.appendChild(item);
    });
  }

  function resetForm(options = {}) {
    const selectedCategory = categorySelect.value;
    form.reset();
    categorySelect.value = selectedCategory || isolationCategories[0].id;
    dateInput.value = getLocalDate();
    updateSignatureDate();
    clearSignature();
    renderAssessmentItems();
    clearErrors();
    calculateScore();
    if (!options.keepAlert) {
      showAlert('Formulir dikosongkan.', 'alert-info');
    }
  }

  function switchMode(mode) {
    currentMode = mode;
    modeTabs.forEach((tab) => {
      const active = tab.dataset.formMode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    const label = mode === 'audit' ? 'Audit' : 'Supervisi';
    modeEyebrow.textContent = `${label} Kewaspadaan Isolasi`;
    modeTitle.textContent = `Formulir ${label}`;
    resetForm({ keepAlert: true });
    loadDraft();
    showAlert(`Mode formulir ${label.toLowerCase()} aktif.`, 'alert-info');
  }

  isolationCategories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  signatureCanvas.addEventListener('pointerdown', (event) => {
    isDrawing = true;
    signatureCanvas.setPointerCapture(event.pointerId);
    const point = getPointerPosition(event);
    signatureContext.beginPath();
    signatureContext.moveTo(point.x, point.y);
  });
  signatureCanvas.addEventListener('pointermove', (event) => {
    if (!isDrawing) return;
    const point = getPointerPosition(event);
    signatureContext.lineTo(point.x, point.y);
    signatureContext.stroke();
    hasSignature = true;
  });
  signatureCanvas.addEventListener('pointerup', () => {
    isDrawing = false;
  });
  signatureCanvas.addEventListener('pointercancel', () => {
    isDrawing = false;
  });

  auditorInput.addEventListener('input', () => {
    signatureNameInput.value = auditorInput.value;
  });
  dateInput.addEventListener('change', updateSignatureDate);
  categorySelect.addEventListener('change', () => {
    resetForm({ keepAlert: true });
    loadDraft();
  });
  clearSignatureButton.addEventListener('click', clearSignature);
  saveDraftButton.addEventListener('click', saveDraft);
  resetButton.addEventListener('click', () => {
    if (window.confirm('Kosongkan seluruh isian formulir saat ini?')) {
      try {
        localStorage.removeItem(getDraftKey());
      } catch (error) {
        console.error('Draft kewaspadaan isolasi tidak dapat dihapus.', error);
        showAlert('Draft gagal dihapus dari penyimpanan browser.', 'alert-error');
        return;
      }
      resetForm();
      draftStatus.textContent = 'Draft belum disimpan untuk formulir ini.';
    }
  });
  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.formMode) {
        switchMode(tab.dataset.formMode);
      }
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const payload = collectPayload();
    if (!validatePayload(payload)) {
      showAlert('Formulir belum lengkap. Periksa field yang ditandai.', 'alert-error');
      document.querySelector('.input-error:not(:empty)')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const history = readHistory();
    history.unshift({ ...payload, signature: undefined, submittedAt: new Date().toISOString() });
    try {
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
      localStorage.removeItem(getDraftKey());
    } catch (error) {
      console.error('Formulir kewaspadaan isolasi tidak dapat disubmit.', error);
      showAlert('Formulir gagal disimpan. Periksa kapasitas penyimpanan browser.', 'alert-error');
      return;
    }
    renderHistory();
    resetForm({ keepAlert: true });
    draftStatus.textContent = 'Formulir sudah disubmit.';
    showAlert(`Formulir ${currentMode} berhasil disubmit dan masuk riwayat lokal.`, 'alert-success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  clearSignature();
  dateInput.value = getLocalDate();
  updateSignatureDate();
  renderAssessmentItems();
  loadDraft();
  renderHistory();
});
