import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  ClipboardCheck,
  FileText,
  BookOpen,
  CreditCard,
  Library,
  GraduationCap,
  Calculator,
  Menu,
  X,
  BarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Staff & HR", href: "/staff", icon: UserCog },
  { name: "Classes", href: "/classes", icon: GraduationCap },
  { name: "Timetable", href: "/timetable", icon: Calendar },
  { name: "Exams", href: "/exams", icon: FileText },

  { name: "Fees Registration", href: "/fees-registration", icon: FileText },
  { name: "Fees Payment", href: "/fees", icon: CreditCard },
  { name: "Estimation", href: "/fees-estimation", icon: Calculator },
  {
    name: "Transfer Certificate",
    href: "/transfer-certificate",
    icon: FileText,
  },
  { name: "Study Certificate", href: "/study-certificate", icon: BookOpen },
  { name: "Library", href: "/library", icon: Library },
  { name: "Reports", href: "/reports", icon: BarChart },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">
                SSCP College
              </h1>
              <p className="text-xs text-muted-foreground">EduSuite</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
