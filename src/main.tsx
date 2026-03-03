import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./router";
import "./index.css";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppRouter />
    <Toaster position="top-right" />
  </React.StrictMode>,
);
