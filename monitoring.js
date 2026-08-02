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
  const findingPhotoCamera = document.getElementById('findingPhotoCamera');
  const findingPhotoUpload = document.getElementById('findingPhotoUpload');
  const findingPhotoCount = document.getElementById('findingPhotoCount');
  const findingPhotoPreview = document.getElementById('findingPhotoPreview');
  const clearSignatureButton = document.getElementById('clearSignatureButton');
  const saveDraftButton = document.getElementById('saveIsolationDraftButton');
  const savePdfButton = document.getElementById('saveIsolationPdfButton');
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
    !(findingPhotoCamera instanceof HTMLInputElement) ||
    !(findingPhotoUpload instanceof HTMLInputElement) ||
    !findingPhotoCount ||
    !findingPhotoPreview ||
    !clearSignatureButton ||
    !saveDraftButton ||
    !savePdfButton ||
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
  let findingPhotos = [];
  let photoGeneration = 0;
  const pendingPhotoBatches = new Set();

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

  function renderFindingPhotos() {
    findingPhotoCount.textContent = `${findingPhotos.length} foto`;
    findingPhotoPreview.replaceChildren();

    findingPhotos.forEach((photo, index) => {
      const thumbnail = document.createElement('div');
      const image = document.createElement('img');
      const removeButton = document.createElement('button');

      thumbnail.className = 'finding-photo-thumbnail';
      image.src = photo;
      image.alt = `Foto temuan ${index + 1}`;
      removeButton.className = 'finding-photo-remove';
      removeButton.type = 'button';
      removeButton.textContent = '\u00d7';
      removeButton.setAttribute('aria-label', `Hapus foto temuan ${index + 1}`);
      removeButton.addEventListener('click', () => {
        findingPhotos.splice(index, 1);
        renderFindingPhotos();
      });

      thumbnail.append(image, removeButton);
      findingPhotoPreview.appendChild(thumbnail);
    });
  }

  function readPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result !== 'string') {
          reject(new Error(`Foto ${file.name} tidak dapat dibaca.`));
          return;
        }
        resolve(reader.result);
      });
      reader.addEventListener('error', () => reject(new Error(`Foto ${file.name} tidak dapat dibaca.`)));
      reader.readAsDataURL(file);
    });
  }

  function loadPhoto(dataUrl, fileName) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', () => reject(new Error(`Foto ${fileName} tidak dapat diproses.`)));
      image.src = dataUrl;
    });
  }

  async function compressPhoto(file) {
    const dataUrl = await readPhoto(file);
    const image = await loadPhoto(dataUrl, file.name);
    const maxDimension = 1000;
    const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(`Foto ${file.name} tidak dapat dikompres.`);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6);
  }

  async function handleFindingPhotoInput(input) {
    const selectedFiles = Array.from(input.files ?? []);
    input.value = '';
    if (selectedFiles.length === 0) return;

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== selectedFiles.length) {
      showAlert('Sebagian file diabaikan karena bukan format gambar.', 'alert-error');
    }
    if (imageFiles.length === 0) return;

    const batchToken = Symbol('finding-photo-batch');
    const generation = photoGeneration;
    pendingPhotoBatches.add(batchToken);
    showAlert('Foto temuan sedang dikompres.', 'alert-info');

    try {
      const results = await Promise.allSettled(imageFiles.map(compressPhoto));
      if (generation !== photoGeneration) return;

      const compressedPhotos = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      const failures = results.filter((result) => result.status === 'rejected');

      findingPhotos.push(...compressedPhotos);
      renderFindingPhotos();

      if (failures.length > 0) {
        failures.forEach((failure) => console.error('Foto temuan gagal diproses.', failure.reason));
        showAlert(`${failures.length} foto gagal diproses.`, 'alert-error');
        return;
      }
      showAlert(`${compressedPhotos.length} foto temuan berhasil ditambahkan.`, 'alert-success');
    } finally {
      pendingPhotoBatches.delete(batchToken);
    }
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

  function escapeReportHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatReportDate(value, padDay = false) {
    const [year, month, day] = String(value ?? '')
      .split('-')
      .map(Number);
    if (!year || !month || !day) return '';

    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(year, month - 1, day));
    return `${padDay ? String(day).padStart(2, '0') : day} ${monthName} ${year}`;
  }

  function toFilenamePart(value) {
    return String(value ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '');
  }

  function getAssessmentResultLabel(score) {
    return (
      {
        2: 'Ya',
        1: 'Sebagian',
        0: 'Tidak',
        na: 'Tidak Berlaku'
      }[score] ?? 'Belum diisi'
    );
  }

  function buildPrintReport(payload) {
    const modeLabel = currentMode === 'supervisi' ? 'Supervisi' : 'Audit';
    const categoryName = payload.categoryName || 'Jenis belum dipilih';
    const reportDate = formatReportDate(payload.assessmentDate) || 'Tanggal belum diisi';
    const filenameDate = formatReportDate(payload.assessmentDate, true) || 'Tanggal_Belum_Diisi';
    const filenameBase = `${modeLabel}_${toFilenamePart(categoryName) || 'Jenis_Belum_Dipilih'}_${filenameDate}`;
    const filename = `${filenameBase}.pdf`;
    const logoUrl = new URL('assets/kemenkes-rs-cicendo.svg', window.location.href).href;
    const assessmentRows = payload.assessments
      .map(
        (assessment, index) => `
          <tr>
            <td class="number">${index + 1}</td>
            <td>${escapeReportHtml(assessment.item)}</td>
            <td class="result">${escapeReportHtml(getAssessmentResultLabel(assessment.score))}</td>
          </tr>
        `
      )
      .join('');
    const comments = payload.assessments.filter((assessment) => assessment.note);
    const commentSection =
      comments.length > 0
        ? `
          <section class="report-section">
            <h2>Catatan Item Penilaian</h2>
            <ol class="comment-list">
              ${comments
                .map(
                  (assessment) => `
                    <li>
                      <strong>${escapeReportHtml(assessment.item)}</strong>
                      <p>${escapeReportHtml(assessment.note)}</p>
                    </li>
                  `
                )
                .join('')}
            </ol>
          </section>
        `
        : '';
    const yesCount = payload.assessments.filter((assessment) => assessment.score === '2').length;
    const noCount = payload.assessments.filter((assessment) => assessment.score === '0').length;
    const printablePhotos = payload.photos.filter((photo) => /^data:image\//.test(photo));
    const photoSection =
      printablePhotos.length > 0
        ? `
          <section class="report-section photo-section">
            <h2>Foto Temuan</h2>
            <div class="report-photo-grid">
              ${printablePhotos
                .map(
                  (photo, index) =>
                    `<figure><img src="${escapeReportHtml(photo)}" alt="Foto temuan ${index + 1}"><figcaption>Foto ${index + 1}</figcaption></figure>`
                )
                .join('')}
            </div>
          </section>
        `
        : '';
    const signatureImage =
      payload.signature && /^data:image\//.test(payload.signature)
        ? `<img class="signature-image" src="${escapeReportHtml(payload.signature)}" alt="Tanda tangan digital auditor">`
        : '<div class="signature-placeholder"></div>';

    return {
      filename,
      html: `<!doctype html>
        <html lang="id">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeReportHtml(filenameBase)}</title>
            <style>
              @page { size: 210mm 330mm portrait; margin: 14mm 14mm 20mm; }
              * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              html, body { margin: 0; padding: 0; color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.45; }
              body { padding-bottom: 16mm; }
              .report-header { display: grid; grid-template-columns: 30mm 1fr; align-items: center; gap: 7mm; margin-bottom: 6mm; padding: 5mm 6mm; border-radius: 4mm; background: linear-gradient(135deg, #064e3b, #0f766e); color: #fff; }
              .report-header img { width: 28mm; max-height: 22mm; padding: 2mm; border-radius: 2mm; background: #fff; object-fit: contain; }
              .hospital-name { margin: 0; font-size: 15pt; font-weight: 800; letter-spacing: .02em; line-height: 1.2; }
              .hospital-subtitle { margin: 1mm 0 0; font-size: 11pt; font-weight: 700; }
              .committee { margin: 2mm 0 0; font-size: 9.5pt; }
              .report-title { margin: 0 0 5mm; padding-bottom: 3mm; border-bottom: 1.2pt solid #0f766e; color: #064e3b; font-size: 17pt; font-weight: 800; text-align: center; text-transform: uppercase; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm; margin-bottom: 6mm; padding: 4mm 5mm; border: 1pt solid #cbd5e1; border-radius: 2mm; background: #f8fafc; }
              .info-row { display: grid; grid-template-columns: 39mm 1fr; gap: 2mm; padding: 1.2mm 0; border-bottom: .5pt solid #e2e8f0; }
              .info-row:nth-last-child(-n+2) { border-bottom: 0; }
              .info-label { color: #475569; font-weight: 700; }
              .info-value { overflow-wrap: anywhere; }
              .report-section { margin-top: 6mm; break-inside: avoid-page; }
              .report-section h2 { margin: 0 0 2.5mm; color: #064e3b; font-size: 12pt; }
              table { width: 100%; border-collapse: collapse; table-layout: fixed; }
              thead { display: table-header-group; }
              tr { break-inside: avoid; page-break-inside: avoid; }
              th, td { padding: 2.5mm 2.8mm; border: .75pt solid #64748b; vertical-align: top; }
              th { background: #e2e8f0; color: #1e293b; font-weight: 800; text-align: left; }
              th.number, td.number { width: 12mm; text-align: center; }
              th.result, td.result { width: 31mm; text-align: center; }
              .comment-list { margin: 0; padding-left: 6mm; }
              .comment-list li { margin-bottom: 2.5mm; break-inside: avoid; }
              .comment-list p { margin: .5mm 0 0; white-space: pre-wrap; }
              .narrative-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
              .narrative-box { min-height: 22mm; padding: 3mm; border: .75pt solid #94a3b8; border-radius: 2mm; break-inside: avoid; }
              .narrative-box h3 { margin: 0 0 1.5mm; font-size: 10.5pt; }
              .narrative-box p { margin: 0; white-space: pre-wrap; }
              .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: .75pt solid #64748b; }
              .score-item { padding: 3mm; border-right: .75pt solid #64748b; text-align: center; }
              .score-item:last-child { border-right: 0; }
              .score-item span { display: block; color: #475569; font-size: 9pt; }
              .score-item strong { display: block; margin-top: 1mm; color: #064e3b; font-size: 14pt; }
              .score-note { margin: 1.5mm 0 0; color: #64748b; font-size: 8.5pt; }
              .report-photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
              .report-photo-grid figure { margin: 0; break-inside: avoid; }
              .report-photo-grid img { display: block; width: 100%; height: 43mm; border: .75pt solid #94a3b8; border-radius: 2mm; object-fit: cover; }
              .report-photo-grid figcaption { margin-top: 1mm; color: #64748b; font-size: 8.5pt; text-align: center; }
              .signature-section { display: flex; justify-content: flex-end; margin-top: 10mm; break-inside: avoid; page-break-inside: avoid; }
              .signature-card { width: 68mm; text-align: center; }
              .signature-card p { margin: 0 0 2mm; }
              .signature-image { display: block; width: 58mm; height: 27mm; margin: 0 auto 2mm; object-fit: contain; }
              .signature-placeholder { display: grid; place-items: end center; height: 27mm; margin-bottom: 2mm; }
              .signature-name { padding-top: 1.5mm; border-top: .75pt solid #334155; font-weight: 700; }
              .report-footer { position: fixed; right: 0; bottom: -13mm; left: 0; padding-top: 2mm; border-top: .75pt solid #94a3b8; color: #64748b; font-size: 8.5pt; text-align: center; }
              @media screen {
                body { max-width: 210mm; min-height: 330mm; margin: 12mm auto; padding: 14mm 14mm 25mm; box-shadow: 0 8px 30px rgba(15, 23, 42, .16); }
                .report-footer { right: 14mm; bottom: 7mm; left: 14mm; }
              }
            </style>
          </head>
          <body>
            <header class="report-header">
              <img src="${escapeReportHtml(logoUrl)}" alt="Logo Rumah Sakit Mata Cicendo">
              <div>
                <p class="hospital-name">PUSAT MATA NASIONAL<br>RUMAH SAKIT MATA CICENDO BANDUNG</p>
                <p class="committee">Komite Pencegahan dan Pengendalian Infeksi</p>
              </div>
            </header>

            <h1 class="report-title">${escapeReportHtml(`${modeLabel} ${categoryName}`)}</h1>

            <section class="info-grid">
              <div class="info-row"><span class="info-label">Jenis ${escapeReportHtml(modeLabel)}</span><span class="info-value">${escapeReportHtml(categoryName)}</span></div>
              <div class="info-row"><span class="info-label">Tanggal ${escapeReportHtml(modeLabel)}</span><span class="info-value">${escapeReportHtml(reportDate)}</span></div>
              <div class="info-row"><span class="info-label">Unit</span><span class="info-value">${escapeReportHtml(payload.unit || '-')}</span></div>
              <div class="info-row"><span class="info-label">Auditor</span><span class="info-value">${escapeReportHtml(payload.auditor || '-')}</span></div>
              <div class="info-row"><span class="info-label">Profesi</span><span class="info-value">${escapeReportHtml(payload.profession || '-')}</span></div>
            </section>

            <section>
              <table>
                <thead><tr><th class="number">No</th><th>Item Penilaian</th><th class="result">Hasil</th></tr></thead>
                <tbody>${assessmentRows}</tbody>
              </table>
            </section>

            ${commentSection}

            <section class="report-section">
              <h2>Analisis dan Tindak Lanjut</h2>
              <div class="narrative-grid">
                <div class="narrative-box"><h3>Analisis</h3><p>${escapeReportHtml(payload.analysis || '-')}</p></div>
                <div class="narrative-box"><h3>Temuan</h3><p>${escapeReportHtml(payload.findings || '-')}</p></div>
                <div class="narrative-box"><h3>Rencana Tindak Lanjut</h3><p>${escapeReportHtml(payload.followUp || '-')}</p></div>
                <div class="narrative-box"><h3>Rekomendasi</h3><p>${escapeReportHtml(payload.recommendation || '-')}</p></div>
              </div>
            </section>

            <section class="report-section">
              <h2>Nilai</h2>
              <div class="score-grid">
                <div class="score-item"><span>Jumlah Item</span><strong>${payload.assessments.length}</strong></div>
                <div class="score-item"><span>Jumlah Ya</span><strong>${yesCount}</strong></div>
                <div class="score-item"><span>Jumlah Tidak</span><strong>${noCount}</strong></div>
                <div class="score-item"><span>Persentase Kepatuhan</span><strong>${payload.score}%</strong></div>
              </div>
              <p class="score-note">Nilai Sebagian dihitung 50%, sedangkan Tidak Berlaku tidak dimasukkan dalam persentase kepatuhan.</p>
            </section>

            ${photoSection}

            <section class="signature-section">
              <div class="signature-card">
                <p>Bandung, ${escapeReportHtml(reportDate)}</p>
                <p>Auditor</p>
                ${signatureImage}
                <p class="signature-name">${escapeReportHtml(payload.auditor || 'Nama Auditor')}</p>
              </div>
            </section>

            <footer class="report-footer">
              <strong>SIMPELAPPI</strong>
            </footer>
          </body>
        </html>`
    };
  }

  function saveCurrentFormAsPdf() {
    if (pendingPhotoBatches.size > 0) {
      showAlert('Tunggu hingga kompresi foto selesai sebelum membuat PDF.', 'alert-info');
      return;
    }

    const printWindow = window.open('', 'simpelappi-print-preview', 'width=1000,height=800');
    if (!printWindow) {
      showAlert('Print Preview diblokir browser. Izinkan pop-up untuk membuat PDF.', 'alert-error');
      return;
    }

    const report = buildPrintReport(collectPayload());
    printWindow.document.open();
    printWindow.document.write(report.html);
    printWindow.document.close();
    printWindow.opener = null;

    const images = Array.from(printWindow.document.images);
    const imageReady = images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    });

    void Promise.all(imageReady).then(() => {
      printWindow.focus();
      window.setTimeout(() => printWindow.print(), 250);
    });
  }

  function collectPayload() {
    return {
      mode: currentMode,
      category: categorySelect.value,
      categoryName: categorySelect.options[categorySelect.selectedIndex]?.textContent ?? '',
      auditor: auditorInput.value.trim(),
      assessmentDate: dateInput.value,
      profession: form.elements.profession.value,
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
      photos: findingPhotos.slice(),
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
    form.elements.profession.value = payload.profession ?? '';
    form.elements.unit.value = payload.unit ?? '';
    form.elements.analysis.value = payload.analysis ?? '';
    form.elements.findings.value = payload.findings ?? '';
    form.elements.followUp.value = payload.followUp ?? '';
    form.elements.recommendation.value = payload.recommendation ?? '';
    findingPhotos = Array.isArray(payload.photos) ? payload.photos.filter((photo) => typeof photo === 'string') : [];
    renderFindingPhotos();
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
    if (pendingPhotoBatches.size > 0) {
      showAlert('Tunggu hingga kompresi foto selesai sebelum menyimpan draft.', 'alert-info');
      return;
    }
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
      ['profession', payload.profession, 'Profesi wajib dipilih.'],
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
      detail.textContent = `${entry.profession || 'Profesi belum diisi'} | ${entry.unit} | ${entry.assessmentDate}`;
      const photoSummary = Array.isArray(entry.photos) && entry.photos.length > 0 ? ` - ${entry.photos.length} foto` : '';
      score.textContent = `${entry.auditor} - Skor ${entry.score}${photoSummary}`;
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
    photoGeneration += 1;
    pendingPhotoBatches.clear();
    findingPhotos = [];
    renderFindingPhotos();
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
  findingPhotoCamera.addEventListener('change', () => {
    void handleFindingPhotoInput(findingPhotoCamera);
  });
  findingPhotoUpload.addEventListener('change', () => {
    void handleFindingPhotoInput(findingPhotoUpload);
  });
  categorySelect.addEventListener('change', () => {
    resetForm({ keepAlert: true });
    loadDraft();
  });
  clearSignatureButton.addEventListener('click', clearSignature);
  saveDraftButton.addEventListener('click', saveDraft);
  savePdfButton.addEventListener('click', saveCurrentFormAsPdf);
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
    if (pendingPhotoBatches.size > 0) {
      showAlert('Tunggu hingga kompresi foto selesai sebelum submit formulir.', 'alert-info');
      return;
    }
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
  renderFindingPhotos();
  renderAssessmentItems();
  loadDraft();
  renderHistory();
});
