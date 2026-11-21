const STORAGE_KEY = "timedoor_trial_report_draft_v4";

const appState = {
  studentName: "",
  trialDate: "",
  teacherName: "",
  branchName: "",
  scores: {
    logic: 0,
    agility: 0,
    literacy: 0,
    programming: 0,
    creativity: 0
  },
  interestScale: 0,
  selectedTraits: [],
  otherTraitText: "",
  needsSpecialAttention: "TIDAK",
  specialAttentionNote: "",
  selectedPathway: "",
  selectedLearningPaths: []
};

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
  initDefaultDate();
  renderAssessmentInputs();
  renderInterestInputs();
  renderTraitInputs();
  renderPathwayCards();
  loadDraftFromStorage();
  bindEvents();
  refreshAllUI();
});

function initDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  appState.trialDate = `${yyyy}-${mm}-${dd}`;

  const dateInput = document.getElementById("trialDate");
  if (dateInput) dateInput.value = appState.trialDate;
}

// ==================== RENDER FORM COMPONENTS ====================
function renderAssessmentInputs() {
  const container = document.getElementById("assessmentContainer");
  if (!container) return;

  container.innerHTML = ASSESSMENT_CRITERIA.map(
    (item) => `
    <div class="assessment-row" id="row-${item.key}">
      <div class="assessment-info">
        <div class="assessment-title-line">
          <h3>${item.label}</h3>
          <span class="rating-status-tag" id="tag-${item.key}">Belum dinilai</span>
        </div>
        <p>${item.description}</p>
      </div>
      <div class="segmented-rating" role="group" aria-label="${item.label} rating">
        ${[1, 2, 3, 4, 5]
          .map(
            (num) => `
          <button type="button" class="rate-btn" data-key="${item.key}" data-val="${num}" title="${num} - ${SCALE_LABELS[num]}">
            ${num}
          </button>
        `
          )
          .join("")}
      </div>
    </div>
  `
  ).join("");
}

function renderInterestInputs() {
  const grid = document.getElementById("interestSelectorGrid");
  if (!grid) return;

  const ordered = [...INTEREST_LEVELS].sort((a, b) => a.score - b.score);
  grid.innerHTML = ordered
    .map(
      (lvl) => `
    <button type="button" class="interest-option-card" data-interest="${lvl.score}">
      <span class="interest-option-emoji">${lvl.emoji}</span>
      <span class="interest-option-num">${lvl.score} / 5</span>
      <span class="interest-option-label">${lvl.label}</span>
    </button>
  `
    )
    .join("");
}

function renderTraitInputs() {
  const grid = document.getElementById("traitSelectorGrid");
  if (!grid || typeof STUDENT_TRAITS === "undefined") return;

  grid.innerHTML = STUDENT_TRAITS.map(
    (trait) => `
    <label class="trait-chip" id="trait-chip-${trait.id}">
      <input type="checkbox" value="${trait.id}" />
      <span>${trait.label}</span>
    </label>
  `
  ).join("");
}

function renderPathwayCards() {
  const grid = document.getElementById("pathwayGrid");
  if (!grid) return;

  grid.innerHTML = Object.entries(PATHWAY_DATA)
    .map(
      ([name, info]) => `
    <button type="button" class="pathway-card-btn" data-pathway="${name}">
      <span class="pathway-card-tag">${info.ageTag}</span>
      <span class="pathway-card-name">${name}</span>
      <span class="pathway-card-age">${info.learningPaths.length} Learning Paths</span>
    </button>
  `
    )
    .join("");
}

