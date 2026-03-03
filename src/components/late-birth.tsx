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
  ShieldCheck,
  Loader2,
  Printer,
  ArrowLeft,
  Camera,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

const LateBirth = () => {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFrontImage(file);
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBackImage(file);
  };

  const generatePdf = async () => {
    if (!frontImage || !backImage) {
      toast.error("Please upload both front and back images");
      return;
    }

    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pageWidth = 595.28;
      const pageHeight = 841.89;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const drawImageWithOffset = async (
        image: File,
        x: number,
        y: number,
        maxWidth: number,
        maxHeight: number,
      ) => {
        const bytes = await image.arrayBuffer();
        const img = await pdfDoc
          .embedJpg(bytes)
          .catch(() => pdfDoc.embedPng(bytes));

        const imgRatio = img.width / img.height;
        const targetRatio = maxWidth / maxHeight;

        let drawW = maxWidth;
        let drawH = maxHeight;

        if (imgRatio > targetRatio) {
          drawW = maxWidth;
          drawH = maxWidth / imgRatio;
        } else {
          drawH = maxHeight;
          drawW = maxHeight * imgRatio;
        }

        const offsetX = (maxWidth - drawW) / 2;
        const offsetY = (maxHeight - drawH) / 2;

        page.drawImage(img, {
          x: x + offsetX,
          y: y + offsetY,
          width: drawW,
          height: drawH,
        });
      };

      await drawImageWithOffset(frontImage, 70, pageHeight - 280, 220, 180);
      await drawImageWithOffset(backImage, 305, pageHeight - 280, 220, 180);

      await drawImageWithOffset(frontImage, 70, pageHeight - 580, 220, 180);
      await drawImageWithOffset(backImage, 305, pageHeight - 580, 220, 180);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Late_Birth_Vaccine.pdf";
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft size={16} /> Back
            </Button>
          </Link>
          <Button
            onClick={generatePdf}
            className="rounded-xl px-8 h-12 shadow-lg bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Printer className="mr-2 h-5 w-5" />
            )}
            Generate Vaccine Card
          </Button>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-green-600 text-white pb-8">
            <CardTitle className="text-3xl flex items-center gap-3">
              <ShieldCheck size={32} />
              Late Birth Vaccine Card
            </CardTitle>
            <CardDescription className="text-green-50/90 text-lg">
              Generate 2 vaccine card copies (front/back) correctly placed for
              printing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <Camera size={20} className="text-green-600" />
                  Front Image
                </h3>
                <div
                  className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden aspect-[3/2] bg-white hover:bg-green-50 cursor-pointer"
                  onClick={() => frontInputRef.current?.click()}
                >
                  {frontImage ? (
                    <img
                      src={URL.createObjectURL(frontImage)}
                      alt="Front preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-4">
                      <Camera className="w-12 h-12 text-green-400" />
                      <div className="flex flex-col gap-2 w-full px-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-10 text-sm w-full rounded-lg shadow-sm bg-green-600"
                          onClick={() => frontInputRef.current?.click()}
                        >
                          <Camera size={14} className="mr-2" /> Scan with Camera
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] w-full bg-white"
                          onClick={() => frontInputRef.current?.click()}
                        >
                          <Upload size={12} className="mr-1" /> Upload File
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFrontChange}
                  />
                </div>
              </div>

              <div className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <Camera size={20} className="text-green-600" />
                  Back Image
                </h3>
                <div
                  className="relative rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden aspect-[3/2] bg-white hover:bg-green-50 cursor-pointer"
                  onClick={() => backInputRef.current?.click()}
                >
                  {backImage ? (
                    <img
                      src={URL.createObjectURL(backImage)}
                      alt="Back preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-4">
                      <Camera className="w-12 h-12 text-green-400" />
                      <div className="flex flex-col gap-2 w-full px-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="h-10 text-sm w-full rounded-lg shadow-sm bg-green-600"
                          onClick={() => backInputRef.current?.click()}
                        >
                          <Camera size={14} className="mr-2" /> Scan with Camera
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] w-full bg-white"
                          onClick={() => backInputRef.current?.click()}
                        >
                          <Upload size={12} className="mr-1" /> Upload File
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Printer size={16} className="text-green-600" />
              <span>
                Generate 2 vaccine card copies on single page for duplex
                printing
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LateBirth;
