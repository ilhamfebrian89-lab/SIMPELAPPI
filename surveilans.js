document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('surveillanceForm');
  const surveillanceType = document.getElementById('surveillanceType');
  const birthDate = document.getElementById('surveillanceBirthDate');
  const ageYears = document.getElementById('surveillanceAge');
  const alertBox = document.getElementById('surveillanceAlert');
  const draftStatus = document.getElementById('surveillanceDraftStatus');
  const saveDraftButton = document.getElementById('saveSurveillanceDraftButton');
  const resetButton = document.getElementById('resetSurveillanceFormButton');
  const dynamicSections = Array.from(document.querySelectorAll('[data-surveillance-section]'));

  if (
    !(form instanceof HTMLFormElement) ||
    !(surveillanceType instanceof HTMLSelectElement) ||
    !(birthDate instanceof HTMLInputElement) ||
    !(ageYears instanceof HTMLInputElement) ||
    !alertBox ||
    !draftStatus ||
    !saveDraftButton ||
    !resetButton ||
    dynamicSections.length !== 5
  ) {
    console.warn('Form surveilans lengkap tidak dapat diinisialisasi karena elemen tidak lengkap.');
    return;
  }

  const draftKey = 'simpelappi.surveillance.draft.v1';
  const pendingKey = 'simpelappi.surveillance.pending.v1';
  const historyKey = 'simpelappi.surveillance.history.v1';

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `inline-alert ${type}`;
  }

  function optionalValue(name) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
      return undefined;
    }
    const value = field.value.trim();
    return value || undefined;
  }

  function updateAge() {
    if (!birthDate.value) {
      ageYears.value = '';
      return;
    }
    const [year, month, day] = birthDate.value.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayPassed =
      today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!birthdayPassed) age -= 1;
    ageYears.value = age >= 0 && age <= 150 ? String(age) : '';
  }

  function updateDynamicSections() {
    dynamicSections.forEach((section) => {
      const active = section.dataset.surveillanceSection === surveillanceType.value;
      section.hidden = !active;
      section.querySelectorAll('input, select, textarea').forEach((field) => {
        field.disabled = !active;
        field.required = active && field.hasAttribute('data-dynamic-required');
      });
    });
  }

  function buildDynamicData() {
    if (surveillanceType.value === 'tuberculosis') {
      return {
        tuberculosis: {
          status: optionalValue('tbStatus'),
          geneXpert: optionalValue('tbGeneXpert'),
          bta: optionalValue('tbBta'),
          culture: optionalValue('tbCulture'),
          chestXray: optionalValue('tbChestXray'),
          oatStartDate: optionalValue('tbOatStartDate'),
          oatRegimen: optionalValue('tbOatRegimen'),
          dots: optionalValue('tbDots'),
          sitbReporting: optionalValue('tbSitbReporting')
        }
      };
    }
    if (surveillanceType.value === 'hiv_aids') {
      return {
        hivAids: {
          status: optionalValue('hivStatus'),
          rapidTest: optionalValue('hivRapidTest'),
          elisa: optionalValue('hivElisa'),
          viralLoad: optionalValue('hivViralLoad'),
          cd4: optionalValue('hivCd4'),
          art: optionalValue('hivArt'),
          oiProphylaxis: optionalValue('hivOiProphylaxis'),
          hivCounseling: optionalValue('hivCounseling')
        }
      };
    }
    if (surveillanceType.value === 'outbreak') {
      return {
        outbreak: {
          disease: optionalValue('outbreakDisease'),
          caseStatus: optionalValue('outbreakCaseStatus'),
          onsetDate: optionalValue('outbreakOnsetDate'),
          travelHistory: optionalValue('outbreakTravelHistory'),
          contactHistory: optionalValue('outbreakContactHistory'),
          exposureHistory: optionalValue('outbreakExposureHistory'),
          laboratoryExamination: optionalValue('outbreakLaboratory'),
          pcrGeneXpert: optionalValue('outbreakPcrGeneXpert'),
          radiology: optionalValue('outbreakRadiology'),
          precautionType: optionalValue('outbreakPrecautionType'),
          isolationPlacement: optionalValue('outbreakIsolationPlacement'),
          ppiReporting: optionalValue('outbreakPpiReporting'),
          skdrReporting: optionalValue('outbreakSkdrReporting'),
          healthOfficeReporting: optionalValue('outbreakHealthOfficeReporting'),
          contactInvestigation: optionalValue('outbreakContactInvestigation')
        }
      };
    }
    if (surveillanceType.value === 'other') {
      return {
        otherInfection: {
          infectionName: optionalValue('otherInfectionName'),
          details: optionalValue('otherInfectionDetails')
        }
      };
    }
    return {};
  }

  function decodeAccessToken(token) {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = decodeURIComponent(
        atob(normalized)
          .split('')
          .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Token akses surveilans tidak dapat dibaca.', error);
      return null;
    }
  }

  function buildApiPayload(unitId) {
    const payload = {
      mrn: optionalValue('mrn'),
      fullName: optionalValue('fullName'),
      birthDate: optionalValue('birthDate'),
      ageYears: optionalValue('ageYears') ? Number(optionalValue('ageYears')) : undefined,
      sex: optionalValue('sex'),
      unitId,
      unitName: optionalValue('unitName'),
      roomName: optionalValue('roomName'),
      attendingPhysician: optionalValue('attendingPhysician'),
      admissionDate: optionalValue('admissionDate'),
      surveillanceStartDate: optionalValue('surveillanceStartDate'),
      surveillanceType: optionalValue('surveillanceType'),
      surveillanceSubtype: optionalValue('surveillanceSubtype'),
      diagnosisText: optionalValue('diagnosisText'),
      dynamicData: buildDynamicData(),
      clinicalData: {
        symptoms: optionalValue('clinicalSymptoms'),
        riskFactors: optionalValue('riskFactors')
      },
      supportingExaminations: {
        laboratory: optionalValue('supportLaboratory'),
        culture: optionalValue('supportCulture'),
        radiology: optionalValue('supportRadiology'),
        other: optionalValue('supportOther')
      },
      infectionControl: {
        precautionType: optionalValue('infectionPrecautionType'),
        isolationPlacement: optionalValue('infectionIsolationPlacement'),
        handHygiene: optionalValue('infectionHandHygiene'),
        ppeUse: optionalValue('infectionPpeUse'),
        patientEducation: optionalValue('infectionPatientEducation')
      },
      reportingData: {
        ppiTeam: optionalValue('reportPpiTeam'),
        ppra: optionalValue('reportPpra'),
        skdr: optionalValue('reportSkdr'),
        healthOffice: optionalValue('reportHealthOffice'),
        contactInvestigation: optionalValue('reportContactInvestigation')
      },
      outcome: optionalValue('outcome'),
      verificationData: {
        ipcnName: optionalValue('verificationIpcnName'),
        verificationDate: optionalValue('verificationDate'),
        conclusion: optionalValue('verificationConclusion'),
        notes: optionalValue('verificationNotes')
      }
    };
    return JSON.parse(JSON.stringify(payload));
  }

  function saveDraft() {
    const draft = {
      values: Object.fromEntries(new FormData(form).entries()),
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      draftStatus.textContent = `Draft tersimpan: ${new Date(draft.savedAt).toLocaleString('id-ID')}`;
      showAlert('Draft surveilans tersimpan pada perangkat ini.', 'alert-success');
    } catch (error) {
      console.error('Draft surveilans tidak dapat disimpan.', error);
      showAlert('Draft gagal disimpan. Periksa kapasitas penyimpanan browser.', 'alert-error');
    }
  }

  function loadDraft() {
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft);
      Object.entries(draft.values ?? {}).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          field.value = typeof value === 'string' ? value : '';
        }
      });
      updateDynamicSections();
      updateAge();
      draftStatus.textContent = `Draft dimuat: ${new Date(draft.savedAt).toLocaleString('id-ID')}`;
    } catch (error) {
      console.error('Draft surveilans tidak dapat dibaca.', error);
      showAlert('Draft surveilans rusak dan tidak dapat dimuat.', 'alert-error');
    }
  }

  function queuePendingRecord(payload, reason) {
    try {
      const current = JSON.parse(localStorage.getItem(pendingKey) ?? '[]');
      const queue = Array.isArray(current) ? current : [];
      queue.unshift({ payload, queuedAt: new Date().toISOString(), reason });
      localStorage.setItem(pendingKey, JSON.stringify(queue.slice(0, 50)));
    } catch (error) {
      console.error('Antrean lokal surveilans tidak dapat disimpan.', error);
    }
  }

  async function submitToDatabase() {
    updateDynamicSections();
    if (!form.reportValidity()) {
      showAlert('Lengkapi field wajib sebelum menyimpan data surveilans.', 'alert-error');
      return;
    }

    const token =
      localStorage.getItem('simpelappi.accessToken') ?? sessionStorage.getItem('simpelappi.accessToken');
    const claims = token ? decodeAccessToken(token) : null;
    const unitId = typeof claims?.unit_id === 'string' ? claims.unit_id : null;
    const payload = buildApiPayload(unitId ?? '00000000-0000-0000-0000-000000000000');

    if (!token || !unitId) {
      queuePendingRecord(payload, 'missing_authentication');
      showAlert('Data masuk antrean lokal dan belum tersimpan ke database. Login API diperlukan.', 'alert-error');
      return;
    }

    const apiBaseUrl = (localStorage.getItem('simpelappi.apiBaseUrl') ?? '').replace(/\/$/, '');
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/surveilans/cases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const responseBody = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = responseBody?.errors?.[0]?.detail ?? responseBody?.message ?? `HTTP ${response.status}`;
        queuePendingRecord(payload, detail);
        showAlert(`Data belum tersimpan ke database: ${detail}`, 'alert-error');
        return;
      }

      const history = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
      const records = Array.isArray(history) ? history : [];
      records.unshift({ ...responseBody.data, payload, savedAt: new Date().toISOString() });
      localStorage.setItem(historyKey, JSON.stringify(records.slice(0, 50)));
      localStorage.removeItem(draftKey);
      form.reset();
      updateDynamicSections();
      updateAge();
      draftStatus.textContent = 'Data sudah tersimpan ke database.';
      showAlert(`Data surveilans berhasil disimpan dengan nomor ${responseBody.data.caseNo}.`, 'alert-success');
    } catch (error) {
      console.error('Data surveilans tidak dapat dikirim ke API.', error);
      queuePendingRecord(payload, 'network_error');
      showAlert('Koneksi API gagal. Data masuk antrean lokal dan belum tersimpan ke database.', 'alert-error');
    } finally {
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
    }
  }

  surveillanceType.addEventListener('change', updateDynamicSections);
  birthDate.addEventListener('change', updateAge);
  saveDraftButton.addEventListener('click', saveDraft);
  resetButton.addEventListener('click', () => {
    if (!window.confirm('Kosongkan seluruh isian form surveilans?')) return;
    form.reset();
    localStorage.removeItem(draftKey);
    updateDynamicSections();
    updateAge();
    draftStatus.textContent = 'Draft belum disimpan.';
    showAlert('Form surveilans dikosongkan.', 'alert-info');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitToDatabase();
  });

  updateDynamicSections();
  loadDraft();
});