function renderLearningPathCheckboxes() {
  const section = document.getElementById("learningPathSection");
  const listEl = document.getElementById("learningPathList");
  const titleEl = document.getElementById("selectedPathwayTitle");
  const counterEl = document.getElementById("lpCounterBadge");

  if (!section || !listEl) return;

  if (!appState.selectedPathway || !PATHWAY_DATA[appState.selectedPathway]) {
    section.classList.add("hidden");
    listEl.innerHTML = "";
    return;
  }

  section.classList.remove("hidden");
  if (titleEl) titleEl.textContent = appState.selectedPathway;
  if (counterEl) counterEl.textContent = `${appState.selectedLearningPaths.length} Dipilih`;

  const paths = PATHWAY_DATA[appState.selectedPathway].learningPaths;
  listEl.innerHTML = paths
    .map((lp) => {
      const isChecked = appState.selectedLearningPaths.includes(lp.id);
      const subText = lp.output ? `${lp.lessons} • ${lp.output}` : lp.lessons;
      return `
      <label class="lp-checkbox-item ${isChecked ? "checked" : ""}">
        <input type="checkbox" value="${lp.id}" ${isChecked ? "checked" : ""} />
        <div class="lp-item-details">
          <strong>${lp.name}</strong>
          <span>${subText}</span>
        </div>
      </label>
    `;
    })
    .join("");
}

// ==================== EVENT LISTENERS ====================
function bindEvents() {
  // Identitas Siswa
  document.getElementById("studentName")?.addEventListener("input", (e) => {
    appState.studentName = e.target.value;
    validateFieldVisuals();
    refreshAllUI();
  });

  document.getElementById("trialDate")?.addEventListener("change", (e) => {
    appState.trialDate = e.target.value;
    validateFieldVisuals();
    refreshAllUI();
  });

  document.getElementById("teacherName")?.addEventListener("input", (e) => {
    appState.teacherName = e.target.value;
    saveDraftToStorage();
  });

  document.getElementById("branchName")?.addEventListener("input", (e) => {
    appState.branchName = e.target.value;
    saveDraftToStorage();
  });

  // 5 Aspek Assessment
  document.getElementById("assessmentContainer")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".rate-btn");
    if (!btn) return;
    const key = btn.dataset.key;
    const val = Number(btn.dataset.val);
    appState.scores[key] = val;
    refreshAllUI();
  });

  // Interest Scale
  document.getElementById("interestSelectorGrid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".interest-option-card");
    if (!card) return;
    appState.interestScale = Number(card.dataset.interest);
    refreshAllUI();
  });

  // Karakter Anak (Multi-checkbox + Other)
  document.getElementById("traitSelectorGrid")?.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    const traitId = e.target.value;
    if (e.target.checked) {
      if (!appState.selectedTraits.includes(traitId)) {
        appState.selectedTraits.push(traitId);
      }
    } else {
      appState.selectedTraits = appState.selectedTraits.filter((id) => id !== traitId);
    }
    refreshAllUI();
  });

  document.getElementById("otherTraitInput")?.addEventListener("input", (e) => {
    appState.otherTraitText = e.target.value;
    refreshAllUI();
  });

  // Perlakuan / Perhatian Khusus (YA / TIDAK)
  document.querySelectorAll('input[name="specialAttention"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      appState.needsSpecialAttention = e.target.value;
      refreshAllUI();
    });
  });

  document.getElementById("specialNoteInput")?.addEventListener("input", (e) => {
    appState.specialAttentionNote = e.target.value;
    refreshAllUI();
  });

  // Pathway Selection (Reset Learning Path saat berganti Pathway)
  document.getElementById("pathwayGrid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".pathway-card-btn");
    if (!card) return;
    const chosen = card.dataset.pathway;
    if (appState.selectedPathway !== chosen) {
      appState.selectedPathway = chosen;
      appState.selectedLearningPaths = [];
    }
    refreshAllUI();
  });

  // Learning Path Checkbox Selection
  document.getElementById("learningPathList")?.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    const lpId = e.target.value;
    if (e.target.checked) {
      if (!appState.selectedLearningPaths.includes(lpId)) {
        appState.selectedLearningPaths.push(lpId);
      }
    } else {
      appState.selectedLearningPaths = appState.selectedLearningPaths.filter((id) => id !== lpId);
    }
    refreshAllUI();
  });

  // Preview Modal
  document.getElementById("btnPreviewReport")?.addEventListener("click", () => {
    syncPrintableReportTemplate();
    document.getElementById("previewModal")?.classList.remove("hidden");
  });

  document.getElementById("btnCloseModal")?.addEventListener("click", () => {
    document.getElementById("previewModal")?.classList.add("hidden");
  });

  document.getElementById("previewModal")?.addEventListener("click", (e) => {
    if (e.target.id === "previewModal") {
      document.getElementById("previewModal")?.classList.add("hidden");
    }
  });

  // Generate PDF (dari sidebar & dari modal preview)
  document.getElementById("btnGeneratePdf")?.addEventListener("click", handleExportPDF);
  document.getElementById("btnDownloadFromModal")?.addEventListener("click", async () => {
    if (!isFormComplete()) {
      validateFieldVisuals();
      showToast("Lengkapi seluruh data wajib terlebih dahulu sebelum mengunduh PDF.", true);
      return;
    }
    await handleExportPDF();
  });

  // Clear / Reset Form dengan Konfirmasi
  document.getElementById("btnClearForm")?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus seluruh data dan mereset form ke awal?"
    );
    if (!confirmed) return;
    resetAllFormData();
    showToast("Form berhasil direset.");

    appState.studentName = "";
    appState.teacherName = "";
    appState.branchName = "";
    appState.scores = { logic: 0, agility: 0, literacy: 0, programming: 0, creativity: 0 };
    appState.interestScale = 0;
    appState.selectedTraits = [];
    appState.otherTraitText = "";
    appState.needsSpecialAttention = "TIDAK";
    appState.specialAttentionNote = "";
    appState.selectedPathway = "";
    appState.selectedLearningPaths = [];
    initDefaultDate();

    const nameInput = document.getElementById("studentName");
    const teacherInput = document.getElementById("teacherName");
    const branchInput = document.getElementById("branchName");
    const otherTraitInput = document.getElementById("otherTraitInput");
    const specialNoteInput = document.getElementById("specialNoteInput");

    if (nameInput) {
      nameInput.value = "";
      nameInput.classList.remove("input-invalid");
    }
    if (teacherInput) teacherInput.value = "";
    if (branchInput) branchInput.value = "";
    if (otherTraitInput) otherTraitInput.value = "";
    if (specialNoteInput) specialNoteInput.value = "";

    localStorage.removeItem(STORAGE_KEY);
    refreshAllUI();
    showToast("Form berhasil direset.");
  });
}

