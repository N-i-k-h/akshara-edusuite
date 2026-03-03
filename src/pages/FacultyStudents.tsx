import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Student {
    _id: string;
    name: string;
    rollNo: string;
    email: string;
    phone: string;
    class: string;
    parentName: string;
    parentPhone: string;
    status: string;
    feesPaid: boolean;
}

const FacultyStudents = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [facultyProfile, setFacultyProfile] = useState<any>(null);

    useEffect(() => {
        fetchFacultyStudents();
    }, []);

    const fetchFacultyStudents = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                toast.error("Please log in again");
                return;
            }

            const user = JSON.parse(userStr);

            // Fetch faculty profile
            const profileRes = await authFetch(`${API_BASE_URL}/faculty/profile/${user.id}`);
            if (profileRes.ok) {
                const profile = await profileRes.json();
                setFacultyProfile(profile);

                // Fetch students from assigned classes
                const studentsRes = await authFetch(`${API_BASE_URL}/faculty/${profile._id}/students`);
                if (studentsRes.ok) {
                    const studentsData = await studentsRes.json();
                    setStudents(studentsData);
                } else {
                    toast.error("Failed to load students");
                }
            } else {
                toast.error("Failed to load faculty profile");
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.class.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group students by class
    const studentsByClass = filteredStudents.reduce((acc, student) => {
        if (!acc[student.class]) {
            acc[student.class] = [];
        }
        acc[student.class].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Students</h1>
                <p className="text-muted-foreground">
                    {facultyProfile?.assignedClasses?.length > 0
                        ? `Assigned Classes: ${facultyProfile.assignedClasses.join(", ")}`
                        : "No classes assigned yet"}
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by name, roll no, or class..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading students...</p>
                </div>
            ) : students.length === 0 ? (
                <div className="flex items-center justify-center h-64 border rounded-lg">
                    <div className="text-center">
                        <p className="text-muted-foreground">No students found</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Please contact admin to assign classes to you
                        </p>
                    </div>
                </div>
            ) : (
                /* Students by Class */
                <div className="space-y-6">
                    {Object.entries(studentsByClass).map(([className, classStudents]) => (
                        <div key={className} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold">{className}</h2>
                                <Badge variant="secondary">{classStudents.length} Students</Badge>
                            </div>

                            <div className="rounded-lg border border-border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Roll No</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Parent Name</TableHead>
                                            <TableHead>Parent Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Fees</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {classStudents.map((student) => (
                                            <TableRow key={student._id}>
                                                <TableCell className="font-medium">{student.rollNo}</TableCell>
                                                <TableCell>{student.name}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                <TableCell>{student.phone}</TableCell>
                                                <TableCell>{student.parentName}</TableCell>
                                                <TableCell>{student.parentPhone}</TableCell>
                                                <TableCell>
                                                    <Badge className="bg-green-100 text-green-800">
                                                        {student.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            student.feesPaid
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }
                                                    >
                                                        {student.feesPaid ? "Paid" : "Pending"}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacultyStudents;
