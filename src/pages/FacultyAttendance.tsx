import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import { Calendar as CalendarIcon, Save, Users, BookOpen, ArrowLeft, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Student {
    _id: string;
    name: string;
    rollNo: string;
    class: string;
}

interface AttendanceRecord {
    studentId: string;
    studentName: string;
    rollNo: string;
    status: "Present" | "Absent" | "Late";
}

interface ClassInfo {
    className: string;
    periods: any[];
    studentCount: number;
}

const FacultyAttendance = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [facultyProfile, setFacultyProfile] = useState<any>(null);
    const [assignedPeriods, setAssignedPeriods] = useState<any[]>([]);
    const [classesInfo, setClassesInfo] = useState<ClassInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

    useEffect(() => {
        fetchFacultyData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsForClass();
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass && selectedPeriod && selectedDate) {
            fetchExistingAttendance();
        }
    }, [selectedClass, selectedPeriod, selectedDate]);

    const fetchFacultyData = async () => {
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

                // Fetch assigned periods
                const periodsRes = await authFetch(`${API_BASE_URL}/faculty/${profile._id}/periods`);
                if (periodsRes.ok) {
                    const periods = await periodsRes.json();
                    setAssignedPeriods(periods);

                    // Group by class and get student counts
                    await groupClassesInfo(periods);
                }
            }
        } catch (error) {
            console.error("Error fetching faculty data:", error);
            toast.error("Failed to load faculty data");
        }
    };

    const groupClassesInfo = async (periods: any[]) => {
        const classMap = new Map<string, any[]>();

        periods.forEach(period => {
            if (!classMap.has(period.className)) {
                classMap.set(period.className, []);
            }
            classMap.get(period.className)!.push(period);
        });

        // Fetch student counts for each class
        const classesInfoArray: ClassInfo[] = [];

        for (const [className, classPeriods] of classMap.entries()) {
            try {
                const studentsRes = await authFetch(`${API_BASE_URL}/students`);
                if (studentsRes.ok) {
                    const allStudents = await studentsRes.json();
                    const classStudents = allStudents.filter((s: Student) => s.class === className);

                    classesInfoArray.push({
                        className,
                        periods: classPeriods,
                        studentCount: classStudents.length
                    });
                }
            } catch (error) {
                console.error(`Error fetching students for ${className}:`, error);
            }
        }

        setClassesInfo(classesInfoArray);
    };

    const fetchStudentsForClass = async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${API_BASE_URL}/students`);
            if (response.ok) {
                const allStudents = await response.json();
                const classStudents = allStudents.filter((s: Student) => s.class === selectedClass);
                setStudents(classStudents);

                // Initialize attendance records
                setAttendanceRecords(classStudents.map((student: Student) => ({
                    studentId: student._id,
                    studentName: student.name,
                    rollNo: student.rollNo,
                    status: "Present" as const
                })));
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to load students");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExistingAttendance = async () => {
        try {
            const response = await authFetch(
                `${API_BASE_URL}/attendance?date=${selectedDate}&className=${selectedClass}&period=${selectedPeriod}`
            );

            if (response.ok) {
                const data = await response.json();
                if (data && data.records && data.records.length > 0) {
                    setAttendanceRecords(data.records);
                    setHasExistingAttendance(true);
                    setIsEditing(false); // View mode by default
                    toast.info("Attendance already marked for this period");
                } else {
                    setHasExistingAttendance(false);
                    setIsEditing(true); // Edit mode if no existing data
                }
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setHasExistingAttendance(false);
            setIsEditing(true);
        }
    };

    const handleStatusChange = (studentId: string, status: "Present" | "Absent" | "Late") => {
        if (!isEditing) return; // Only allow changes in edit mode
        setAttendanceRecords(prev =>
            prev.map(record =>
                record.studentId === studentId ? { ...record, status } : record
            )
        );
    };

    const handleSaveAttendance = async () => {
        if (!selectedClass || !selectedPeriod || !selectedDate) {
            toast.error("Please select class, period, and date");
            return;
        }

        setIsSaving(true);
        try {
            // Get subject from assigned period
            const period = assignedPeriods.find(
                p => p.className === selectedClass && p.period === parseInt(selectedPeriod)
            );

            const response = await authFetch(`${API_BASE_URL}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    className: selectedClass,
                    period: parseInt(selectedPeriod),
                    subject: period?.subject || "Unknown",
                    records: attendanceRecords
                }),
            });

            if (response.ok) {
                toast.success("Attendance saved successfully");
                setHasExistingAttendance(true);
                setIsEditing(false); // Switch to view mode after save
            } else {
                const error = await response.json();
                toast.error(error.message || "Failed to save attendance");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error("Failed to save attendance");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditAttendance = () => {
        setIsEditing(true);
        toast.info("You can now edit the attendance");
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reload the original attendance data
        fetchExistingAttendance();
        toast.info("Changes cancelled");
    };

    const handleClassClick = (className: string) => {
        setSelectedClass(className);
        setSelectedPeriod(""); // Reset period selection
    };

    const handleBackToClasses = () => {
        setSelectedClass(null);
        setSelectedPeriod("");
        setStudents([]);
        setAttendanceRecords([]);
    };

    const getAttendanceStats = () => {
        const present = attendanceRecords.filter(r => r.status === "Present").length;
        const absent = attendanceRecords.filter(r => r.status === "Absent").length;
        const late = attendanceRecords.filter(r => r.status === "Late").length;
        return { present, absent, late, total: attendanceRecords.length };
    };

    const stats = getAttendanceStats();

    // Get periods for selected class
    const periodsForClass = assignedPeriods
        .filter(p => p.className === selectedClass)
        .sort((a, b) => a.period - b.period);

    // If no class is selected, show class cards
    if (!selectedClass) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
                    <p className="text-muted-foreground">
                        Select a class to mark attendance
                    </p>
                </div>

                {/* Date Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Select Date
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-xs">
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Class Cards */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Your Classes</h2>
                    {classesInfo.length === 0 ? (
                        <Card>
                            <CardContent className="flex items-center justify-center h-64">
                                <p className="text-muted-foreground">
                                    No classes assigned. Please contact admin.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {classesInfo.map((classInfo) => (
                                <Card
                                    key={classInfo.className}
                                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                                    onClick={() => handleClassClick(classInfo.className)}
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{classInfo.className}</span>
                                            <Badge variant="secondary">
                                                {classInfo.periods.length} periods
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>{classInfo.studentCount} Students</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <BookOpen className="h-4 w-4" />
                                            <span>
                                                {[...new Set(classInfo.periods.map(p => p.subject))].join(", ")}
                                            </span>
                                        </div>
                                        <Button className="w-full mt-2">
                                            Mark Attendance
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // If class is selected, show attendance marking interface
    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleBackToClasses}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Classes
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {selectedClass}
                    </h1>
                    <p className="text-muted-foreground">
                        Mark attendance for {selectedDate}
                    </p>
                </div>
            </div>

            {/* Period Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Period</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="max-w-md">
                        <Label htmlFor="period">Period</Label>
                        <Select
                            value={selectedPeriod}
                            onValueChange={setSelectedPeriod}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                {periodsForClass.map((period) => (
                                    <SelectItem key={period._id} value={period.period.toString()}>
                                        Period {period.period} - {period.subject}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            {students.length > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Present</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Absent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Late</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Attendance Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading students...</p>
                </div>
            ) : students.length === 0 ? (
                <Card>
                    <CardContent className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">
                            No students found in this class
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Student Attendance</CardTitle>
                        <div className="flex gap-2">
                            {hasExistingAttendance && !isEditing ? (
                                // View mode - show Edit button
                                <Button onClick={handleEditAttendance} variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Attendance
                                </Button>
                            ) : (
                                // Edit mode - show Save and Cancel buttons
                                <>
                                    {hasExistingAttendance && (
                                        <Button onClick={handleCancelEdit} variant="outline">
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    )}
                                    <Button onClick={handleSaveAttendance} disabled={isSaving || !selectedPeriod}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSaving ? "Saving..." : "Save Attendance"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Roll No</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceRecords.map((record) => (
                                    <TableRow key={record.studentId}>
                                        <TableCell className="font-medium">{record.rollNo}</TableCell>
                                        <TableCell>{record.studentName}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={record.status === "Present" ? "default" : "outline"}
                                                    onClick={() => handleStatusChange(record.studentId, "Present")}
                                                    disabled={!isEditing}
                                                >
                                                    Present
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={record.status === "Absent" ? "destructive" : "outline"}
                                                    onClick={() => handleStatusChange(record.studentId, "Absent")}
                                                    disabled={!isEditing}
                                                >
                                                    Absent
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={record.status === "Late" ? "secondary" : "outline"}
                                                    onClick={() => handleStatusChange(record.studentId, "Late")}
                                                    disabled={!isEditing}
                                                >
                                                    Late
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FacultyAttendance;