// ==================== UI SYNCHRONIZATION ====================
function refreshAllUI() {
  // 1. Update tombol rating 1-5
  ASSESSMENT_CRITERIA.forEach((item) => {
    const val = appState.scores[item.key];
    const row = document.getElementById(`row-${item.key}`);
    const tag = document.getElementById(`tag-${item.key}`);
    if (!row || !tag) return;

    row.classList.toggle("rated", val > 0);
    if (val > 0) {
      tag.textContent = `${val}/5 • ${SCALE_LABELS[val]}`;
      tag.classList.add("active");
    } else {
      tag.textContent = "Belum dinilai";
      tag.classList.remove("active");
    }

    row.querySelectorAll(".rate-btn").forEach((btn) => {
      btn.classList.toggle("selected", Number(btn.dataset.val) === val);
    });
  });

  // 2. Update Interest Scale Input & Circular Progress Ring di Sidebar (r = 40)
  const interestObj = INTEREST_LEVELS.find((i) => i.score === appState.interestScale);
  document.querySelectorAll(".interest-option-card").forEach((card) => {
    card.classList.toggle("selected", Number(card.dataset.interest) === appState.interestScale);
  });

  const badgeText = document.getElementById("interestBadgeText");
  const ringFill = document.getElementById("interestRingFill");
  const ringEmoji = document.getElementById("ringEmoji");
  const ringScoreText = document.getElementById("ringScoreText");
  const ringLabelTitle = document.getElementById("ringLabelTitle");
  const ringLabelDesc = document.getElementById("ringLabelDesc");

  const circumference = 2 * Math.PI * 40; // 251.33 sesuai SVG r="40" di index.html
  if (interestObj) {
    if (badgeText) badgeText.textContent = `${interestObj.score}/5 • ${interestObj.label}`;
    if (ringFill) {
      ringFill.style.strokeDashoffset =
        circumference - (interestObj.score / 5) * circumference;
      ringFill.style.stroke = interestObj.bgColor;
    }
    if (ringEmoji) ringEmoji.textContent = interestObj.emoji;
    if (ringScoreText) ringScoreText.textContent = `${interestObj.score}/5`;
    if (ringLabelTitle) ringLabelTitle.textContent = interestObj.label;
    if (ringLabelDesc) ringLabelDesc.textContent = interestObj.desc;
  } else {
    if (badgeText) badgeText.textContent = "Belum dipilih";
    if (ringFill) {
      ringFill.style.strokeDashoffset = circumference;
      ringFill.style.stroke = "#2365A8";
    }
    if (ringEmoji) ringEmoji.textContent = "🤔";
    if (ringScoreText) ringScoreText.textContent = "0/5";
    if (ringLabelTitle) ringLabelTitle.textContent = "Belum Dinilai";
    if (ringLabelDesc) {
      ringLabelDesc.textContent = "Pilih tingkat ketertarikan siswa pada panel Assessment.";
    }
  }

  // 3. Update Karakter Anak & Catatan Perhatian Khusus
  syncTraitsAndSpecialCareUI();

  // 4. Update UI Radar Chart di Sidebar (340x300)
  renderSpiderChart(document.getElementById("uiRadarCanvas"), appState.scores, {
    width: 340,
    height: 300
  });

  renderSpiderChart(document.getElementById("pdfRadarCanvas"), appState.scores, {
    width: 460,
    height: 330,
    dpr: 2.5
  });

  // 5. Update Pathway & Learning Path
  document.querySelectorAll(".pathway-card-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.pathway === appState.selectedPathway);
  });
  renderLearningPathCheckboxes();

  // 6. Update Progress Pill di Top Navbar (0 / 5 Langkah Selesai)
  updateProgressPill();

  // 7. Update tombol Generate PDF & simpan draft
  const complete = isFormComplete();
  const btnGenerate = document.getElementById("btnGeneratePdf");
  const hint = document.getElementById("validationHint");
  if (btnGenerate) btnGenerate.disabled = !complete;
  if (hint) {
    hint.textContent = complete
      ? "✅ Seluruh data wajib lengkap. Siap mengunduh PDF Trial Report."
      : "Lengkapi seluruh data wajib untuk mengaktifkan export PDF.";
  }

  saveDraftToStorage();
}

