import React, { useState, useRef } from "react";
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
  Loader2,
  Printer,
  ArrowLeft,
  Camera,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

const IdCopyTenPairsPage = () => {
  const [frontImages, setFrontImages] = useState<(File | null)[]>(
    new Array(10).fill(null),
  );
  const [backImages, setBackImages] = useState<(File | null)[]>(
    new Array(10).fill(null),
  );
  const [loading, setLoading] = useState(false);

  const frontInputRefs = useRef<(HTMLInputElement | null)[]>(
    new Array(10).fill(null),
  );
  const backInputRefs = useRef<(HTMLInputElement | null)[]>(
    new Array(10).fill(null),
  );

  const updateFrontImage = (index: number, file: File | null) => {
    const newFronts = [...frontImages];
    newFronts[index] = file;
    setFrontImages(newFronts);
  };

  const updateBackImage = (index: number, file: File | null) => {
    const newBacks = [...backImages];
    newBacks[index] = file;
    setBackImages(newBacks);
  };

  const triggerFrontInput = (index: number) => {
    frontInputRefs.current[index]?.click();
  };

  const triggerBackInput = (index: number) => {
    backInputRefs.current[index]?.click();
  };

  const generatePdf = async () => {
    if (frontImages.some((f) => !f) || backImages.some((b) => !b)) {
      toast.error("Please upload all 10 front and 10 back images");
      return;
    }

    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const imgWidth = 216;
      const imgHeight = 144;
      const marginX = 70;
      const marginY = 50;
      const gap = 15;

      const drawRepeatedImage = async (page: any, images: (File | null)[]) => {
        for (let i = 0; i < images.length; i++) {
          if (!images[i]) continue;

          const row = Math.floor(i / 5);
          const col = i % 5;

          const x = marginX + col * (imgWidth + gap);
          const y = pageHeight - marginY - (row + 1) * (imgHeight + gap);

          const bytes = await images[i]!.arrayBuffer();
          const img = await pdfDoc
            .embedJpg(bytes)
            .catch(() => pdfDoc.embedPng(bytes));

          const imgRatio = img.width / img.height;
          const targetRatio = imgWidth / imgHeight;

          let drawW = imgWidth;
          let drawH = imgHeight;

          if (imgRatio > targetRatio) {
            drawW = imgWidth;
            drawH = imgWidth / imgRatio;
          } else {
            drawH = imgHeight;
            drawW = imgHeight * imgRatio;
          }

          const offsetX = (imgWidth - drawW) / 2;
          const offsetY = (imgHeight - drawH) / 2;

          page.drawImage(img, {
            x: x + offsetX,
            y: y + offsetY,
            width: drawW,
            height: drawH,
          });
        }
      };

      const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
      await drawRepeatedImage(page1, frontImages);

      const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
      await drawRepeatedImage(page2, backImages);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ID_Copies_10_Pairs_Duplex.pdf";
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PDF with 10 pairs generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadSlot = ({
    image,
    onClick,
    inputRef,
    onChange,
    color = "blue",
  }: {
    image: File | null;
    onClick: () => void;
    inputRef: (el: HTMLInputElement | null) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    color?: "blue" | "slate";
  }) => {
    const iconColor = color === "blue" ? "text-blue-400" : "text-slate-400";
    const btnClass =
      color === "blue"
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-slate-900 hover:bg-slate-800";

    return (
      <div
        className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden aspect-[3/2] bg-white hover:bg-blue-50 cursor-pointer"
        onClick={onClick}
      >
        {image ? (
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 p-4">
            <Camera className={`w-12 h-12 ${iconColor}`} />
            <div className="flex flex-col gap-2 w-full px-2">
              <Button
                variant="default"
                size="sm"
                className={`h-10 text-sm w-full rounded-lg shadow-sm ${btnClass}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <Camera size={14} className="mr-2" /> Scan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] w-full bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <Upload size={12} className="mr-1" /> Upload
              </Button>
            </div>
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
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft size={16} /> Back
            </Button>
          </Link>
          <Button
            onClick={generatePdf}
            className="rounded-xl px-8 h-12 shadow-lg bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Printer className="mr-2 h-5 w-5" />
            )}
            Generate 10-Pair ID Copy (Duplex)
          </Button>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white pb-8">
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText size={32} />
              ID Copy - 10 Pairs Generator
            </CardTitle>
            <CardDescription className="text-blue-50/90 text-lg">
              Generate 10 pairs of ID copies from single front/back images for
              duplex printing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <Camera size={20} className="text-blue-600" />
                  Front Images (10 IDs)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {frontImages.map((image, index) => (
                    <div key={index} className="space-y-1">
                      <span className="text-xs text-slate-500 font-medium">
                        #{index + 1}
                      </span>
                      <ImageUploadSlot
                        image={image}
                        onClick={() => triggerFrontInput(index)}
                        inputRef={(el) => {
                          frontInputRefs.current[index] = el;
                        }}
                        onChange={(e) =>
                          updateFrontImage(index, e.target.files?.[0] || null)
                        }
                        color="blue"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <Camera size={20} className="text-blue-600" />
                  Back Images (10 IDs)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {backImages.map((image, index) => (
                    <div key={index} className="space-y-1">
                      <span className="text-xs text-slate-500 font-medium">
                        #{index + 1}
                      </span>
                      <ImageUploadSlot
                        image={image}
                        onClick={() => triggerBackInput(index)}
                        inputRef={(el) => {
                          backInputRefs.current[index] = el;
                        }}
                        onChange={(e) =>
                          updateBackImage(index, e.target.files?.[0] || null)
                        }
                        color="blue"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Printer size={16} className="text-blue-600" />
              <span>
                Generate 10 identical ID copies on two pages for duplex printing
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IdCopyTenPairsPage;
