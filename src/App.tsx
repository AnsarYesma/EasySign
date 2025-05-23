import { createSignal } from "solid-js";
import PDFViewer from "./components/PDFViewer.tsx";
import { generateSignedPDF } from "./utils/generateSigned.ts";

export default function App() {
  const [pdfFile, setPdfFile] = createSignal<File | null>(null);
  const [stampImg, setStampImg] = createSignal<string | null>(null);
  const [signImg, setSignImg] = createSignal<string | null>(null);
  const [coords, setCoords] = createSignal({ x: 0, y: 0 });
  const [scale, setScale] = createSignal<number>(1);

  const handlePDFUpload = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) setPdfFile(file);
  };

  const handleImageUpload = (
    e: Event,
    setter: (url: string) => void
  ) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    if (!pdfFile()) return;
    const blob = await generateSignedPDF({
      pdfFile: pdfFile()!,
      stampSrc: stampImg()!,
      signatureSrc: signImg()!,
      x: coords().x,
      y: coords().y,
      scale: scale(),
    });
    const url = URL.createObjectURL(blob);
    window.open(url); // or download
  };

  return (
    <div class="p-4">
      <h1 class="text-xl font-bold mb-4">EasySign</h1>

      <div class="space-y-2">
        <label>
          Upload PDF:
          <input type="file" accept="application/pdf" onChange={handlePDFUpload} />
        </label>
        <label>
          Upload Stamp:
          <input type="file" accept="image/png" onChange={(e) => handleImageUpload(e, setStampImg)} />
        </label>
        <label>
          Upload Signature:
          <input type="file" accept="image/png" onChange={(e) => handleImageUpload(e, setSignImg)} />
        </label>
      </div>

      {pdfFile() && (
        <>
          <PDFViewer
            file={pdfFile()!}
            stamp={stampImg()!}
            signature={signImg()!}
            onClickPosition={(x, y) => setCoords({ x, y })}
            onScale={(s) => setScale(s)}
          />
          <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={handleGenerate}>
            Generate Signed PDF
          </button>
        </>
      )}
    </div>
  );
}
