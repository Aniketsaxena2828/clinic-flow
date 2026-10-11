import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-[#0F172A] font-sans selection:bg-[#2563EB] selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-3 sm:p-5 lg:p-8 overflow-y-auto bg-[#FAF9F6]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
