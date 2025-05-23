// src/components/PDFViewer.tsx
import { onMount, onCleanup } from "solid-js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { createSignal } from "solid-js";

// const [clickX, setClickX] = createSignal<number | null>(null);
// const [clickY, setClickY] = createSignal<number | null>(null);
// const [scale, setScale] = createSignal(1);
// ✅ Use CDN worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();


type Props = {
  file: File;
  stamp?: string;
  signature?: string;
  onClickPosition: (x: number, y: number) => void;
  onScale: (s: number) => void;
};

export default function PDFViewer(props: Props) {
  let canvasRef!: HTMLCanvasElement | undefined;
  const [clickX, setClickX] = createSignal<number | null>(null);
  const [clickY, setClickY] = createSignal<number | null>(null);
  const [scale, setScale] = createSignal(1);

  onMount(() => {
    const url = URL.createObjectURL(props.file);

    const renderPdf = async () => {
      try {
        const pdf = await getDocument(url).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 1 });
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.8;

        let s = 1;
        if (viewport.width > maxWidth) {
          s = maxWidth / viewport.width;
        }
        if (viewport.height * s > maxHeight) {
          s = maxHeight / viewport.height;
        }

        setScale(s);
        props.onScale(s);
        console.log(s)
        const scaledViewport = page.getViewport({ scale: s });

        const canvas = canvasRef!;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
      } catch (err) {
        console.error("Error rendering PDF:", err);
      }
    };

    renderPdf();
    onCleanup(() => URL.revokeObjectURL(url));
  });

  const handleClick = (e: MouseEvent) => {
    const rect = canvasRef!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setClickX(e.clientX);
    setClickY(e.clientY);
    console.log(`X: ${clickX()}, Y: ${clickY()}, S: ${scale()}`);
    props.onClickPosition(x, y);
  };

  return (
    <div class="relative inline-block mt-4" onClick={handleClick}>
      <canvas
        ref={canvasRef!!}
        class="border shadow"
        style={{ display: "block", border: "solid"}}
      />

      {clickX() !== null && clickY() !== null && props.stamp && (
        <img
          src={props.stamp}
          class="absolute pointer-events-none"
          style={{
            position: "absolute",
            top: `${clickY()!-100*scale()}px`,
            left: `${clickX()!-100*scale()}px`,
            width: `${200 * scale()}px`,
            height: `${200 * scale()}px`,
            'z-index': "10",
          }}
        />
      )}
      {clickX() !== null && clickY() !== null && props.signature && (
        <img
          src={props.signature}
          class="absolute pointer-events-none"
          style={{
            position: "absolute",
            top: `${clickY()!-50 * scale()}px`,
            left: `${clickX()!+50 * scale()}px`,
            width: `${100*scale()}px`,
            height: `${100*scale()}px`,
            'z-index': "9",
          }}
        />
      )}
    </div>
  );
}