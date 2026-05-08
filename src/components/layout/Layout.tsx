import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="flex h-screen bg-surface-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;
