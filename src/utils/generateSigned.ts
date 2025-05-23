import { PDFDocument } from "pdf-lib";

// Converts File or base64/URL image into pdf-lib image
async function loadImageBytes(imgSrc: string): Promise<Uint8Array> {
  const res = await fetch(imgSrc);
  return new Uint8Array(await res.arrayBuffer());
}

export async function generateSignedPDF(params: {
  pdfFile: File;
  stampSrc?: string;       // URL or base64 of PNG
  signatureSrc?: string;   // URL or base64 of PNG
  x: number;
  y: number;
  scale: number;
}): Promise<Blob> {
  const { pdfFile, stampSrc, signatureSrc, x, y, scale } = params;

  const pdfBytes = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const page = pdfDoc.getPages()[0];

  const { width, height } = page.getSize();

  // Scale click coordinates to match actual PDF dimensions
  const scaledX = x / scale;
  const scaledY = (height - y/scale); // Flip Y (canvas: top-down, PDF: bottom-up)
  console.log(`${scaledX}, ${scaledY}, ${width}`)

  if (stampSrc) {
    const stampBytes = await loadImageBytes(stampSrc);
    const stampImage = await pdfDoc.embedPng(stampBytes);
    const stampDims = stampImage.scale(200/stampImage.width); // Scale it down

    page.drawImage(stampImage, {
      x: scaledX - stampDims.width / 2,
      y: scaledY - stampDims.height / 2,
      width: stampDims.width,
      height: stampDims.height,
    });
  }

  if (signatureSrc) {
    const sigBytes = await loadImageBytes(signatureSrc);
    const sigImage = await pdfDoc.embedPng(sigBytes);
    const sigDims = sigImage.scale(100 / sigImage.width); // Scale it down

    page.drawImage(sigImage, {
      x: scaledX - sigDims.width / 2 + 100,
      y: scaledY - sigDims.height / 2, // Place below stamp
      width: sigDims.width,
      height: sigDims.height,
    });
  }

  const modifiedBytes = await pdfDoc.save();
  return new Blob([modifiedBytes], { type: "application/pdf" });
}
