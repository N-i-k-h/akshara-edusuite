import { useState, useEffect } from "react";

import { CalendarDays, Check, X, Clock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  class: string;
}

interface ClassData {
  _id: string;
  grade: string;
  section: string;
}

interface TimetableEntry {
  period: number;
  subject: string;
  teacher: string;
  day: string;
}

const Attendance = () => {
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch Classes on Mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/classes");
        if (response.ok) {
          const data = await response.json();
          setClassesList(data);
          if (data.length > 0) {
            // Default to first class if not set
            // Construct class name format used in DB: "Grade X - Section" or "D.Pharm 1 - A"
            const firstClass = data[0];
            const className = firstClass.grade.startsWith("D.")
              ? `${firstClass.grade} - ${firstClass.section}`
              : `Grade ${firstClass.grade} - ${firstClass.section}`;
            setSelectedClass(className);
          }
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes");
      }
    };
    fetchClasses();
  }, []);

  // Fetch Students and Timetable when Class or Date changes
  useEffect(() => {
    if (!selectedClass) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Students
        const studentsRes = await fetch("http://localhost:5000/api/students");
        if (studentsRes.ok) {
          const allStudents = await studentsRes.json();
          // Find the current class object to get the raw grade (e.g. "D.Pharm 1")
          const currentClassObject = classesList.find(c => {
            const name = c.grade.startsWith("D.")
              ? `${c.grade} - ${c.section}`
              : `Grade ${c.grade} - ${c.section}`;
            return name === selectedClass;
          });
          const rawGrade = currentClassObject ? currentClassObject.grade : "";

          // Filter students: Match Exact string OR Raw Grade
          const filtered = allStudents.filter((s: Student) =>
            s.class === selectedClass || (rawGrade && s.class === rawGrade)
          );
          setStudentsList(filtered);
        }

        // 2. Fetch Timetable for the day
        const dateObj = new Date(selectedDate);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        // Fetch ALL timetable entries to safely filter client-side for case mismatches
        const timetableRes = await fetch("http://localhost:5000/api/timetable");

        if (timetableRes.ok) {
          const allTimetable = await timetableRes.json();
          // Filter matching class name (case insensitive) AND day name
          // The DB has "D.Pharm 1 - a" but selectedClass might be "D.Pharm 1 - A"
          const dayTimetable = allTimetable.filter((t: any) =>
            t.className.toLowerCase() === selectedClass.toLowerCase() && t.day === dayName
          );
          setTimetable(dayTimetable);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, selectedDate, classesList]);

  // Fetch Existing Attendance when Period/Class/Date changes
  useEffect(() => {
    if (!selectedClass || !selectedDate || !selectedPeriod) return;

    const fetchAttendance = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/attendance?date=${selectedDate}&className=${encodeURIComponent(selectedClass)}&period=${selectedPeriod}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.records) {
            const loadedAttendance: Record<string, string> = {};
            data.records.forEach((r: any) => {
              loadedAttendance[r.studentId] = r.status.toLowerCase();
            });
            setAttendanceData(loadedAttendance);
          } else {
            // Reset if no data exists
            setAttendanceData({});
          }
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchAttendance();
  }, [selectedClass, selectedDate, selectedPeriod]);


  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedDate || !selectedPeriod) {
      toast.error("Please select all fields");
      return;
    }

    setSaving(true);
    try {
      // Find subject from timetable
      const currentSlot = timetable.find(t => t.period === parseInt(selectedPeriod));
      const subject = currentSlot ? currentSlot.subject : "Unknown";

      const records = studentsList.map(student => ({
        studentId: student._id,
        studentName: student.name,
        rollNo: student.rollNo,
        status: (attendanceData[student._id] || "present").charAt(0).toUpperCase() + (attendanceData[student._id] || "present").slice(1) // Capitalize
      }));

      const payload = {
        date: selectedDate,
        className: selectedClass,
        period: parseInt(selectedPeriod),
        subject,
        records
      };

      const response = await fetch("http://localhost:5000/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Attendance saved successfully!");
      } else {
        toast.error("Failed to save attendance");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Error saving attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "text-green-600";
      case "absent": return "text-destructive";
      case "late": return "text-amber-600";
      default: return "";
    }
  };

  // Helper to get periods (1-8 standard, but use timetable to show subject info)
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Mark daily attendance for students</p>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Attendance
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classesList.map((cls) => {
                const name = cls.grade.startsWith("D.")
                  ? `${cls.grade} - ${cls.section}`
                  : `Grade ${cls.grade} - ${cls.section}`;
                return (
                  <SelectItem key={cls._id} value={name}>
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label>Period</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => {
                const slot = timetable.find(t => t.period === p);
                return (
                  <SelectItem key={p} value={p.toString()}>
                    Period {p} {slot ? `- ${slot.subject} (${slot.teacher})` : "- Free"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{studentsList.length}</p>
            </div>
            <CalendarDays className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.values(attendanceData).filter((s) => s === "present").length}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-destructive">
                {Object.values(attendanceData).filter((s) => s === "absent").length}
              </p>
            </div>
            <X className="h-8 w-8 text-destructive" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Late</p>
              <p className="text-2xl font-bold text-amber-600">
                {Object.values(attendanceData).filter((s) => s === "late").length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-amber-600" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedClass} - Period {selectedPeriod} - {new Date(selectedDate).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : studentsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No students found for this class.</div>
          ) : (
            <div className="space-y-4">
              {studentsList.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Roll No: {student.rollNo}
                    </p>
                  </div>
                  <RadioGroup
                    value={attendanceData[student._id] || "present"} // Default to present visually if not set
                    onValueChange={(value) => handleAttendanceChange(student._id, value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="present" id={`${student._id}-present`} />
                      <Label
                        htmlFor={`${student._id}-present`}
                        className={getStatusColor("present")}
                      >
                        Present
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="absent" id={`${student._id}-absent`} />
                      <Label
                        htmlFor={`${student._id}-absent`}
                        className={getStatusColor("absent")}
                      >
                        Absent
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="late" id={`${student._id}-late`} />
                      <Label
                        htmlFor={`${student._id}-late`}
                        className={getStatusColor("late")}
                      >
                        Late
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
