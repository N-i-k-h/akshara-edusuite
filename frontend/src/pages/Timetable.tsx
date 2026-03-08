import { Calendar, Plus } from "lucide-react";
import { API_BASE_URL, authFetch } from "@/config";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

interface ClassData {
  _id: string;
  grade: string;
  section: string;
  // ... other fields
}

interface TimetableEntry {
  _id: string;
  className: string;
  day: string;
  period: number;
  subject: string;
  teacher: string;
}

const Timetable = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [classList, setClassList] = useState<ClassData[]>([]);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]); // For Add Class form

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);

  const [newEntry, setNewEntry] = useState({
    day: "Monday",
    period: "1",
    subject: "",
    teacher: "",
  });

  const [newClass, setNewClass] = useState({
    grade: "",
    section: "",
    room: "",
    classTeacher: "",
  });

  // Fetch Classes and Staff
  const fetchData = async () => {
    try {
      const classesRes = await authFetch(`${API_BASE_URL}/classes`);
      const staffRes = await authFetch(`${API_BASE_URL}/staff`);

      if (classesRes.ok && staffRes.ok) {
        const classesData = await classesRes.json();
        const staffData = await staffRes.json();

        setClassList(classesData);
        // Show all staff members (not just role='Teacher')
        setTeachers(staffData);

        if (classesData.length > 0 && !selectedClass) {
          const firstName = `${classesData[0].grade} - ${classesData[0].section}`;
          setSelectedClass(firstName);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Timetable when selectedClass changes
  const fetchTimetable = async () => {
    if (!selectedClass) return;
    try {
      // selectedClass format matches what we save.
      const response = await authFetch(
        `${API_BASE_URL}/timetable?className=${encodeURIComponent(selectedClass)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTimetableData(data);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass]);

  const handleInputChange = (field: string, value: string) => {
    setNewEntry({ ...newEntry, [field]: value });
  };

  const handleClassInputChange = (field: string, value: string) => {
    setNewClass({ ...newClass, [field]: value });
  };

  const handleSaveClass = async () => {
    if (
      !newClass.grade ||
      !newClass.section ||
      !newClass.room ||
      !newClass.classTeacher
    ) {
      toast.error("Please fill in all class details");
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
        setIsAddClassDialogOpen(false);
        setNewClass({ grade: "", section: "", room: "", classTeacher: "" });
        await fetchData(); // Refresh classes list
        // Select the newly added class
        setSelectedClass(`${newClass.grade} - ${newClass.section}`);
      } else {
        toast.error("Failed to add class");
      }
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error("Failed to add class");
    }
  };

  const handleSaveEntry = async () => {
    if (!selectedClass || !newEntry.subject || !newEntry.teacher) {
      toast.error("Please fill in all timetable details");
      return;
    }

    try {
      const payload = {
        className: selectedClass,
        day: newEntry.day,
        period: parseInt(newEntry.period),
        subject: newEntry.subject,
        teacher: newEntry.teacher,
      };

      const response = await authFetch(`${API_BASE_URL}/timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Timetable updated successfully");
        setIsAssignDialogOpen(false);
        fetchTimetable();
        setNewEntry({ ...newEntry, subject: "", teacher: "" });
      } else {
        toast.error("Failed to update timetable");
      }
    } catch (error) {
      console.error("Error updating timetable:", error);
      toast.error("Failed to update timetable");
    }
  };

  const getSlot = (day: string, period: number) => {
    return timetableData.find(
      (slot) => slot.day === day && slot.period === period,
    );
  };

  // Helper to get formatted class name
  const getClassName = (cls: ClassData) => {
    // Handle "Grade 9" vs "D.Pharm 1" logic if needed from previous step, but simple concatenation is fine usually
    if (cls.grade.startsWith("D.")) return `${cls.grade} - ${cls.section}`;
    return `Grade ${cls.grade} - ${cls.section}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable</h1>
          <p className="text-muted-foreground">
            View and manage class schedules
          </p>
        </div>

        <div className="flex gap-4">
          <Dialog
            open={isAddClassDialogOpen}
            onOpenChange={setIsAddClassDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={newClass.grade}
                    onValueChange={(val) =>
                      handleClassInputChange("grade", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="D.Pharm 1">
                        D.Pharm 1st Year
                      </SelectItem>
                      <SelectItem value="D.Pharm 2">
                        D.Pharm 2nd Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={newClass.section}
                    onChange={(e) =>
                      handleClassInputChange("section", e.target.value)
                    }
                    placeholder="e.g., A, B, C"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room Number</Label>
                  <Input
                    id="room"
                    value={newClass.room}
                    onChange={(e) =>
                      handleClassInputChange("room", e.target.value)
                    }
                    placeholder="e.g., Room 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher">Class Teacher</Label>
                  <Select
                    value={newClass.classTeacher}
                    onValueChange={(val) =>
                      handleClassInputChange("classTeacher", val)
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
                    onClick={() => setIsAddClassDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveClass}>Save Class</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classList.map((cls) => {
                const name = getClassName(cls);
                return (
                  <SelectItem key={cls._id} value={name}>
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Dialog
            open={isAssignDialogOpen}
            onOpenChange={setIsAssignDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Assign Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Period - {selectedClass}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <Select
                      value={newEntry.day}
                      onValueChange={(val) => handleInputChange("day", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select
                      value={newEntry.period}
                      onValueChange={(val) => handleInputChange("period", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p.period} value={String(p.period)}>
                            Period {p.period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={newEntry.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select
                    value={newEntry.teacher}
                    onValueChange={(val) => handleInputChange("teacher", val)}
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
                    onClick={() => setIsAssignDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEntry}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule - {selectedClass || "Select a class"}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!selectedClass ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a class to view its timetable.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Period</TableHead>
                  <TableHead className="w-24">Time</TableHead>
                  {days.map((day) => (
                    <TableHead key={day} className="text-center">
                      {day}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((p) => (
                  <TableRow key={p.period}>
                    <TableCell className="font-medium">
                      Period {p.period}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.time}
                    </TableCell>
                    {days.map((day) => {
                      const slot = getSlot(day, p.period);
                      return (
                        <TableCell key={day} className="text-center">
                          {slot ? (
                            <div className="rounded-lg bg-primary/10 p-2">
                              <p className="text-sm font-medium text-primary">
                                {slot.subject}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {slot.teacher}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Timetable;
