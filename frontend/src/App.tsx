import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Staff from "./pages/Staff";
import Classes from "./pages/Classes";
import Timetable from "./pages/Timetable";

import Exams from "./pages/Exams";
import Assignments from "./pages/Assignments";
import Fees from "./pages/Fees";
import FeesRegistration from "./pages/FeesRegistration";
import FeesEstimation from "./pages/FeesEstimation";
import Library from "./pages/Library";
import Reports from "./pages/Reports";
import Expenditure from "./pages/Expenditure";
import TransferCertificate from "./pages/TransferCertificate";
import StudyCertificate from "./pages/StudyCertificate";
import FacultyDashboard from "./pages/FacultyDashboard";
import FacultyStudents from "./pages/FacultyStudents";
import FacultyTimetable from "./pages/FacultyTimetable";

import FacultyExams from "./pages/FacultyExams";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const hasToken = !!localStorage.getItem("token");
  if (!isAuthenticated || !hasToken) {
    // Clear any stale auth data
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const RoleBasedDashboard = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return <Navigate to="/login" replace />;

  const user = JSON.parse(userStr);

  if (user.role === "faculty") {
    return <Navigate to="/faculty-dashboard" replace />;
  }

  return <Dashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<RoleBasedDashboard />} />
              <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
              <Route path="/faculty/students" element={<FacultyStudents />} />
              <Route path="/faculty/timetable" element={<FacultyTimetable />} />

              <Route path="/faculty/exams" element={<FacultyExams />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/students" element={<Students />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/timetable" element={<Timetable />} />

              <Route path="/exams" element={<Exams />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/fees-registration" element={<FeesRegistration />} />
              <Route path="/fees-estimation" element={<FeesEstimation />} />
              <Route
                path="/transfer-certificate"
                element={<TransferCertificate />}
              />
              <Route path="/study-certificate" element={<StudyCertificate />} />
              <Route path="/library" element={<Library />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/expenditure" element={<Expenditure />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
