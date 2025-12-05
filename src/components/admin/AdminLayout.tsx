import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
