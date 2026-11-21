/**
 * Menghasilkan nama file sesuai format:
 * ReportTrial_NamaAnak_YYYY-MM-DD.pdf
 */
function buildReportFilename(studentName) {
  const sanitized = (studentName || "Student")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const safeName = sanitized.length > 0 ? sanitized : "Student";
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return `ReportTrial_${safeName}_${yyyy}-${mm}-${dd}.pdf`;
}

/**
 * Meng-export Halaman 1 dan Halaman 2 Template Timedoor ke file PDF A4 berkualitas tinggi
 */
async function generateTrialReportPDF(state, syncTemplateCallback) {
  if (!window.html2canvas || !window.jspdf) {
    throw new Error("Library PDF (html2canvas / jsPDF) belum termuat. Periksa koneksi internet Anda.");
  }

  // Pastikan seluruh data & chart pada template halaman 1 & 2 mutakhir
  syncTemplateCallback();

  const modal = document.getElementById("previewModal");
  const wasHidden = modal.classList.contains("hidden");

  // Tampilkan sementara di luar viewport jika modal sedang tertutup agar html2canvas merender ukuran penuh
  if (wasHidden) {
    modal.style.visibility = "hidden";
    modal.classList.remove("hidden");
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 120));

    const page1El = document.getElementById("pdfPage1");
    const page2El = document.getElementById("pdfPage2");

    const captureOptions = {
      scale: 2.2,
      useCORS: true,
      backgroundColor: "#DCF1FC",
      logging: false
    };

    const canvas1 = await window.html2canvas(page1El, captureOptions);
    const canvas2 = await window.html2canvas(page2El, captureOptions);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const img1 = canvas1.toDataURL("image/png");
    pdf.addImage(img1, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

    pdf.addPage("a4", "portrait");
    const img2 = canvas2.toDataURL("image/png");
    pdf.addImage(img2, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

    const fileName = buildReportFilename(state.studentName);
    pdf.save(fileName);
    return fileName;
  } finally {
    if (wasHidden) {
      modal.classList.add("hidden");
      modal.style.visibility = "";
    }
  }
}