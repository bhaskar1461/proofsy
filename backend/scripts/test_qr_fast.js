const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function generateCleanFastQRCode(text, size = 110) {
  const scale = 4;
  const canvasSize = size * scale;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');

  // Generate crisp standard QR code buffer with error correction level M and clear quiet zone
  const qrPngBuffer = await QRCode.toBuffer(text, {
    errorCorrectionLevel: 'M',
    type: 'png',
    margin: 2,
    scale: 8,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const qrImage = await loadImage(qrPngBuffer);

  // Clean, crisp white card background with rounded corners
  const radius = 6 * scale;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, radius);
  ctx.fill();

  // Clean, subtle border
  ctx.strokeStyle = '#CBD5E1'; // Slate-300
  ctx.lineWidth = 1.5 * scale;
  drawRoundedRect(ctx, 0.75 * scale, 0.75 * scale, canvasSize - 1.5 * scale, canvasSize - 1.5 * scale, radius);
  ctx.stroke();

  // Draw QR code with internal padding
  const padding = 3 * scale;
  ctx.drawImage(qrImage, padding, padding, canvasSize - (padding * 2), canvasSize - (padding * 2));

  return canvas.toBuffer('image/png');
}

async function run() {
  const buf = await generateCleanFastQRCode("https://proofsy.tech/verify/demo/CERT-12345");
  fs.writeFileSync(path.join(__dirname, 'test_clean_qr.png'), buf);
  console.log("Saved test_clean_qr.png successfully! Size:", buf.length);
}

run();