function syncTraitsAndSpecialCareUI() {
  if (typeof STUDENT_TRAITS !== "undefined") {
    STUDENT_TRAITS.forEach((trait) => {
      const chip = document.getElementById(`trait-chip-${trait.id}`);
      if (!chip) return;
      const checked = appState.selectedTraits.includes(trait.id);
      chip.classList.toggle("checked", checked);
      const cb = chip.querySelector("input");
      if (cb) cb.checked = checked;
    });
  }

  const hasOther = appState.selectedTraits.includes("other");
  document.getElementById("otherTraitWrapper")?.classList.toggle("hidden", !hasOther);

  const previewBox = document.getElementById("traitNarrativePreview");
  const narrative =
    typeof buildParentFriendlyTraitNarrative === "function"
      ? buildParentFriendlyTraitNarrative(appState.selectedTraits, appState.otherTraitText)
      : "";

  if (previewBox) {
    previewBox.innerHTML = narrative
      ? `<strong>Pratinjau di Report:</strong> ${narrative}`
      : "Pilih minimal satu karakter anak untuk melihat pratinjau kalimat laporan.";
  }

  const isYes = appState.needsSpecialAttention === "YA";
  document.getElementById("specialNoteWrapper")?.classList.toggle("hidden", !isYes);
  document.querySelectorAll('input[name="specialAttention"]').forEach((r) => {
    r.checked = r.value === appState.needsSpecialAttention;
  });
}

