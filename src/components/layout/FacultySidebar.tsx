import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardCheck,
    FileText,
    GraduationCap,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FacultySidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const facultyNavigation = [
    { name: "Dashboard", href: "/faculty-dashboard", icon: LayoutDashboard },
    { name: "My Students", href: "/faculty/students", icon: Users },
    { name: "My Timetable", href: "/faculty/timetable", icon: Calendar },
    { name: "Attendance", href: "/faculty/attendance", icon: ClipboardCheck },
    { name: "Exams & Grades", href: "/faculty/exams", icon: FileText },
];

const FacultySidebar = ({ isOpen, onClose }: FacultySidebarProps) => {
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
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-border px-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-lg font-bold text-foreground">SSCP College</h1>
                            <p className="text-xs text-muted-foreground">Faculty Portal</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex flex-col gap-1 p-4">
                    {facultyNavigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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

export default FacultySidebar;
