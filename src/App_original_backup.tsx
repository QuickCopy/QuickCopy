import React, { useState } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FileText,
  ShieldCheck,
  Loader2,
  Printer,
  Camera,
  Check,
  ChevronRight,
  Minus,
  Plus,
  X,
  Download,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

interface IdPair {
  front: File | null;
  back: File | null;
  copies: number;
}

type IdPhotoBg = "white" | "lightblue" | "grey";

const App = () => {
  const [activeTab, setActiveTab] = useState<"id" | "vaccine" | "photo">("id");
  const [showAllContent, setShowAllContent] = useState(false);
  const [idPairs, setIdPairs] = useState<IdPair[]>(
    Array.from({ length: 10 }, () => ({
      front: null,
      back: null,
      copies: 1,
    })),
  );
  const [vaccinePairs, setVaccinePairs] = useState<IdPair[]>(
    Array.from({ length: 2 }, () => ({
      front: null,
      back: null,
      copies: 1,
    })),
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

      if (!imglyRemoveBackground) {
        throw new Error("Could not find removeBackground function");
      }

      const blob = await imglyRemoveBackground(idPhotoFront, {
        progress: (key: string, current: number, total: number) => {
          console.log(`Processing: ${key} - ${current}/${total}`);
        },
      });

      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      toast.success("Background removed!");
    } catch (error) {
      console.error("Background removal failed:", error);
      toast.error("Failed to remove background: " + (error as Error).message);
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
    if (field === "copies") {
      newPairs[index] = {
        ...newPairs[index],
        copies: Math.max(1, Math.min(10, value as number)),
      };
    } else {
      newPairs[index] = { ...newPairs[index], [field]: value as File };
    }
    setIdPairs(newPairs);
  };

  const clearIdPair = (index: number) => {
    const newPairs = [...idPairs];
    newPairs[index] = { ...newPairs[index], front: null, back: null };
    setIdPairs(newPairs);
  };

  const updateVaccinePair = (
    index: number,
    field: "front" | "back" | "copies",
    value: File | number | null,
  ) => {
    const newPairs = [...vaccinePairs];
    if (field === "copies") {
      newPairs[index] = {
        ...newPairs[index],
        copies: Math.max(1, Math.min(10, value as number)),
      };
    } else {
      newPairs[index] = { ...newPairs[index], [field]: value as File };
    }
    setVaccinePairs(newPairs);
  };

  const clearVaccinePair = (index: number) => {
    const newPairs = [...vaccinePairs];
    newPairs[index] = { ...newPairs[index], front: null, back: null };
    setVaccinePairs(newPairs);
  };

  // State to manage whether to show landing page or tools
  const [showLandingPage, setShowLandingPage] = useState(true);

  let pdfDoc: PDFDocument;

  const drawImage = async (
    page: any,
    imgFile: File,
    x: number,
    y: number,
    targetW: number,
    targetH: number,
    flipX: boolean = false,
  ) => {
    const bytes = await imgFile.arrayBuffer();
    const img = await pdfDoc
      .embedJpg(bytes)
      .catch(() => pdfDoc.embedPng(bytes));
    const imgRatio = img.width / img.height;
    const targetRatio = targetW / targetH;
    let drawW = targetW;
    let drawH = targetH;
    if (imgRatio > targetRatio) {
      drawH = targetW / imgRatio;
    } else {
      drawW = targetH * imgRatio;
    }
    const offsetXImg = (targetW - drawW) / 2;
    const offsetYImg = (targetH - drawH) / 2;

    if (flipX) {
      page.drawImage(img, {
        x: x + targetW - offsetXImg - drawW,
        y: y + offsetYImg,
        width: drawW,
        height: drawH,
      });
    } else {
      page.drawImage(img, {
        x: x + offsetXImg,
        y: y + offsetYImg,
        width: drawW,
        height: drawH,
      });
    }
  };

  const generateIdCopyPdf = async () => {
    const validPairs = idPairs.filter((p) => p.front && p.back);
    if (validPairs.length === 0) return null;

    pdfDoc = await PDFDocument.create();
    await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const marginTop = 40;
    const marginBottom = 40;
    const marginLeft = 30;
    const marginRight = 30;
    const gap = 8;
    const cols = 2;
    const rowsPerPage = 5;

    const imgWidth =
      (pageWidth - marginLeft - marginRight - gap * (cols - 1)) / cols;
    const imgHeight =
      (pageHeight - marginTop - marginBottom - gap * (rowsPerPage - 1)) /
      rowsPerPage;

    const totalFrontItems = validPairs.reduce((sum, p) => sum + p.copies, 0);
    const totalBackItems = totalFrontItems;
    const frontPages = Math.ceil(totalFrontItems / (cols * rowsPerPage));
    const backPages = Math.ceil(totalBackItems / (cols * rowsPerPage));
    const maxPages = Math.max(frontPages, backPages, 1);

    for (let p = 0; p < maxPages; p++) {
      const frontPage = pdfDoc.addPage([pageWidth, pageHeight]);
      const backPage = pdfDoc.addPage([pageWidth, pageHeight]);

      const frontStartIdx = p * cols * rowsPerPage;
      const frontEndIdx = Math.min(
        frontStartIdx + cols * rowsPerPage,
        totalFrontItems,
      );
      const backStartIdx = p * cols * rowsPerPage;
      const backEndIdx = Math.min(
        backStartIdx + cols * rowsPerPage,
        totalBackItems,
      );

      let frontItemIdx = 0;
      for (const pair of validPairs) {
        for (let c = 0; c < pair.copies; c++) {
          if (frontItemIdx >= frontStartIdx && frontItemIdx < frontEndIdx) {
            const idxInPage = frontItemIdx - frontStartIdx;
            const row = Math.floor(idxInPage / cols);
            const col = idxInPage % cols;
            const x = marginLeft + col * (imgWidth + gap);
            const y =
              pageHeight - marginTop - (row + 1) * (imgHeight + gap) + gap;

            await drawImage(frontPage, pair.front!, x, y, imgWidth, imgHeight);
          }
          frontItemIdx++;
        }
      }

      let backItemIdx = 0;
      for (const pair of validPairs) {
        for (let c = 0; c < pair.copies; c++) {
          if (backItemIdx >= backStartIdx && backItemIdx < backEndIdx) {
            const idxInPage = backItemIdx - backStartIdx;
            const row = Math.floor(idxInPage / cols);
            const col = cols - 1 - (idxInPage % cols);
            const x = marginLeft + col * (imgWidth + gap);
            const y =
              pageHeight - marginTop - (row + 1) * (imgHeight + gap) + gap;

            await drawImage(backPage, pair.back!, x, y, imgWidth, imgHeight);
          }
          backItemIdx++;
        }
      }
    }

    return pdfDoc;
  };

  const generateVaccinePdf = async () => {
    const validPairs = vaccinePairs.filter((p) => p.front && p.back);
    if (validPairs.length === 0) return null;

    pdfDoc = await PDFDocument.create();
    await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const marginTop = 40;
    const marginBottom = 40;
    const marginLeft = 30;
    const marginRight = 30;
    const gap = 15;
    const cols = 2;
    const rowsPerPage = 2;

    const imgWidth =
      (pageWidth - marginLeft - marginRight - gap * (cols - 1)) / cols;
    const imgHeight =
      (pageHeight - marginTop - marginBottom - gap * (rowsPerPage - 1)) /
      rowsPerPage;

    const totalFrontItems = validPairs.reduce((sum, p) => sum + p.copies, 0);
    const totalBackItems = totalFrontItems;
    const frontPages = Math.ceil(totalFrontItems / (cols * rowsPerPage));
    const backPages = Math.ceil(totalBackItems / (cols * rowsPerPage));
    const maxPages = Math.max(frontPages, backPages, 1);

    for (let p = 0; p < maxPages; p++) {
      const frontPage = pdfDoc.addPage([pageWidth, pageHeight]);
      const backPage = pdfDoc.addPage([pageWidth, pageHeight]);

      const frontStartIdx = p * cols * rowsPerPage;
      const frontEndIdx = Math.min(
        frontStartIdx + cols * rowsPerPage,
        totalFrontItems,
      );
      const backStartIdx = p * cols * rowsPerPage;
      const backEndIdx = Math.min(
        backStartIdx + cols * rowsPerPage,
        totalBackItems,
      );

      let frontItemIdx = 0;
      for (const pair of validPairs) {
        for (let c = 0; c < pair.copies; c++) {
          if (frontItemIdx >= frontStartIdx && frontItemIdx < frontEndIdx) {
            const idxInPage = frontItemIdx - frontStartIdx;
            const row = Math.floor(idxInPage / cols);
            const col = idxInPage % cols;
            const x = marginLeft + col * (imgWidth + gap);
            const y =
              pageHeight - marginTop - (row + 1) * (imgHeight + gap) + gap;

            await drawImage(frontPage, pair.front!, x, y, imgWidth, imgHeight);
          }
          frontItemIdx++;
        }
      }

      let backItemIdx = 0;
      for (const pair of validPairs) {
        for (let c = 0; c < pair.copies; c++) {
          if (backItemIdx >= backStartIdx && backItemIdx < backEndIdx) {
            const idxInPage = backItemIdx - backStartIdx;
            const row = Math.floor(idxInPage / cols);
            const col = cols - 1 - (idxInPage % cols);
            const x = marginLeft + col * (imgWidth + gap);
            const y =
              pageHeight - marginTop - (row + 1) * (imgHeight + gap) + gap;

            await drawImage(backPage, pair.back!, x, y, imgWidth, imgHeight);
          }
          backItemIdx++;
        }
      }
    }

    return pdfDoc;
  };

  const generateCombinedPdf = async () => {
    const idValidPairs = idPairs.filter((p) => p.front && p.back);
    const vaccineValidPairs = vaccinePairs.filter((p) => p.front && p.back);

    if (idValidPairs.length === 0 && vaccineValidPairs.length === 0) {
      return null;
    }

    const pdfDoc = await PDFDocument.create();
    await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const marginTop = 40;
    const marginBottom = 40;
    const marginLeft = 30;
    const marginRight = 30;

    const idGap = 8;
    const idCols = 2;
    const idRowsPerPage = 5;
    const idImgWidth =
      (pageWidth - marginLeft - marginRight - idGap * (idCols - 1)) / idCols;
    const idImgHeight =
      (pageHeight - marginTop - marginBottom - idGap * (idRowsPerPage - 1)) /
      idRowsPerPage;

    const vaccineGap = 15;
    const vaccineCols = 2;
    const vaccineRowsPerPage = 2;
    const vaccineImgWidth =
      (pageWidth - marginLeft - marginRight - vaccineGap * (vaccineCols - 1)) /
      vaccineCols;
    const vaccineImgHeight =
      (pageHeight -
        marginTop -
        marginBottom -
        vaccineGap * (vaccineRowsPerPage - 1)) /
      vaccineRowsPerPage;

    // Add ID Card pages first
    if (idValidPairs.length > 0) {
      const totalIdFrontItems = idValidPairs.reduce(
        (sum, p) => sum + p.copies,
        0,
      );
      const totalIdBackItems = totalIdFrontItems;
      const idFrontPages = Math.ceil(
        totalIdFrontItems / (idCols * idRowsPerPage),
      );
      const idBackPages = Math.ceil(
        totalIdBackItems / (idCols * idRowsPerPage),
      );
      const maxIdPages = Math.max(idFrontPages, idBackPages, 1);

      for (let p = 0; p < maxIdPages; p++) {
        const frontPage = pdfDoc.addPage([pageWidth, pageHeight]);
        const backPage = pdfDoc.addPage([pageWidth, pageHeight]);

        const frontStartIdx = p * idCols * idRowsPerPage;
        const frontEndIdx = Math.min(
          frontStartIdx + idCols * idRowsPerPage,
          totalIdFrontItems,
        );
        const backStartIdx = p * idCols * idRowsPerPage;
        const backEndIdx = Math.min(
          backStartIdx + idCols * idRowsPerPage,
          totalIdBackItems,
        );

        let frontItemIdx = 0;
        for (const pair of idValidPairs) {
          for (let c = 0; c < pair.copies; c++) {
            if (frontItemIdx >= frontStartIdx && frontItemIdx < frontEndIdx) {
              const idxInPage = frontItemIdx - frontStartIdx;
              const row = Math.floor(idxInPage / idCols);
              const col = idxInPage % idCols;
              const x = marginLeft + col * (idImgWidth + idGap);
              const y =
                pageHeight -
                marginTop -
                (row + 1) * (idImgHeight + idGap) +
                idGap;
              await drawImage(
                frontPage,
                pair.front!,
                x,
                y,
                idImgWidth,
                idImgHeight,
              );
            }
            frontItemIdx++;
          }
        }

        let backItemIdx = 0;
        for (const pair of idValidPairs) {
          for (let c = 0; c < pair.copies; c++) {
            if (backItemIdx >= backStartIdx && backItemIdx < backEndIdx) {
              const idxInPage = backItemIdx - backStartIdx;
              const row = Math.floor(idxInPage / idCols);
              const col = idCols - 1 - (idxInPage % idCols);
              const x = marginLeft + col * (idImgWidth + idGap);
              const y =
                pageHeight -
                marginTop -
                (row + 1) * (idImgHeight + idGap) +
                idGap;
              await drawImage(
                backPage,
                pair.back!,
                x,
                y,
                idImgWidth,
                idImgHeight,
              );
            }
            backItemIdx++;
          }
        }
      }
    }

    // Add Vaccine Card pages
    if (vaccineValidPairs.length > 0) {
      const totalVaccineFrontItems = vaccineValidPairs.reduce(
        (sum, p) => sum + p.copies,
        0,
      );
      const totalVaccineBackItems = totalVaccineFrontItems;
      const vaccineFrontPages = Math.ceil(
        totalVaccineFrontItems / (vaccineCols * vaccineRowsPerPage),
      );
      const vaccineBackPages = Math.ceil(
        totalVaccineBackItems / (vaccineCols * vaccineRowsPerPage),
      );
      const maxVaccinePages = Math.max(vaccineFrontPages, vaccineBackPages, 1);

      for (let p = 0; p < maxVaccinePages; p++) {
        const frontPage = pdfDoc.addPage([pageWidth, pageHeight]);
        const backPage = pdfDoc.addPage([pageWidth, pageHeight]);

        const frontStartIdx = p * vaccineCols * vaccineRowsPerPage;
        const frontEndIdx = Math.min(
          frontStartIdx + vaccineCols * vaccineRowsPerPage,
          totalVaccineFrontItems,
        );
        const backStartIdx = p * vaccineCols * vaccineRowsPerPage;
        const backEndIdx = Math.min(
          backStartIdx + vaccineCols * vaccineRowsPerPage,
          totalVaccineBackItems,
        );

        let frontItemIdx = 0;
        for (const pair of vaccineValidPairs) {
          for (let c = 0; c < pair.copies; c++) {
            if (frontItemIdx >= frontStartIdx && frontItemIdx < frontEndIdx) {
              const idxInPage = frontItemIdx - frontStartIdx;
              const row = Math.floor(idxInPage / vaccineCols);
              const col = idxInPage % vaccineCols;
              const x = marginLeft + col * (vaccineImgWidth + vaccineGap);
              const y =
                pageHeight -
                marginTop -
                (row + 1) * (vaccineImgHeight + vaccineGap) +
                vaccineGap;
              await drawImage(
                frontPage,
                pair.front!,
                x,
                y,
                vaccineImgWidth,
                vaccineImgHeight,
              );
            }
            frontItemIdx++;
          }
        }

        let backItemIdx = 0;
        for (const pair of vaccineValidPairs) {
          for (let c = 0; c < pair.copies; c++) {
            if (backItemIdx >= backStartIdx && backItemIdx < backEndIdx) {
              const idxInPage = backItemIdx - backStartIdx;
              const row = Math.floor(idxInPage / vaccineCols);
              const col = vaccineCols - 1 - (idxInPage % vaccineCols);
              const x = marginLeft + col * (vaccineImgWidth + vaccineGap);
              const y =
                pageHeight -
                marginTop -
                (row + 1) * (vaccineImgHeight + vaccineGap) +
                vaccineGap;
              await drawImage(
                backPage,
                pair.back!,
                x,
                y,
                vaccineImgWidth,
                vaccineImgHeight,
              );
            }
            backItemIdx++;
          }
        }
      }
    }

    return pdfDoc;
  };

  const generateIdPhoto = async (): Promise<{
    blob: Blob;
    filename: string;
  } | null> => {
    const imageSource =
      processedImage ||
      (idPhotoFront ? URL.createObjectURL(idPhotoFront) : null);
    if (!imageSource) return null;

    const bgColors: Record<IdPhotoBg, string> = {
      white: "#FFFFFF",
      lightblue: "#ADD8E6",
      grey: "#808080",
    };
    const bgColor = bgColors[idPhotoBg];

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = 413;
        const height = 531;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        const imgRatio = img.width / img.height;
        const targetRatio = width / height;
        let drawW = width;
        let drawH = height;

        if (imgRatio > targetRatio) {
          drawH = width / imgRatio;
        } else {
          drawW = height * imgRatio;
        }

        const offsetX = (width - drawW) / 2;
        const offsetY = (height - drawH) / 2;

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob: new Blob([blob], { type: "image/jpeg" }),
                filename: "ID_Photo.jpg",
              });
            } else {
              resolve(null);
            }
          },
          "image/jpeg",
          0.85,
        );
      };
      img.onerror = () => resolve(null);
      if (idPhotoFront) {
        img.src = URL.createObjectURL(idPhotoFront);
      }
    });
  };

  const generateAllFiles = async () => {
    const hasId = idPairs.some((p) => p.front && p.back);
    const hasVaccine = vaccinePairs.some((p) => p.front && p.back);
    const hasIdPhoto = idPhotoFront !== null;

    if (!hasId && !hasVaccine && !hasIdPhoto) {
      toast.error("Please upload at least one document");
      return;
    }

    setLoading(true);
    try {
      const files: { name: string; blob: Blob }[] = [];

      // Generate combined PDF for ID and Vaccine cards
      if (hasId || hasVaccine) {
        const combinedPdf = await generateCombinedPdf();
        if (combinedPdf) {
          const bytes = await combinedPdf.save();
          files.push({
            name: "Documents.pdf",
            blob: new Blob([bytes], { type: "application/pdf" }),
          });
        }
      }

      if (hasIdPhoto) {
        const idPhoto = await generateIdPhoto();
        if (idPhoto) {
          files.push({ name: idPhoto.filename, blob: idPhoto.blob });
        }
      }

      for (const file of files) {
        const url = URL.createObjectURL(file.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`${files.length} file(s) generated!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate files");
    } finally {
      setLoading(false);
    }
  };

  // New: Download ID Pdf (combined ID Card + Vaccine Card) as a single PDF
  const handleDownloadIdPdf = async () => {
    setLoading(true);
    try {
      const pdfDoc = await generateCombinedPdf();
      if (!pdfDoc) {
        toast.error("No ID or Vaccine cards to export");
        return;
      }
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ID Pdf.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ID Pdf downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate ID Pdf");
    } finally {
      setLoading(false);
    }
  };

  const CopySelector = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (val: number) => void;
  }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(value - 1)}
        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold active:scale-95 transition-transform"
      >
        -
      </button>
      <span className="w-6 text-center font-bold">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  );

  const BgSelector = ({
    selected,
    onClick,
    color,
    label,
  }: {
    selected: boolean;
    onClick: () => void;
    color: string;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl border-2 transition-all ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full border-2 border-slate-300"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium">{label}</span>
      </div>
    </button>
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
      className="relative rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 active:bg-blue-50 active:border-blue-300 cursor-pointer aspect-[3.25/2.25] flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
    >
      {image ? (
        <img
          src={URL.createObjectURL(image)}
          alt=""
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Camera className="w-8 h-8 text-slate-300" />
          <span className="text-xs text-slate-400 font-medium">{label}</span>
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation - Desktop: Left side, Mobile: Top tabs */}
      <div className="lg:w-20 bg-white lg:border-r border-b lg:border-b-0 flex lg:flex-col">
        <div className="hidden lg:flex flex-col items-center py-4 gap-2 w-full">
          <div className="bg-slate-800 p-3 rounded-xl mb-4">
            <Printer className="text-white w-6 h-6" />
          </div>
          <NavButton
            active={activeTab === "id"}
            onClick={() => setActiveTab("id")}
            icon={<FileText size={22} />}
            label="ID Card"
          />
          <NavButton
            active={activeTab === "vaccine"}
            onClick={() => setActiveTab("vaccine")}
            icon={<ShieldCheck size={22} />}
            label="Vaccine"
          />
          <NavButton
            active={activeTab === "photo"}
            onClick={() => setActiveTab("photo")}
            icon={<Camera size={22} />}
            label="Photo"
          />
        </div>

        {/* Mobile tabs */}
        <div className="flex lg:hidden w-full">
          <button
            onClick={() => {
              setActiveTab("id");
              setShowAllContent(false);
            }}
            className={`flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === "id"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-slate-400"
            }`}
          >
            <FileText size={20} />
            <span className="text-xs font-bold">ID</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("vaccine");
              setShowAllContent(false);
            }}
            className={`flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === "vaccine"
                ? "border-green-500 text-green-600"
                : "border-transparent text-slate-400"
            }`}
          >
            <ShieldCheck size={20} />
            <span className="text-xs font-bold">Vaccine</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("photo");
              setShowAllContent(false);
            }}
            className={`flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              activeTab === "photo"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-400"
            }`}
          >
            <Camera size={20} />
            <span className="text-xs font-bold">Photo</span>
          </button>
          <button
            onClick={() => setShowAllContent(!showAllContent)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-colors ${
              showAllContent
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-slate-400"
            }`}
          >
            <Minus size={20} />
            <span className="text-xs font-bold">All</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">QuickCopy</h1>
            <p className="text-xs text-slate-500">
              Perfect margins. Every flip.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={generateAllFiles}
              disabled={loading}
              className="h-12 px-6 rounded-full bg-slate-800 hover:bg-slate-700 font-semibold gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Printer className="h-5 w-5" />
              )}
              Generate
            </Button>
            <Button
              onClick={handleDownloadIdPdf}
              disabled={loading}
              className="h-12 px-6 rounded-full bg-slate-800 hover:bg-slate-700 font-semibold gap-2"
            >
              <Download size={18} />
              ID Pdf
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === "id" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    ID Card (CNIC)
                  </h2>
                  <p className="text-xs text-slate-500">
                    3.25" × 2.25" • 10 Pairs
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {idPairs.map((pair, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                        #{index + 1}
                      </span>
                      <CopySelector
                        value={pair.copies}
                        onChange={(v) => updateIdPair(index, "copies", v)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <ImageSlot
                        image={pair.front}
                        onClick={() => frontInputRefs.current[index]?.click()}
                        inputRef={(el) => {
                          frontInputRefs.current[index] = el;
                        }}
                        onChange={(e) =>
                          updateIdPair(
                            index,
                            "front",
                            e.target.files?.[0] || null,
                          )
                        }
                        label="Front"
                      />
                      <ImageSlot
                        image={pair.back}
                        onClick={() => backInputRefs.current[index]?.click()}
                        inputRef={(el) => {
                          backInputRefs.current[index] = el;
                        }}
                        onChange={(e) =>
                          updateIdPair(
                            index,
                            "back",
                            e.target.files?.[0] || null,
                          )
                        }
                        label="Back"
                      />
                    </div>
                    {(pair.front || pair.back) && (
                      <button
                        onClick={() => clearIdPair(index)}
                        className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium active:bg-red-100 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "vaccine" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-green-600">
                  Vaccine Card
                </h2>
                <p className="text-xs text-green-500">4.5" × 3.5" • 2 Pairs</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaccinePairs.map((pair, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-4 border-l-4 border-l-green-500 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                        Pair {index + 1}
                      </span>
                      <CopySelector
                        value={pair.copies}
                        onChange={(v) => updateVaccinePair(index, "copies", v)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <ImageSlot
                        image={pair.front}
                        onClick={() =>
                          vaccineFrontInputRefs.current[index]?.click()
                        }
                        inputRef={(el) => {
                          vaccineFrontInputRefs.current[index] = el;
                        }}
                        onChange={(e) =>
                          updateVaccinePair(
                            index,
                            "front",
                            e.target.files?.[0] || null,
                          )
                        }
                        label="Front"
                      />
                      <ImageSlot
                        image={pair.back}
                        onClick={() =>
                          vaccineBackInputRefs.current[index]?.click()
                        }
                        inputRef={(el) => {
                          vaccineBackInputRefs.current[index] = el;
                        }}
                        onChange={(e) =>
                          updateVaccinePair(
                            index,
                            "back",
                            e.target.files?.[0] || null,
                          )
                        }
                        label="Back"
                      />
                    </div>
                    {(pair.front || pair.back) && (
                      <button
                        onClick={() => clearVaccinePair(index)}
                        className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium active:bg-red-100 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "photo" && (
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-blue-600">
                  ID Photo Maker
                </h2>
                <p className="text-xs text-blue-500">
                  35×45mm • AI Background Removal
                </p>
              </div>

              {/* Top photo controls: Clear, Remove Bg, Download */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={resetPhoto}
                  className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 font-medium active:bg-red-100 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={removeBackground}
                  disabled={!idPhotoFront}
                  className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-medium active:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Remove Bg
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const photo = await generateIdPhoto();
                      if (photo) {
                        const url = URL.createObjectURL(photo.blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = photo.filename;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("ID Photo downloaded!");
                      } else {
                        toast.error("No ID Photo to download");
                      }
                    } catch (error) {
                      toast.error("Failed to download");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={!(idPhotoFront || processedImage)}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700 transition-colors"
                >
                  <Download size={18} /> Download
                </button>
              </div>
              <div
                onClick={() =>
                  !processedImage && idPhotoInputRef.current?.click()
                }
                className={`relative rounded-3xl border-2 border-slate-200 bg-slate-50 aspect-[3/4] flex items-center justify-center overflow-hidden ${
                  !processedImage
                    ? "active:bg-blue-50 active:border-blue-300 cursor-pointer"
                    : ""
                }`}
              >
                {processedImage ? (
                  <div
                    className="w-full h-full p-4"
                    style={{
                      backgroundColor:
                        idPhotoBg === "white"
                          ? "#FFFFFF"
                          : idPhotoBg === "lightblue"
                            ? "#ADD8E6"
                            : "#808080",
                    }}
                  >
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : idPhotoFront ? (
                  <img
                    src={URL.createObjectURL(idPhotoFront)}
                    alt="Uploaded"
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="w-16 h-16 text-slate-300" />
                    <span className="text-sm text-slate-500 font-medium">
                      Tap to upload photo
                    </span>
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

              {false && idPhotoFront && !processedImage && (
                <button
                  onClick={removeBackground}
                  disabled={bgRemoving}
                  className="w-full py-3 rounded-xl bg-purple-600 text-white font-medium active:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bgRemoving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Removing Background...
                    </>
                  ) : (
                    <>
                      <User size={18} />
                      Remove Background (AI)
                    </>
                  )}
                </button>
              )}

              {false && processedImage && (
                <>
                  <div className="flex gap-2">
                    <BgSelector
                      selected={idPhotoBg === "white"}
                      onClick={() => setIdPhotoBg("white")}
                      color="#FFFFFF"
                      label="White"
                    />
                    <BgSelector
                      selected={idPhotoBg === "lightblue"}
                      onClick={() => setIdPhotoBg("lightblue")}
                      color="#ADD8E6"
                      label="Light Blue"
                    />
                    <BgSelector
                      selected={idPhotoBg === "grey"}
                      onClick={() => setIdPhotoBg("grey")}
                      color="#808080"
                      label="Grey"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={resetPhoto}
                        className="py-3 rounded-xl bg-red-50 text-red-600 font-medium active:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        Clear
                      </button>
                      <button
                        onClick={async () => {
                          const imgSrc = processedImage;
                          if (!imgSrc) {
                            setLoading(false);
                            toast.error("No image");
                            return;
                          }
                          if (!imgSrc) {
                            setLoading(false);
                            toast.error("No image");
                            return;
                          }
                          setLoading(true);
                          try {
                            const canvas = document.createElement("canvas");
                            const width = 413;
                            const height = 531;
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d")!;

                            const bgColors: Record<IdPhotoBg, string> = {
                              white: "#FFFFFF",
                              lightblue: "#ADD8E6",
                              grey: "#808080",
                            };
                            ctx.fillStyle = bgColors[idPhotoBg];
                            ctx.fillRect(0, 0, width, height);

                            const img = new Image();
                            img.src = imgSrc;
                            await new Promise((resolve) => {
                              img.onload = resolve;
                            });

                            const imgRatio = img.width / img.height;
                            const targetRatio = width / height;
                            let drawW = width;
                            let drawH = height;

                            if (imgRatio > targetRatio) {
                              drawH = width / imgRatio;
                            } else {
                              drawW = height * imgRatio;
                            }

                            const offsetX = (width - drawW) / 2;
                            const offsetY = (height - drawH) / 2;

                            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

                            canvas.toBlob(
                              (blob) => {
                                if (blob) {
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = "ID_Photo.jpg";
                                  link.click();
                                  URL.revokeObjectURL(url);
                                  toast.success("ID Photo downloaded!");
                                }
                              },
                              "image/jpeg",
                              0.85,
                            );
                          } catch (error) {
                            toast.error("Failed to download");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="py-3 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        Single Photo
                      </button>
                      <button
                        onClick={() => {
                          const imgSrc = processedImage;
                          setLoading(true);
                          try {
                            const canvas = document.createElement("canvas");
                            canvas.width = 2480;
                            canvas.height = 3508;
                            const ctx = canvas.getContext("2d");

                            if (ctx) {
                              const img = new Image();
                              img.src = imgSrc!;
                              img.onload = () => {
                                const photoW = 413;
                                const photoH = 531;
                                const margin = 200;
                                const gap = 80;

                                ctx.fillStyle = "#ffffff";
                                ctx.fillRect(0, 0, canvas.width, canvas.height);

                                const bgColors: Record<IdPhotoBg, string> = {
                                  white: "#FFFFFF",
                                  lightblue: "#ADD8E6",
                                  grey: "#808080",
                                };
                                const bgFill = bgColors[idPhotoBg as IdPhotoBg];

                                for (let row = 0; row < 2; row++) {
                                  for (let col = 0; col < 2; col++) {
                                    const x = margin + col * (photoW + gap);
                                    const y = margin + row * (photoH + gap);
                                    ctx.fillStyle = bgFill;
                                    ctx.fillRect(x, y, photoW, photoH);

                                    const imgRatio = img.width / img.height;
                                    const targetRatio = photoW / photoH;
                                    let drawW = photoW;
                                    let drawH = photoH;

                                    if (imgRatio > targetRatio) {
                                      drawH = photoW / imgRatio;
                                    } else {
                                      drawW = photoH * imgRatio;
                                    }

                                    const offsetX = (photoW - drawW) / 2;
                                    const offsetY = (photoH - drawH) / 2;

                                    ctx.drawImage(
                                      img,
                                      x + offsetX,
                                      y + offsetY,
                                      drawW,
                                      drawH,
                                    );
                                  }
                                }

                                const link = document.createElement("a");
                                link.download = "ID_Photo_Sheet.png";
                                link.href = canvas.toDataURL("image/png");
                                link.click();
                                toast.success("Photo sheet downloaded!");
                                setLoading(false);
                              };
                            }
                          } catch (error) {
                            toast.error("Failed to download");
                            setLoading(false);
                          }
                        }}
                        className="py-3 rounded-xl bg-green-600 text-white font-medium active:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <User size={18} />
                        Photo Sheet
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-slate-500 space-y-1 bg-white p-4 rounded-xl">
                <p className="font-medium">Instructions:</p>
                <p>1. Upload a photo</p>
                <p>2. Click "Remove Background" to auto-remove background</p>
                <p>3. Select desired background color</p>
                <p>4. Download single photo or photo sheet</p>
                <p>• 35×45mm (413×531 pixels)</p>
              </div>
            </div>
          )}

          {false && idPhotoFront && !processedImage && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIdPhotoFront(null)}
                className="py-3 rounded-xl bg-red-50 text-red-600 font-medium active:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Clear
              </button>
              <button
                onClick={async () => {
                  if (!idPhotoFront) return;
                  setLoading(true);
                  try {
                    const result = await generateIdPhoto();
                    if (result) {
                      const url = URL.createObjectURL(result.blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = result.filename;
                      link.click();
                      URL.revokeObjectURL(url);
                      toast.success("ID Photo downloaded!");
                    }
                  } catch (error) {
                    toast.error("Failed to download");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="py-3 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Single Photo
              </button>
              <button
                onClick={() => {
                  if (!processedImage) return;
                  setLoading(true);
                  try {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    canvas.width = 2480;
                    canvas.height = 3508;

                    if (ctx && processedImage) {
                      const img = new Image();
                      img.src = processedImage;
                      img.onload = () => {
                        const photoW = 413;
                        const photoH = 531;
                        const margin = 200;
                        const gap = 80;

                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        const bgColors: Record<IdPhotoBg, string> = {
                          white: "#FFFFFF",
                          lightblue: "#ADD8E6",
                          grey: "#808080",
                        };
                        const bgFill = bgColors[idPhotoBg];

                        for (let row = 0; row < 2; row++) {
                          for (let col = 0; col < 2; col++) {
                            const x = margin + col * (photoW + gap);
                            const y = margin + row * (photoH + gap);
                            ctx.fillStyle = bgFill;
                            ctx.fillRect(x, y, photoW, photoH);

                            const imgRatio = img.width / img.height;
                            const targetRatio = photoW / photoH;
                            let drawW = photoW;
                            let drawH = photoH;

                            if (imgRatio > targetRatio) {
                              drawH = photoW / imgRatio;
                            } else {
                              drawW = photoH * imgRatio;
                            }

                            const offsetX = (photoW - drawW) / 2;
                            const offsetY = (photoH - drawH) / 2;

                            ctx.drawImage(
                              img,
                              x + offsetX,
                              y + offsetY,
                              drawW,
                              drawH,
                            );
                          }
                        }

                        const link = document.createElement("a");
                        link.download = "ID_Photo_Sheet.png";
                        link.href = canvas.toDataURL("image/png");
                        link.click();
                        toast.success("Photo sheet downloaded!");
                        setLoading(false);
                      };
                    }
                  } catch (error) {
                    toast.error("Failed to download");
                    setLoading(false);
                  }
                }}
                className="py-3 rounded-xl bg-green-600 text-white font-medium active:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <User size={18} />
                Photo Sheet
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const NavButton = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full py-3 px-2 flex flex-col items-center gap-1 transition-colors ${
      active
        ? "text-slate-800 bg-slate-100"
        : "text-slate-400 hover:text-slate-600"
    }`}
  >
    <div className={`p-2 rounded-xl ${active ? "bg-slate-200" : ""}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase">{label}</span>
  </button>
);

export default App;
