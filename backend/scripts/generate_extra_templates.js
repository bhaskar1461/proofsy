const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../storage/templates");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 1. Futuristic Cyber/Tech Matrix Template
function createFuturisticTemplate() {
  const canvas = createCanvas(1056, 746);
  const ctx = canvas.getContext("2d");

  // Dark background with gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1056, 746);
  bgGrad.addColorStop(0, "#090d16");
  bgGrad.addColorStop(0.5, "#0b1329");
  bgGrad.addColorStop(1, "#030712");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1056, 746);

  // Outer Tech Neon Border
  ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 996, 686);

  // Inner Cyan Accent Frame
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, 976, 666);

  // Corner tech brackets
  const corners = [
    [25, 25], [1031, 25], [25, 721], [1031, 721]
  ];
  ctx.fillStyle = "#38bdf8";
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx - 5, cy - 5, 10, 10);
  });

  // Top header branding
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PROOFSY ADVANCED CRYPTOGRAPHIC CERTIFICATION", 528, 90);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Inter, sans-serif";
  ctx.fillText("CERTIFICATE OF ACADEMIC EXCELLENCE", 528, 150);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText("This credential certifies that the distinguished recipient", 528, 200);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "15px Inter, sans-serif";
  ctx.fillText("has successfully fulfilled all curriculum, lab rigor, and project benchmarks for", 528, 380);

  // Divider line
  ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(350, 480);
  ctx.lineTo(706, 480);
  ctx.stroke();

  // Signature labels
  ctx.fillStyle = "#64748b";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("DATE OF ISSUANCE", 280, 620);
  ctx.fillText("VERIFIED SIGNATURE", 770, 620);

  fs.writeFileSync(path.join(dir, "cyber-futuristic.png"), canvas.toBuffer("image/png"));
  console.log("✓ Created cyber-futuristic.png");
}

// 2. Executive Platinum Crest Template
function createExecutivePlatinumTemplate() {
  const canvas = createCanvas(1056, 746);
  const ctx = canvas.getContext("2d");

  // Slate platinum gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1056, 746);
  bgGrad.addColorStop(0, "#f8fafc");
  bgGrad.addColorStop(0.5, "#ffffff");
  bgGrad.addColorStop(1, "#f1f5f9");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1056, 746);

  // Outer Double Gold Border
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 5;
  ctx.strokeRect(32, 32, 992, 682);

  ctx.strokeStyle = "#d97706";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, 976, 666);

  ctx.fillStyle = "#78350f";
  ctx.font = "bold 14px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("INTERNATIONAL ACCREDITATION BOARD", 528, 90);

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 34px Georgia, serif";
  ctx.fillText("Certificate of Special Recognition", 528, 150);

  ctx.fillStyle = "#475569";
  ctx.font = "italic 16px Georgia, serif";
  ctx.fillText("This is officially awarded and verified to", 528, 200);

  ctx.fillStyle = "#475569";
  ctx.font = "15px Inter, sans-serif";
  ctx.fillText("for exemplary performance, leadership distinction, and mastery in", 528, 380);

  // Signature lines
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(180, 600);
  ctx.lineTo(380, 600);
  ctx.moveTo(670, 600);
  ctx.lineTo(870, 600);
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("AUTHENTICATED ISSUE DATE", 280, 625);
  ctx.fillText("ACCREDITING DIRECTOR", 770, 625);

  fs.writeFileSync(path.join(dir, "executive-platinum.png"), canvas.toBuffer("image/png"));
  console.log("✓ Created executive-platinum.png");
}

createFuturisticTemplate();
createExecutivePlatinumTemplate();