function updateProgressPill() {
  let completedSteps = 0;
  if (appState.studentName.trim() && appState.trialDate.trim()) completedSteps++;
  if (ASSESSMENT_CRITERIA.every((c) => appState.scores[c.key] >= 1)) completedSteps++;
  if (appState.interestScale >= 1) completedSteps++;
  if (isTraitsAndSpecialValid()) completedSteps++;
  if (appState.selectedPathway && appState.selectedLearningPaths.length >= 1) completedSteps++;

  const pillEl = document.getElementById("formProgressPill");
  const pillText = document.getElementById("formProgressText");
  if (pillEl && pillText) {
    pillText.textContent = `${completedSteps} / 5 Langkah Selesai`;
    pillEl.classList.toggle("ready", completedSteps === 5);
  }
}

// ==================== SYNC TEMPLATE PAGE 1 & PAGE 2 ====================
function syncPrintableReportTemplate() {
  const pathwayName = appState.selectedPathway || "Junior Coder";
  const pathwayInfo = PATHWAY_DATA[pathwayName];

  // Set gambar template asli sesuai pathway
  const frontImg = document.getElementById("imgFrontTemplate");
  const backImg = document.getElementById("imgBackTemplate");
  if (frontImg) frontImg.src = pathwayInfo.frontTemplate;
  if (backImg) backImg.src = pathwayInfo.backTemplate;

  // --- OVERLAY PAGE 1 ---
  const nameEl = document.getElementById("tplStudentName");
  const dateEl = document.getElementById("tplTrialDate");
  const metaEl = document.getElementById("tplMetaSubrow");

  if (nameEl) nameEl.textContent = appState.studentName.trim() || "-";
  if (dateEl) dateEl.textContent = formatDateReadable(appState.trialDate);

  const metaParts = [];
  if (appState.teacherName.trim()) metaParts.push(`Teacher: ${appState.teacherName.trim()}`);
  if (appState.branchName.trim()) metaParts.push(`Branch: ${appState.branchName.trim()}`);
  if (metaEl) metaEl.textContent = metaParts.join("  •  ");

  // Render Spider Chart transparan (ukuran menyesuaikan ruang untuk karakter & catatan)
  renderSpiderChart(document.getElementById("pdfRadarCanvas"), appState.scores, {
    width: 440,
    height: 295,
    dpr: 2.5
  });

  // Render Narasi Karakter Anak di bawah Spider Chart
  const narrativeText =
    typeof buildParentFriendlyTraitNarrative === "function"
      ? buildParentFriendlyTraitNarrative(appState.selectedTraits, appState.otherTraitText)
      : "";

  const tplTraitEl = document.getElementById("tplTraitText");
  if (tplTraitEl) {
    const finalTraitText =
      narrativeText || "Selama sesi trial, ananda mengikuti kegiatan pembelajaran dengan baik.";
    tplTraitEl.innerHTML = `<strong>Karakter Belajar Anak:</strong> ${finalTraitText}`;
  }

  // Render Catatan Perhatian Khusus di bawah Karakter Anak (jika YA)
  const tplSpecialEl = document.getElementById("tplSpecialNoteText");
  if (tplSpecialEl) {
    if (appState.needsSpecialAttention === "YA" && appState.specialAttentionNote.trim()) {
      tplSpecialEl.classList.remove("hidden");
      tplSpecialEl.innerHTML = `<strong>Catatan Pendampingan Khusus:</strong> ${appState.specialAttentionNote.trim()}`;
    } else {
      tplSpecialEl.classList.add("hidden");
      tplSpecialEl.textContent = "";
    }
  }

  // Circular Mini Ring + Posisi Highlight Emoji pada gambar asli
  const miniCircumference = 2 * Math.PI * 23; // 144.51 (sesuai r="23" pada #tplMiniRing)
  const miniRing = document.getElementById("tplMiniRing");
  const miniText = document.getElementById("tplMiniRingText");
  const highlightBox = document.getElementById("tplEmojiHighlight");

  const emojiTopPositions = {
    5: 382, // Very Interested
    4: 466, // Interested
    3: 550, // Moderately Interested
    2: 638, // Slightly Interested
    1: 722  // Not Interested
  };

  const activeInterest = INTEREST_LEVELS.find((i) => i.score === appState.interestScale);
  if (activeInterest) {
    if (miniRing) {
      miniRing.style.strokeDashoffset =
        miniCircumference - (activeInterest.score / 5) * miniCircumference;
      miniRing.style.stroke = activeInterest.bgColor;
    }
    if (miniText) miniText.textContent = `${activeInterest.score}/5`;

    if (highlightBox) {
      highlightBox.classList.remove("hidden");
      highlightBox.style.top = `${emojiTopPositions[activeInterest.score]}px`;
      highlightBox.style.borderColor = activeInterest.bgColor;
    }
  } else {
    if (miniRing) miniRing.style.strokeDashoffset = miniCircumference;
    if (miniText) miniText.textContent = "0/5";
    if (highlightBox) highlightBox.classList.add("hidden");
  }

  // --- OVERLAY PAGE 2 (Tanda Centang pada Kotak Checklist Asli) ---

  // --- OVERLAY PAGE 2 (Tanda Centang pada Kotak Checklist Asli) ---
  const page2El = document.getElementById("pdfPage2");
  if (page2El) {
    page2El.className = "a4-sheet"; // Reset class sebelumnya
    page2El.classList.add(pathwayInfo.layoutType === "3-col" ? "layout-3-col" : "layout-4-col");

    if (pathwayName === "Code Adventure") {
      page2El.classList.add("pathway-code-adventure");
    } else if (pathwayName === "Lua Game Developer") {
      page2El.classList.add("pathway-lua-dev");
    }
  }

  for (let i = 0; i < 4; i++) {
    const slotEl = document.getElementById(`chk-slot-${i}`);
    if (slotEl) slotEl.textContent = "";
  }

  pathwayInfo.learningPaths.forEach((lp) => {
    const isChecked = appState.selectedLearningPaths.includes(lp.id);
    const slotEl = document.getElementById(`chk-slot-${lp.slotIndex}`);
    if (slotEl && isChecked) {
      slotEl.textContent = "✓";
    }
  });

}

