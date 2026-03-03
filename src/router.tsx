import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import IdCopyFullPage from './components/id-copy-full-page';
import IdCopyTenPairsPage from './components/id-copy-ten-pairs';
import LateBirth from './components/late-birth';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/app" element={<App />} />
        <Route path="/id-copy" element={<IdCopyFullPage />} />
        <Route path="/id-copy-10pairs" element={<IdCopyTenPairsPage />} />
        <Route path="/late-birth" element={<LateBirth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;