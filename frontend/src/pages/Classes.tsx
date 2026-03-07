import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";

import {
  Plus,
  Users,
  MapPin,
  User,
  Calendar,
  BookOpen,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface ClassData {
  _id: string;
  grade: string;
  section: string;
  room: string;
  classTeacher: string;
  studentsCount: number;
}

interface Teacher {
  _id: string;
  name: string;
}

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const periods = [
  { period: 1, time: "8:00 - 8:45" },
  { period: 2, time: "8:45 - 9:30" },
  { period: 3, time: "9:45 - 10:30" },
  { period: 4, time: "10:30 - 11:15" },
  { period: 5, time: "11:30 - 12:15" },
  { period: 6, time: "12:15 - 1:00" },
  { period: 7, time: "2:00 - 2:45" },
  { period: 8, time: "2:45 - 3:30" },
];

const Classes = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Students Dialog State
  const [isViewStudentsOpen, setIsViewStudentsOpen] = useState(false);
  const [selectedClassStudents, setSelectedClassStudents] = useState<any[]>([]);
  const [selectedClassForStudents, setSelectedClassForStudents] =
    useState<string>("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // View Timetable Dialog State
  const [isViewTimetableOpen, setIsViewTimetableOpen] = useState(false);
  const [selectedClassTimetable, setSelectedClassTimetable] = useState<any[]>(
    [],
  );
  const [selectedClassForTimetable, setSelectedClassForTimetable] =
    useState<string>("");
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);

  const [newClass, setNewClass] = useState({
    grade: "",
    section: "",
    room: "",
    classTeacher: "",
  });

  const fetchData = async () => {
    try {
      const classesRes = await authFetch(`${API_BASE_URL}/classes`);
      const staffRes = await authFetch(`${API_BASE_URL}/staff`);

      if (classesRes.ok && staffRes.ok) {
        const classesData = await classesRes.json();
        const staffData = await staffRes.json();

        setClassesList(classesData);
        // Show all staff members (not just role='Teacher')
        setTeachers(staffData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load classes data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setNewClass({ ...newClass, [field]: value });
  };

  const handleSaveClass = async () => {
    if (
      !newClass.grade ||
      !newClass.section ||
      !newClass.room ||
      !newClass.classTeacher
    ) {
      toast.error("Please fill in all details");
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });

      if (response.ok) {
        toast.success("Class added successfully");
        setIsAddDialogOpen(false);
        fetchData();
        setNewClass({ grade: "", section: "", room: "", classTeacher: "" });
      } else {
        toast.error("Failed to add class");
      }
    } catch (error) {
      console.error("Error adding class", error);
      toast.error("Failed to add class");
    }
  };

  // --- View Students Logic ---
  const handleViewStudents = async (cls: ClassData) => {
    // Construct class name format used in DB: "Grade X - Section" or "D.Pharm 1 - A"
    const classNameFull = cls.grade.startsWith("D.")
      ? `${cls.grade} - ${cls.section}`
      : `Grade ${cls.grade} - ${cls.section}`;

    setSelectedClassForStudents(classNameFull);
    setIsViewStudentsOpen(true);
    setIsLoadingStudents(true);

    try {
      const response = await authFetch(`${API_BASE_URL}/students`);
      if (response.ok) {
        const allStudents = await response.json();

        // Filter students belonging to this class
        // Match exact class string OR match grade if loose matching needed (but prefer exact)
        const filtered = allStudents.filter(
          (s: any) => s.class === classNameFull || s.class === cls.grade,
        );

        // Fetch real attendance stats for each student
        const studentsWithStats = await Promise.all(
          filtered.map(async (student: any) => {
            let attendancePercentage = 0; // Default
            try {
              const statsRes = await authFetch(
                `${API_BASE_URL}/attendance/student/${student._id}`,
              );
              if (statsRes.ok) {
                const stats = await statsRes.json();
                attendancePercentage = stats.attendancePercentage || 0;
              }
            } catch (e) {
              console.error(
                `Error fetching stats for student ${student._id}`,
                e,
              );
            }

            return {
              ...student,
              attendancePercentage,
            };
          }),
        );

        setSelectedClassStudents(studentsWithStats);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // --- View Timetable Logic ---
  const handleViewTimetable = async (cls: ClassData) => {
    // Construct className to match how Timetable page saves it: "D.Pharm 1 - A" or "Grade 10 - A"
    const classNameStr = cls.grade.startsWith("D.")
      ? `${cls.grade} - ${cls.section}`
      : `Grade ${cls.grade} - ${cls.section}`;

    setSelectedClassForTimetable(classNameStr);
    setIsViewTimetableOpen(true);
    setIsLoadingTimetable(true);

    try {
      const response = await authFetch(
        `${API_BASE_URL}/timetable?className=${encodeURIComponent(classNameStr)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedClassTimetable(data);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
      toast.error("Failed to load timetable");
    } finally {
      setIsLoadingTimetable(false);
    }
  };

  // --- Edit Timetable Logic ---
  const [editingSlot, setEditingSlot] = useState<{
    day: string;
    period: number;
  } | null>(null);
  const [slotForm, setSlotForm] = useState({ subject: "", teacher: "" });

  const handleSlotClick = (day: string, period: number) => {
    const slot = getTimetableSlot(day, period);
    setSlotForm({
      subject: slot?.subject || "",
      teacher: slot?.teacher || "",
    });
    setEditingSlot({ day, period });
  };

  const handleSaveSlot = async () => {
    if (!editingSlot || !selectedClassForTimetable) return;

    try {
      const payload = {
        className: selectedClassForTimetable,
        day: editingSlot.day,
        period: editingSlot.period,
        subject: slotForm.subject,
        teacher: slotForm.teacher,
      };

      const response = await authFetch(`${API_BASE_URL}/timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Timetable updated");
        setEditingSlot(null);
        // Refresh timetable
        const refreshRes = await authFetch(
          `${API_BASE_URL}/timetable?className=${encodeURIComponent(selectedClassForTimetable)}`,
        );
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSelectedClassTimetable(data);
        }
      } else {
        toast.error("Failed to update slot");
      }
    } catch (error) {
      console.error("Error saving slot:", error);
      toast.error("Failed to save");
    }
  };

  const getTimetableSlot = (day: string, period: number) => {
    return selectedClassTimetable.find(
      (slot) => slot.day === day && slot.period === period,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground">Manage classes and sections</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            {/* ... (Keep existing Add Class Dialog Content) ... */}
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={newClass.grade}
                  onValueChange={(val) => handleInputChange("grade", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="D.Pharm 1">D.Pharm 1st Year</SelectItem>
                    <SelectItem value="D.Pharm 2">D.Pharm 2nd Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={newClass.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room Number</Label>
                <Input
                  id="room"
                  value={newClass.room}
                  onChange={(e) => handleInputChange("room", e.target.value)}
                  placeholder="e.g., Room 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher">Class Teacher</Label>
                <Select
                  value={newClass.classTeacher}
                  onValueChange={(val) =>
                    handleInputChange("classTeacher", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher._id} value={teacher.name}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveClass}>Save Class</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center text-muted-foreground">
            Loading classes...
          </div>
        ) : classesList.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground">
            No classes found. Add one to get started.
          </div>
        ) : (
          classesList.map((cls) => (
            <Card
              key={cls._id || Math.random() + ""}
              className="cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">
                    {cls.grade.startsWith("D.")
                      ? cls.grade
                      : `Grade ${cls.grade}`}{" "}
                    - {cls.section}
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {cls.room}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Class Teacher: {cls.classTeacher}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{cls.studentsCount || 0} Students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{cls.room}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewStudents(cls)}
                  >
                    View Students
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewTimetable(cls)}
                  >
                    Timetable
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* DIALOG: VIEW STUDENTS */}
      <Dialog open={isViewStudentsOpen} onOpenChange={setIsViewStudentsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Students - {selectedClassForStudents}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoadingStudents ? (
              <div className="py-8 text-center">Loading students...</div>
            ) : selectedClassStudents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No students found for this class.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Fees Status</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedClassStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">
                        {student.rollNo}
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.parentName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={student.feesPaid ? "outline" : "destructive"}
                          className={
                            student.feesPaid
                              ? "text-green-600 border-green-200 bg-green-50"
                              : ""
                          }
                        >
                          {student.feesPaid ? "Paid" : "Due"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${student.attendancePercentage < 75 ? "text-red-500" : "text-green-600"}`}
                          >
                            {student.attendancePercentage}%
                          </span>
                          {/* Simple Progress Bar Visual */}
                          <div className="h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${student.attendancePercentage < 75 ? "bg-red-500" : "bg-green-500"}`}
                              style={{
                                width: `${student.attendancePercentage}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: VIEW TIMETABLE */}
      <Dialog open={isViewTimetableOpen} onOpenChange={setIsViewTimetableOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Weekly Schedule - {selectedClassForTimetable}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto max-h-[70vh]">
            {isLoadingTimetable ? (
              <div className="py-8 text-center">Loading timetable...</div>
            ) : (
              <Table className="bordered">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 bg-muted">Period</TableHead>
                    {days.map((day) => (
                      <TableHead
                        key={day}
                        className="text-center bg-muted font-bold min-w-[120px]"
                      >
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => (
                    <TableRow key={p.period}>
                      <TableCell className="font-medium bg-muted/50">
                        <div className="text-sm">Period {p.period}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {p.time}
                        </div>
                      </TableCell>
                      {days.map((day) => {
                        const slot = getTimetableSlot(day, p.period);
                        return (
                          <TableCell
                            key={day}
                            className="p-2 border-l cursor-pointer hover:bg-muted/20 transition-colors relative group"
                            onClick={() => handleSlotClick(day, p.period)}
                          >
                            {slot ? (
                              <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center relative">
                                <div className="font-semibold text-blue-900 text-sm">
                                  {slot.subject}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {slot.teacher}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground text-xs h-12 flex items-center justify-center group-hover:block">
                                <span className="hidden group-hover:inline text-xs text-primary">
                                  + Assign
                                </span>
                                <span className="group-hover:hidden">-</span>
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDIT SLOT */}
      <Dialog
        open={!!editingSlot}
        onOpenChange={(open) => !open && setEditingSlot(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Edit Slot: {editingSlot?.day} - Period {editingSlot?.period}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slotSubject">Subject</Label>
              <Input
                id="slotSubject"
                value={slotForm.subject}
                onChange={(e) =>
                  setSlotForm({ ...slotForm, subject: e.target.value })
                }
                placeholder="Subject Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slotTeacher">Teacher</Label>
              <Select
                value={slotForm.teacher}
                onValueChange={(val) =>
                  setSlotForm({ ...slotForm, teacher: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t._id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSlot(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSlot}>Save Slot</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classes;