// ==================== VALIDATION, PDF EXPORT & STORAGE ====================
function isTraitsAndSpecialValid() {
  const hasTrait =
    appState.selectedTraits.length >= 1 &&
    (!appState.selectedTraits.includes("other") || appState.otherTraitText.trim().length > 0);
  const hasValidSpecial =
    appState.needsSpecialAttention === "TIDAK" ||
    appState.specialAttentionNote.trim().length > 0;
  return hasTrait && hasValidSpecial;
}

function isFormComplete() {
  const hasName = appState.studentName.trim().length > 0;
  const hasDate = appState.trialDate.trim().length > 0;
  const allScoresRated = ASSESSMENT_CRITERIA.every((c) => appState.scores[c.key] >= 1);
  const hasInterest = appState.interestScale >= 1;
  const hasTraitsAndNote = isTraitsAndSpecialValid();
  const hasPathway = Boolean(appState.selectedPathway);
  const hasLearningPath = appState.selectedLearningPaths.length >= 1;

  return (
    hasName &&
    hasDate &&
    allScoresRated &&
    hasInterest &&
    hasTraitsAndNote &&
    hasPathway &&
    hasLearningPath
  );
}

function validateFieldVisuals() {
  const nameInput = document.getElementById("studentName");
  const dateInput = document.getElementById("trialDate");
  if (nameInput) {
    nameInput.classList.toggle("input-invalid", appState.studentName.trim().length === 0);
  }
  if (dateInput) {
    dateInput.classList.toggle("input-invalid", appState.trialDate.trim().length === 0);
  }
}

