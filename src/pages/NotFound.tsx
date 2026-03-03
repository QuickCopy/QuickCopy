import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold text-slate-900">404</h1>
        <p className="text-xl text-slate-500">Page not found</p>
        <Link to="/">
          <Button className="rounded-xl">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
