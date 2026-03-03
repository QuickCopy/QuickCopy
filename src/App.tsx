import React, { useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Printer, Camera, Loader2 } from "lucide-react";

interface IdPair {
  front: File | null;
  back: File | null;
  copies: number;
}
type IdPhotoBg = "white" | "lightblue" | "grey";

const App = () => {
  const [idPairs, setIdPairs] = useState<IdPair[]>(
    Array.from({ length: 10 }, () => ({ front: null, back: null, copies: 1 })),
  );
  const [vaccinePairs, setVaccinePairs] = useState<IdPair[]>(
    Array.from({ length: 2 }, () => ({ front: null, back: null, copies: 1 })),
  );
  const [idPhotoFront, setIdPhotoFront] = useState<File | null>(null);
  const [idPhotoBg, setIdPhotoBg] = useState<IdPhotoBg>("white");
  const [loading, setLoading] = useState(false);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const frontInputRefs = React.useRef<(HTMLInputElement | null)[]>(
    new Array(10).fill(null),
  );
  const backInputRefs = React.useRef<(HTMLInputElement | null)[]>(
    new Array(10).fill(null),
  );
  const vaccineFrontInputRefs = React.useRef<(HTMLInputElement | null)[]>(
    new Array(2).fill(null),
  );
  const vaccineBackInputRefs = React.useRef<(HTMLInputElement | null)[]>(
    new Array(2).fill(null),
  );
  const idPhotoInputRef = React.useRef<HTMLInputElement>(null);

  const removeBackground = async () => {
    if (!idPhotoFront) return;
    setBgRemoving(true);
    try {
      const module = await import("@imgly/background-removal");
      const imglyRemoveBackground = (module.default ||
        module.removeBackground) as unknown as (
        file: File,
        options?: object,
      ) => Promise<Blob>;
      const blob = await imglyRemoveBackground(idPhotoFront, {
        progress: () => {},
      });
      setProcessedImage(URL.createObjectURL(blob));
      toast.success("Background removed!");
    } catch {
      toast.error("Failed to remove background");
    } finally {
      setBgRemoving(false);
    }
  };

  const resetPhoto = () => {
    setIdPhotoFront(null);
    setProcessedImage(null);
    setIdPhotoBg("white");
  };

  const updateIdPair = (
    index: number,
    field: "front" | "back" | "copies",
    value: File | number | null,
  ) => {
    const newPairs = [...idPairs];
    if (field === "copies")
      newPairs[index] = {
        ...newPairs[index],
        copies: Math.max(1, Math.min(10, value as number)),
      };
    else newPairs[index] = { ...newPairs[index], [field]: value as File };
    setIdPairs(newPairs);
  };

  const clearIdPair = (index: number) => {
    const newPairs = [...idPairs];
    newPairs[index] = {
      ...newPairs[index],
      front: null,
      back: null,
      copies: 1,
    };
    setIdPairs(newPairs);
  };

  const updateVaccinePair = (
    index: number,
    field: "front" | "back" | "copies",
    value: File | number | null,
  ) => {
    const newPairs = [...vaccinePairs];
    if (field === "copies")
      newPairs[index] = {
        ...newPairs[index],
        copies: Math.max(1, Math.min(10, value as number)),
      };
    else newPairs[index] = { ...newPairs[index], [field]: value as File };
    setVaccinePairs(newPairs);
  };

  const clearVaccinePair = (index: number) => {
    const newPairs = [...vaccinePairs];
    newPairs[index] = {
      ...newPairs[index],
      front: null,
      back: null,
      copies: 1,
    };
    setVaccinePairs(newPairs);
  };

  let pdfDoc: PDFDocument;

  const drawImage = async (
    page: any,
    imgFile: File,
    x: number,
    y: number,
    targetW: number,
    targetH: number,
    flipX = false,
  ) => {
    const bytes = await imgFile.arrayBuffer();
    const img = await pdfDoc
      .embedJpg(bytes)
      .catch(() => pdfDoc.embedPng(bytes));
    const imgRatio = img.width / img.height,
      targetRatio = targetW / targetH;
    let drawW = targetW,
      drawH = targetH;
    if (imgRatio > targetRatio) drawH = targetW / imgRatio;
    else drawW = targetH * imgRatio;
    const ox = (targetW - drawW) / 2,
      oy = (targetH - drawH) / 2;
    page.drawImage(img, {
      x: x + (flipX ? targetW - ox - drawW : ox),
      y: y + oy,
      width: drawW,
      height: drawH,
    });
  };

  const generateCombinedPdf = async () => {
    const idValidPairs = idPairs.filter((p) => p.front && p.back);
    const vaccineValidPairs = vaccinePairs.filter((p) => p.front && p.back);
    if (idValidPairs.length === 0 && vaccineValidPairs.length === 0)
      return null;

    const pdfDocNew = await PDFDocument.create();
    await pdfDocNew.embedFont(StandardFonts.Helvetica);

    const pw = 595.28,
      ph = 841.89,
      margin = 15,
      mt = margin,
      mb = margin,
      ml = margin,
      mr = margin;

    // If only ID cards (no vaccine)
    if (idValidPairs.length > 0 && vaccineValidPairs.length === 0) {
      // ID card: 3" x 2" = 216 x 144 pts
      // 10 per page: 2 cols x 5 rows
      const idW = 216;
      const idH = 144;
      const idGap = 5;
      const idCols = 2,
        idRows = 5;

      // Collect all ID copies
      const allIds: { front: File; back: File }[] = [];
      idValidPairs.forEach((p) => {
        for (let i = 0; i < p.copies; i++)
          allIds.push({ front: p.front!, back: p.back! });
      });

      const totalIds = allIds.length;
      const pages = Math.ceil(totalIds / 10);

      for (let p = 0; p < pages; p++) {
        const frontPage = pdfDocNew.addPage([pw, ph]);
        const backPage = pdfDocNew.addPage([pw, ph]);

        const startIdx = p * 10;
        const endIdx = Math.min(startIdx + 10, totalIds);

        // Front
        for (let i = startIdx; i < endIdx; i++) {
          const idx = i - startIdx;
          const row = Math.floor(idx / idCols);
          const col = idx % idCols;
          const contentHeight = idRows * idH + (idRows - 1) * idGap;
          const yStart = (ph - contentHeight) / 2;
          const x = (pw - (2 * idW + idGap)) / 2 + col * (idW + idGap);
          const y = yStart + (idRows - 1 - row) * (idH + idGap);
          try {
            const bytes = await allIds[i].front.arrayBuffer();
            const img = await pdfDocNew
              .embedJpg(bytes)
              .catch(() => pdfDocNew.embedPng(bytes));
            const ratio = img.width / img.height;
            let dw = idW,
              dh = idH;
            if (ratio > idW / idH) dh = idW / ratio;
            else dw = idH * ratio;
            frontPage.drawImage(img, {
              x: x + (idW - dw) / 2,
              y: y + (idH - dh) / 2,
              width: dw,
              height: dh,
            });
          } catch {}
        }

        // Back (mirrored)
        for (let i = startIdx; i < endIdx; i++) {
          const idx = i - startIdx;
          const row = Math.floor(idx / idCols);
          const col = idCols - 1 - (idx % idCols);
          const contentHeight = idRows * idH + (idRows - 1) * idGap;
          const yStart = (ph - contentHeight) / 2;
          const x = (pw - (2 * idW + idGap)) / 2 + col * (idW + idGap);
          const y = yStart + (idRows - 1 - row) * (idH + idGap);
          try {
            const bytes = await allIds[i].back.arrayBuffer();
            const img = await pdfDocNew
              .embedJpg(bytes)
              .catch(() => pdfDocNew.embedPng(bytes));
            const ratio = img.width / img.height;
            let dw = idW,
              dh = idH;
            if (ratio > idW / idH) dh = idW / ratio;
            else dw = idH * ratio;
            backPage.drawImage(img, {
              x: x + (idW - dw) / 2,
              y: y + (idH - dh) / 2,
              width: dw,
              height: dh,
            });
          } catch {}
        }
      }
      return pdfDocNew;
    }

    // If only vaccine (no ID)
    if (vaccineValidPairs.length > 0 && idValidPairs.length === 0) {
      // Vaccine: 5" x 4" = 360 x 288 pts
      // 4 per page: 1 col x 4 rows
      const vW = 360;
      const vH = 288;
      const vGap = 15;
      const vCols = 1;
      const vRows = 4;

      const allVax: { front: File; back: File }[] = [];
      vaccineValidPairs.forEach((p) => {
        for (let i = 0; i < p.copies; i++)
          allVax.push({ front: p.front!, back: p.back! });
      });

      const totalVax = allVax.length;
      const pages = Math.ceil(totalVax / 4);

      for (let p = 0; p < pages; p++) {
        const frontPage = pdfDocNew.addPage([pw, ph]);
        const backPage = pdfDocNew.addPage([pw, ph]);

        const startIdx = p * 4;
        const endIdx = Math.min(startIdx + 4, totalVax);

        for (let i = startIdx; i < endIdx; i++) {
          const idx = i - startIdx;
          const row = Math.floor(idx / vCols);
          const col = idx % vCols;
          const x = ml + col * (vW + vGap);
          const y = ph - mt - vH - row * (vH + vGap);
          try {
            const bytes = await allVax[i].front.arrayBuffer();
            const img = await pdfDocNew
              .embedJpg(bytes)
              .catch(() => pdfDocNew.embedPng(bytes));
            const ratio = img.width / img.height;
            let dw = vW,
              dh = vH;
            if (ratio > vW / vH) dh = vW / ratio;
            else dw = vH * ratio;
            frontPage.drawImage(img, {
              x: x + (vW - dw) / 2,
              y: y + (vH - dh) / 2,
              width: dw,
              height: dh,
            });
          } catch {}
        }

        for (let i = startIdx; i < endIdx; i++) {
          const idx = i - startIdx;
          const row = Math.floor(idx / vCols);
          const col = vCols - 1 - (idx % vCols);
          const x = ml + col * (vW + vGap);
          const y = ph - mt - vH - row * (vH + vGap);
          try {
            const bytes = await allVax[i].back.arrayBuffer();
            const img = await pdfDocNew
              .embedJpg(bytes)
              .catch(() => pdfDocNew.embedPng(bytes));
            const ratio = img.width / img.height;
            let dw = vW,
              dh = vH;
            if (ratio > vW / vH) dh = vW / ratio;
            else dw = vH * ratio;
            backPage.drawImage(img, {
              x: x + (vW - dw) / 2,
              y: y + (vH - dh) / 2,
              width: dw,
              height: dh,
            });
          } catch {}
        }
      }
      return pdfDocNew;
    }

    // Mixed ID and Vaccine
    // Layout: 2 columns for ID, vaccine below
    const idW = (pw - ml - mr - 20) / 2;
    const idH = idW * (2.25 / 3.25);
    const idGap = 20;
    const idCols = 2,
      idRows = 2;

    // Vaccine: fit 2 columns on page
    const vW = (pw - ml - mr - 20) / 2;
    const vH = vW * (4 / 5);
    const vGap = 20;
    const vCols = 2;

    const idStartY = ph - mt - idH;

    // Front page
    const frontPage = pdfDocNew.addPage([pw, ph]);

    // Draw ID cards (top area)
    let idIdx = 0;
    for (const pair of idValidPairs) {
      for (let c = 0; c < pair.copies && idIdx < 4; c++) {
        const row = Math.floor(idIdx / idCols);
        const col = idIdx % idCols;
        const x = ml + col * (idW + idGap);
        const y = idStartY - row * (idH + idGap);
        try {
          const bytes = await pair.front!.arrayBuffer();
          const img = await pdfDocNew
            .embedJpg(bytes)
            .catch(() => pdfDocNew.embedPng(bytes));
          const ratio = img.width / img.height;
          let dw = idW,
            dh = idH;
          if (ratio > idW / idH) dh = idW / ratio;
          else dw = idH * ratio;
          frontPage.drawImage(img, {
            x: x + (idW - dw) / 2,
            y: y + (idH - dh) / 2,
            width: dw,
            height: dh,
          });
        } catch {}
        idIdx++;
      }
    }

    // Draw Vaccine cards (bottom area)
    let vaxIdx = 0;
    for (const pair of vaccineValidPairs) {
      for (let c = 0; c < pair.copies && vaxIdx < 2; c++) {
        const col = vaxIdx % vCols;
        const x = ml + col * (vW + vGap);
        const y = mb;
        try {
          const bytes = await pair.front!.arrayBuffer();
          const img = await pdfDocNew
            .embedJpg(bytes)
            .catch(() => pdfDocNew.embedPng(bytes));
          const ratio = img.width / img.height;
          let dw = vW,
            dh = vH;
          if (ratio > vW / vH) dh = vW / ratio;
          else dw = vH * ratio;
          frontPage.drawImage(img, {
            x: x + (vW - dw) / 2,
            y: y + (vH - dh) / 2,
            width: dw,
            height: dh,
          });
        } catch {}
        vaxIdx++;
      }
    }

    // Back page
    const backPage = pdfDocNew.addPage([pw, ph]);

    // Draw ID backs (mirrored)
    idIdx = 0;
    for (const pair of idValidPairs) {
      for (let c = 0; c < pair.copies && idIdx < 4; c++) {
        const row = Math.floor(idIdx / idCols);
        const col = idCols - 1 - (idIdx % idCols);
        const x = ml + col * (idW + idGap);
        const y = idStartY - row * (idH + idGap);
        try {
          const bytes = await pair.back!.arrayBuffer();
          const img = await pdfDocNew
            .embedJpg(bytes)
            .catch(() => pdfDocNew.embedPng(bytes));
          const ratio = img.width / img.height;
          let dw = idW,
            dh = idH;
          if (ratio > idW / idH) dh = idW / ratio;
          else dw = idH * ratio;
          backPage.drawImage(img, {
            x: x + (idW - dw) / 2,
            y: y + (idH - dh) / 2,
            width: dw,
            height: dh,
          });
        } catch {}
        idIdx++;
      }
    }

    // Draw Vaccine backs (mirrored)
    vaxIdx = 0;
    for (const pair of vaccineValidPairs) {
      for (let c = 0; c < pair.copies && vaxIdx < 2; c++) {
        const col = vCols - 1 - (vaxIdx % vCols);
        const x = ml + col * (vW + vGap);
        const y = mb;
        try {
          const bytes = await pair.back!.arrayBuffer();
          const img = await pdfDocNew
            .embedJpg(bytes)
            .catch(() => pdfDocNew.embedPng(bytes));
          const ratio = img.width / img.height;
          let dw = vW,
            dh = vH;
          if (ratio > vW / vH) dh = vW / ratio;
          else dw = vH * ratio;
          backPage.drawImage(img, {
            x: x + (vW - dw) / 2,
            y: y + (vH - dh) / 2,
            width: dw,
            height: dh,
          });
        } catch {}
        vaxIdx++;
      }
    }

    return pdfDocNew;
  };

  const generateIdPhoto = async (): Promise<{
    blob: Blob;
    filename: string;
  } | null> => {
    if (!idPhotoFront && !processedImage) return null;
    const colors: Record<IdPhotoBg, string> = {
      white: "#FFFFFF",
      lightblue: "#ADD8E6",
      grey: "#808080",
    };
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement("canvas");
        cvs.width = 413;
        cvs.height = 531;
        const ctx = cvs.getContext("2d")!;
        ctx.fillStyle = colors[idPhotoBg];
        ctx.fillRect(0, 0, 413, 531);
        let dw = 413,
          dh = 531;
        if (img.width / img.height > 413 / 531)
          dh = (413 / img.width) * img.height;
        else dw = (531 / img.height) * img.width;
        ctx.drawImage(img, (413 - dw) / 2, (531 - dh) / 2, dw, dh);
        cvs.toBlob(
          (b) =>
            b
              ? resolve({
                  blob: new Blob([b], { type: "image/jpeg" }),
                  filename: "ID_Photo.jpg",
                })
              : resolve(null),
          "image/jpeg",
          0.9,
        );
      };
      img.onerror = () => resolve(null);
      img.src = processedImage || URL.createObjectURL(idPhotoFront!);
    });
  };

  const generateAllFiles = async () => {
    const hasId = idPairs.some((p) => p.front && p.back);
    const hasVax = vaccinePairs.some((p) => p.front && p.back);
    if (!hasId && !hasVax) {
      toast.error("Please upload at least one ID or Vaccine card");
      return;
    }
    setLoading(true);
    try {
      const pdf = await generateCombinedPdf();
      if (pdf) {
        const blob = new Blob([await pdf.save()], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Documents.pdf";
        link.click();
        URL.revokeObjectURL(url);
        toast.success("PDF generated!");
      }
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  const CopySelector = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(value - 1)}
        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
      >
        -
      </button>
      <span className="w-4 text-center text-xs font-bold">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
      >
        +
      </button>
    </div>
  );

  const ImageSlot = ({
    image,
    onClick,
    inputRef,
    onChange,
    label,
  }: {
    image: File | null;
    onClick: () => void;
    inputRef: (el: HTMLInputElement | null) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: string;
  }) => (
    <div
      onClick={onClick}
      className="relative rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 active:bg-blue-50 cursor-pointer aspect-[3.25/2.25] flex items-center justify-center overflow-hidden"
    >
      {image ? (
        <img
          src={URL.createObjectURL(image)}
          alt=""
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Camera className="w-6 h-6 text-slate-300" />
          <span className="text-[10px] text-slate-400">{label}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-2 rounded-lg">
            <Printer className="text-white w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">QuickCopy</h1>
            <p className="text-xs text-slate-500">
              Perfect margins. Every flip.
            </p>
          </div>
        </div>
        <Button
          onClick={generateAllFiles}
          disabled={loading}
          className="h-10 px-5 rounded-full bg-slate-800 hover:bg-slate-700 font-semibold gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}{" "}
          Generate PDF
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-3 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - CNIC & Vaccine */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">CNIC Cards</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {idPairs.map((pair, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      CNIC #{i + 1}
                    </span>
                    <CopySelector
                      value={pair.copies}
                      onChange={(v) => updateIdPair(i, "copies", v)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <ImageSlot
                      image={pair.front}
                      onClick={() => frontInputRefs.current[i]?.click()}
                      inputRef={(el) => (frontInputRefs.current[i] = el)}
                      onChange={(e) =>
                        updateIdPair(i, "front", e.target.files?.[0] || null)
                      }
                      label="F"
                    />
                    <ImageSlot
                      image={pair.back}
                      onClick={() => backInputRefs.current[i]?.click()}
                      inputRef={(el) => (backInputRefs.current[i] = el)}
                      onChange={(e) =>
                        updateIdPair(i, "back", e.target.files?.[0] || null)
                      }
                      label="B"
                    />
                  </div>
                  <button
                    onClick={() => clearIdPair(i)}
                    className="w-full text-[10px] text-red-500 hover:text-red-700 font-medium py-0.5"
                  >
                    Clear
                  </button>
                </div>
              ))}
            </div>

            <h2 className="text-lg font-bold text-green-700">Vaccine Cards</h2>
            <div className="grid grid-cols-2 gap-2">
              {vaccinePairs.map((pair, i) => (
                <div
                  key={"vax" + i}
                  className="bg-white rounded-xl p-2 border border-green-200 shadow-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      Vaccine #{i + 1}
                    </span>
                    <CopySelector
                      value={pair.copies}
                      onChange={(v) => updateVaccinePair(i, "copies", v)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <ImageSlot
                      image={pair.front}
                      onClick={() => vaccineFrontInputRefs.current[i]?.click()}
                      inputRef={(el) => (vaccineFrontInputRefs.current[i] = el)}
                      onChange={(e) =>
                        updateVaccinePair(
                          i,
                          "front",
                          e.target.files?.[0] || null,
                        )
                      }
                      label="F"
                    />
                    <ImageSlot
                      image={pair.back}
                      onClick={() => vaccineBackInputRefs.current[i]?.click()}
                      inputRef={(el) => (vaccineBackInputRefs.current[i] = el)}
                      onChange={(e) =>
                        updateVaccinePair(
                          i,
                          "back",
                          e.target.files?.[0] || null,
                        )
                      }
                      label="B"
                    />
                  </div>
                  <button
                    onClick={() => clearVaccinePair(i)}
                    className="w-full text-[10px] text-red-500 hover:text-red-700 font-medium py-0.5"
                  >
                    Clear
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right - ID Photo */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-blue-600">ID Photo</h2>
            <div className="grid grid-cols-3 gap-2 h-full">
              {/* Col 1 - Upload */}
              <div className="flex flex-col">
                <div
                  onClick={() => idPhotoInputRef.current?.click()}
                  className="flex-1 min-h-[140px] rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer active:bg-blue-50"
                >
                  {processedImage ? (
                    <div
                      className="w-full h-full p-2"
                      style={{
                        backgroundColor:
                          idPhotoBg === "white"
                            ? "#fff"
                            : idPhotoBg === "lightblue"
                              ? "#ADD8E6"
                              : "#808080",
                      }}
                    >
                      <img
                        src={processedImage}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : idPhotoFront ? (
                    <img
                      src={URL.createObjectURL(idPhotoFront)}
                      alt=""
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera className="w-8 h-8 text-slate-300" />
                      <span className="text-[10px] text-slate-400">Upload</span>
                    </div>
                  )}
                  <input
                    ref={idPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      setIdPhotoFront(e.target.files?.[0] || null);
                      setProcessedImage(null);
                    }}
                  />
                </div>
              </div>
              {/* Col 2 - Colors */}
              <div className="flex flex-col">
                <button
                  onClick={() => setIdPhotoBg("white")}
                  className={`flex-1 min-h-[45px] py-2 rounded-xl border-2 transition-all ${idPhotoBg === "white" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white"></div>
                    <span className="text-xs font-medium">White</span>
                  </div>
                </button>
                <button
                  onClick={() => setIdPhotoBg("lightblue")}
                  className={`flex-1 min-h-[45px] py-2 rounded-xl border-2 transition-all ${idPhotoBg === "lightblue" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-blue-200"></div>
                    <span className="text-xs font-medium">Blue</span>
                  </div>
                </button>
                <button
                  onClick={() => setIdPhotoBg("grey")}
                  className={`flex-1 min-h-[45px] py-2 rounded-xl border-2 transition-all ${idPhotoBg === "grey" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-gray-400"></div>
                    <span className="text-xs font-medium">Gray</span>
                  </div>
                </button>
              </div>
              {/* Col 3 - Actions */}
              <div className="flex flex-col">
                <button
                  onClick={removeBackground}
                  disabled={!idPhotoFront || bgRemoving}
                  className="flex-1 min-h-[45px] py-2 rounded-xl bg-purple-600 text-white font-medium disabled:opacity-50"
                >
                  {bgRemoving ? "Processing..." : "AI Remove Bg"}
                </button>
                <button
                  onClick={resetPhoto}
                  className="flex-1 min-h-[45px] py-2 rounded-xl bg-red-50 text-red-600 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const ph = await generateIdPhoto();
                      if (ph) {
                        const u = URL.createObjectURL(ph.blob);
                        const l = document.createElement("a");
                        l.href = u;
                        l.download = ph.filename;
                        l.click();
                        URL.revokeObjectURL(u);
                        toast.success("Downloaded!");
                      }
                    } catch {
                      toast.error("Failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={!idPhotoFront}
                  className="flex-1 min-h-[45px] py-2 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-50"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