async function handleExportPDF() {
  if (!isFormComplete()) {
    validateFieldVisuals();
    showToast("Mohon lengkapi seluruh kolom wajib sebelum generate PDF.", true);
    return;
  }

  const btn = document.getElementById("btnGeneratePdf");
  const btnModal = document.getElementById("btnDownloadFromModal");
  const btnText = document.getElementById("btnPdfText");
  const spinner = document.getElementById("btnPdfSpinner");

  if (btn) btn.disabled = true;
  if (btnModal) btnModal.disabled = true;
  if (btnText) btnText.textContent = "Membuat PDF...";
  if (spinner) spinner.classList.remove("hidden");

  try {
    const filename = await generateTrialReportPDF(appState, syncPrintableReportTemplate);

    // Tutup modal preview (jika terbuka) dan kosongkan seluruh form untuk siswa berikutnya
    document.getElementById("previewModal")?.classList.add("hidden");
    resetAllFormData();

    showToast(`Berhasil! ${filename} diunduh & form siap untuk siswa berikutnya.`);
  } catch (err) {
    console.error(err);
    showToast(`Gagal membuat PDF: ${err.message}`, true);
  } finally {
    if (btnText) btnText.textContent = "GENERATE TRIAL REPORT";
    if (spinner) spinner.classList.add("hidden");
    const ready = isFormComplete();
    if (btn) btn.disabled = !ready;
    if (btnModal) btnModal.disabled = false;
  }
}

function formatDateReadable(isoDate) {
  if (!isoDate) return "-";
  const [y, m, d] = isoDate.split("-");
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthName = months[Number(m) - 1] || m;
  return `${Number(d)} ${monthName} ${y}`;
}

function saveDraftToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (_) {
    // Abaikan jika storage penuh atau diblokir
  }
}

function loadDraftFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === "object") {
      Object.assign(appState, saved);
      if (!Array.isArray(appState.selectedTraits)) appState.selectedTraits = [];
      if (!Array.isArray(appState.selectedLearningPaths)) appState.selectedLearningPaths = [];

      const nameInput = document.getElementById("studentName");
      const dateInput = document.getElementById("trialDate");
      const teacherInput = document.getElementById("teacherName");
      const branchInput = document.getElementById("branchName");
      const otherTraitInput = document.getElementById("otherTraitInput");
      const specialNoteInput = document.getElementById("specialNoteInput");

      if (nameInput) nameInput.value = appState.studentName || "";
      if (dateInput && appState.trialDate) dateInput.value = appState.trialDate;
      if (teacherInput) teacherInput.value = appState.teacherName || "";
      if (branchInput) branchInput.value = appState.branchName || "";
      if (otherTraitInput) otherTraitInput.value = appState.otherTraitText || "";
      if (specialNoteInput) specialNoteInput.value = appState.specialAttentionNote || "";
    }
  } catch (_) {
    // Abaikan jika JSON korup
  }
}

let toastTimer = null;
function showToast(message, isError = false) {
  const toast = document.getElementById("toastNotification");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}


/**
 * Membersihkan seluruh state form, input HTML, dan draft localStorage
 */
function resetAllFormData() {
  appState.studentName = "";
  appState.teacherName = "";
  appState.branchName = "";
  appState.scores = { logic: 0, agility: 0, literacy: 0, programming: 0, creativity: 0 };
  appState.interestScale = 0;
  appState.selectedTraits = [];
  appState.otherTraitText = "";
  appState.needsSpecialAttention = "TIDAK";
  appState.specialAttentionNote = "";
  appState.selectedPathway = "";
  appState.selectedLearningPaths = [];
  initDefaultDate();

  const fieldIds = [
    "studentName",
    "teacherName",
    "branchName",
    "otherTraitInput",
    "specialNoteInput"
  ];
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = "";
      el.classList.remove("input-invalid");
    }
  });

  localStorage.removeItem(STORAGE_KEY);
  refreshAllUI();
}