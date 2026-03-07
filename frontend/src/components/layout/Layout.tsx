import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import FacultySidebar from "./FacultySidebar";
import Navbar from "./Navbar";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Get user role from localStorage
  const getUserRole = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return "admin";
    const user = JSON.parse(userStr);
    return user.role || "admin";
  };

  const userRole = getUserRole();
  const isFaculty = userRole === "faculty";

  return (
    <div className="min-h-screen bg-background">
      {isFaculty ? (
        <FacultySidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      ) : (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      <main className="transition-all duration-300 ease-in-out md:ml-64 mt-16 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
