import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="transition-all duration-300 ease-in-out md:ml-64 mt-16 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
