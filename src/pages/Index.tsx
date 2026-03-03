import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Printer } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
            PDF Print Generator
          </h1>
          <p className="text-xl text-slate-500">
            Professional layout tools for ID and Vaccine cards
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-shadow border-2 hover:border-slate-400/50">
            <CardHeader>
              <div className="w-12 h-12 bg-slate-900/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <FileText className="text-slate-900 w-6 h-6" />
              </div>
              <CardTitle>Id Copy Full Page</CardTitle>
              <CardDescription>
                Generate 10 ID copies (5 front/back) on two A4 pages for duplex
                printing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/app">
                <Button className="w-full rounded-xl h-12">Open Tool</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow border-2 hover:border-green-500/50">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <ShieldCheck className="text-green-600 w-6 h-6" />
              </div>
              <CardTitle>Late Birth</CardTitle>
              <CardDescription>
                Generate 2 vaccine card copies (front/back) correctly placed for
                printing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/app">
                <Button className="w-full rounded-xl h-12 bg-green-600 hover:bg-green-700">
                  Open Tool
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow border-2 hover:border-blue-500/50 md:col-span-2">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Printer className="text-blue-600 w-6 h-6" />
              </div>
              <CardTitle>ID Copy - 10 Pairs</CardTitle>
              <CardDescription>
                Generate 10 pairs of ID copies from single front/back images for
                duplex printing.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-xs mx-auto">
              <Link to="/app">
                <Button className="w-full rounded-xl h-12 bg-blue-600 hover:bg-blue-700">
                  Open Tool
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Printer size={16} />
          <span>Optimized for A4 Paper Duplex Printing</span>
        </div>
      </div>
    </div>
  );
};

export default Index;