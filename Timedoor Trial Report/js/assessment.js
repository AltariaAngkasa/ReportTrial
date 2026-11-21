const ASSESSMENT_CRITERIA = [
  {
    key: "logic",
    label: "Logic",
    shortLabel: "Logic",
    description: "Kemampuan siswa dalam memahami logika, pola, dan menyelesaikan permasalahan."
  },
  {
    key: "agility",
    label: "Agility Learning",
    shortLabel: "Learning Agility",
    description: "Kemampuan siswa dalam memahami instruksi dan mempelajari hal baru."
  },
  {
    key: "literacy",
    label: "Literacy Safety",
    shortLabel: "Literacy Safety",
    description: "Kemampuan memahami penggunaan teknologi secara aman dan bertanggung jawab."
  },
  {
    key: "programming",
    label: "Programming",
    shortLabel: "Programming",
    description: "Kemampuan memahami konsep dasar pemrograman dan menerapkannya."
  },
  {
    key: "creativity",
    label: "Creativity",
    shortLabel: "Creativity",
    description: "Kemampuan berkreasi, berimajinasi, dan menghasilkan ide baru."
  }
];

const SCALE_LABELS = {
  1: "Needs Improvement",
  2: "Developing",
  3: "Average",
  4: "Good",
  5: "Excellent"
};

const INTEREST_LEVELS = [
  {
    score: 5,
    label: "Very Interested",
    desc: "Sangat antusias, aktif bertanya, dan bersemangat mengeksplorasi coding",
    emoji: "😄",
    bgColor: "#0095EB"
  },
  {
    score: 4,
    label: "Interested",
    desc: "Tertarik mengikuti aktivitas coding dan menikmati tantangan yang diberikan",
    emoji: "😊",
    bgColor: "#2AD138"
  },
  {
    score: 3,
    label: "Moderately Interested",
    desc: "Cukup tertarik namun sesekali membutuhkan dorongan dari guru",
    emoji: "😮",
    bgColor: "#FFE629"
  },
  {
    score: 2,
    label: "Slightly Interested",
    desc: "Ketertarikan masih terbatas dan perlu pendekatan bertahap",
    emoji: "😕",
    bgColor: "#FFA126"
  },
  {
    score: 1,
    label: "Not Interested",
    desc: "Belum menunjukkan minat pada aktivitas coding saat sesi trial",
    emoji: "😒",
    bgColor: "#F25757"
  }
];

const STUDENT_TRAITS = [
  {
    id: "fokus",
    label: "Fokus & Kondusif",
    parentPhrase: "mampu menjaga fokus dan mengikuti arahan pembelajaran dengan kondusif"
  },
  {
    id: "distracted",
    label: "Mudah Teralihkan (Distracted)",
    parentPhrase: "sesekali masih mudah teralihkan perhatiannya sehingga membutuhkan pengingat berkala agar tetap fokus"
  },
  {
    id: "hiperaktif",
    label: "Hiperaktif / Impulsif",
    parentPhrase: "memiliki energi dan antusiasme gerak yang tinggi, sehingga sangat terbantu dengan aktivitas praktik yang interaktif"
  },
  {
    id: "mandiri",
    label: "Mandiri & Berani Mencoba",
    parentPhrase: "menunjukkan kemandirian serta keberanian untuk bereksplorasi mencoba fitur baru"
  },
  {
    id: "dependent",
    label: "Sangat Bergantung pada Guru (Dependent)",
    parentPhrase: "masih membutuhkan pendampingan dan konfirmasi bertahap dari guru untuk membangun rasa percaya diri"
  },
  {
    id: "pemalu",
    label: "Pemalu / Pasif",
    parentPhrase: "cenderung mengamati terlebih dahulu dan perlahan mulai nyaman berinteraksi dengan pendekatan yang suportif"
  },
  {
    id: "komunikatif",
    label: "Aktif & Komunikatif",
    parentPhrase: "aktif bertanya serta komunikatif dalam menyampaikan ide selama sesi berlangsung"
  },
  {
    id: "persistent",
    label: "Pantang Menyerah (Persistent)",
    parentPhrase: "memiliki daya juang yang baik dan pantang menyerah saat menyelesaikan tantangan kode"
  },
  {
    id: "frustrasi",
    label: "Mudah Frustrasi / Ngambek",
    parentPhrase: "memerlukan bimbingan langkah demi langkah saat menemui kendala teknis agar tetap termotivasi"
  },
  {
    id: "bosan",
    label: "Mudah Bosan / Lelah",
    parentPhrase: "lebih optimal belajar melalui sesi yang variatif dengan target proyek singkat yang menyenangkan"
  },
  {
    id: "other",
    label: "Other... (Lainnya)",
    parentPhrase: ""
  }
];

function buildParentFriendlyTraitNarrative(selectedIds, otherText = "") {
  const phrases = [];

  selectedIds.forEach((id) => {
    if (id === "other") {
      const cleanOther = otherText.trim();
      if (cleanOther) {
        phrases.push(cleanOther.charAt(0).toLowerCase() + cleanOther.slice(1));
      }
    } else {
      const found = STUDENT_TRAITS.find((t) => t.id === id);
      if (found && found.parentPhrase) phrases.push(found.parentPhrase);
    }
  });

  if (phrases.length === 0) return "";
  if (phrases.length === 1) {
    return `Selama sesi trial, ananda ${phrases[0]}.`;
  }
  const last = phrases.pop();
  return `Selama sesi trial, ananda ${phrases.join(", ")}, serta ${last}.`;
}