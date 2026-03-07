import { useState, useEffect, useRef } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import { Plus, ArrowLeft, Save, Trash2, Calendar, Clock, BookOpen, FileText, Download, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface Subject {
  name: string;
  date: string;
  time: string;
  totalMarks: number;
}

interface Exam {
  _id: string;
  name: string;
  className: string;
  subjects: Subject[];
  status: string;
}

interface Student {
  _id: string;
  name: string;
  rollNo: string;
  class: string;
}

interface ExamResult {
  studentId: string;
  studentName: string;
  rollNo: string;
  marks: {
    subjectName: string;
    obtainedMarks: number;
    totalMarks: number;
  }[];
}

const Exams = () => {
  // Views: 'list', 'grading', 'report'
  const [view, setView] = useState<'list' | 'grading' | 'report'>('list');
  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [classesList, setClassesList] = useState<{ _id: string; grade: string; section: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Grading / Reporting
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [examResults, setExamResults] = useState<Record<string, Record<string, number>>>({});

  // Create Exam State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: "", date: "", time: "", totalMarks: 100 }
  ]);

  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch Initial Data
  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/exams`);
      if (response.ok) {
        const data = await response.json();
        setExamsList(data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/classes`);
      if (response.ok) {
        const data = await response.json();
        setClassesList(data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Create Exam Handlers
  const handleAddSubject = () => {
    setSubjects([...subjects, { name: "", date: "", time: "", totalMarks: 100 }]);
  };

  const handleSubjectChange = (index: number, field: keyof Subject, value: string | number) => {
    const updated = [...subjects];
    if (field === 'totalMarks') value = Number(value);
    updated[index] = { ...updated[index], [field]: value } as unknown as Subject;
    setSubjects(updated);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleCreateExam = async () => {
    if (!newExamName || !selectedClass) {
      toast.error("Please fill in basic exam details");
      return;
    }

    const validSubjects = subjects.filter(s => s.name && s.date);
    if (validSubjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }

    const payload = {
      name: newExamName,
      className: selectedClass,
      subjects: validSubjects,
      status: "Scheduled"
    };

    try {
      const response = await authFetch(`${API_BASE_URL}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Exam created successfully");
        setIsAddDialogOpen(false);
        fetchExams();
        setNewExamName("");
        setSelectedClass("");
        setSubjects([{ name: "", date: "", time: "", totalMarks: 100 }]);
      } else {
        toast.error("Failed to create exam");
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Error creating exam");
    }
  };

  const handleDeleteExam = async (e: React.MouseEvent, examId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this exam? This will also delete all associated student grades.")) {
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/exams/${examId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Exam deleted successfully");
        fetchExams();
      } else {
        toast.error("Failed to delete exam");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Error deleting exam");
    }
  };

  // Helper to normalize class strings
  const normalizeClass = (str: string) => {
    if (!str) return "";
    return str.toLowerCase()
      .replace(/\./g, "")
      .replace(/pharma/g, "pharm")
      .replace(/\s+/g, "")
      .trim();
  };

  const loadExamData = async (exam: Exam) => {
    // 1. Fetch Students
    const studentsRes = await authFetch(`${API_BASE_URL}/students`);
    let allStudents: Student[] = [];
    if (studentsRes.ok) {
      allStudents = await studentsRes.json();
    }

    const targetClass = normalizeClass(exam.className);

    const classStudents = allStudents.filter(s => {
      const rawStudentClass = s.class || "";
      const currentStudentClass = normalizeClass(rawStudentClass);
      return currentStudentClass === targetClass ||
        currentStudentClass.includes(targetClass) ||
        targetClass.includes(currentStudentClass);
    });

    setStudentsList(classStudents);

    // 2. Fetch Results
    const resultsRes = await authFetch(`${API_BASE_URL}/exams/${exam._id}/results`);
    const marksMap: Record<string, Record<string, number>> = {};

    if (resultsRes.ok) {
      const resultsData: ExamResult[] = await resultsRes.json();
      resultsData.forEach(r => {
        marksMap[r.studentId] = {};
        r.marks.forEach(m => {
          marksMap[r.studentId][m.subjectName] = m.obtainedMarks;
        });
      });
    }
    setExamResults(marksMap);
    return classStudents;
  };

  const handleOpenGrading = async (exam: Exam) => {
    setSelectedExam(exam);
    setView('grading');
    setIsLoading(true);
    await loadExamData(exam);
    setIsLoading(false);
  };

  const handleOpenReport = async (exam: Exam) => {
    setSelectedExam(exam);
    setView('report');
    setIsLoading(true);
    await loadExamData(exam);
    setIsLoading(false);
  };

  const handleMarkChange = (studentId: string, subjectName: string, mark: string) => {
    setExamResults(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectName]: Number(mark)
      }
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedExam) return;

    const bulkPayload = studentsList.map(student => {
      const studentMarks = examResults[student._id] || {};
      const marksArray = selectedExam.subjects.map(subj => ({
        subjectName: subj.name,
        obtainedMarks: studentMarks[subj.name] || 0,
        totalMarks: subj.totalMarks
      }));

      return {
        studentId: student._id,
        studentName: student.name,
        rollNo: student.rollNo,
        marks: marksArray
      };
    });

    try {
      const response = await authFetch(`${API_BASE_URL}/exams/${selectedExam._id}/results/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkPayload)
      });

      if (response.ok) {
        toast.success("Grades saved successfully");
      } else {
        toast.error("Failed to save grades");
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error("Error saving grades");
    }
  };

  const downloadReport = () => {
    const element = reportRef.current;
    if (!element || !selectedExam) return;

    const opt = {
      margin: 10,
      filename: `${selectedExam.name}_Report.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'landscape' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Report Calculation Logic
  const getReportStats = () => {
    if (!selectedExam) return { stats: [], topScorer: null, lowScorer: null, classAvg: 0 };

    const stats = studentsList.map(student => {
      const studentMarks = examResults[student._id] || {};
      let totalObtained = 0;
      let maxTotal = 0;

      selectedExam.subjects.forEach(subj => {
        totalObtained += (studentMarks[subj.name] || 0);
        maxTotal += subj.totalMarks;
      });

      const percentage = maxTotal > 0 ? (totalObtained / maxTotal) * 100 : 0;
      return { ...student, totalObtained, maxTotal, percentage };
    });

    stats.sort((a, b) => b.totalObtained - a.totalObtained); // Rank by total marks

    const topScorer = stats.length > 0 ? stats[0] : null;
    const lowScorer = stats.length > 0 ? stats[stats.length - 1] : null;

    const totalClassScore = stats.reduce((acc, curr) => acc + curr.totalObtained, 0);
    const classAvg = stats.length > 0 ? (totalClassScore / stats.length).toFixed(1) : 0;

    return { stats, topScorer, lowScorer, classAvg };
  };

  if (view === 'report' && selectedExam) {
    const { stats, topScorer, lowScorer, classAvg } = getReportStats();

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-4 no-print">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedExam.name} - Report</h1>
            <p className="text-muted-foreground">Class: {selectedExam.className}</p>
          </div>
          <div className="ml-auto">
            <Button onClick={downloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-lg theme-print-fix">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-primary">Examination Report</h2>
              <p className="text-lg font-medium">{selectedExam.name}</p>
              <p className="text-muted-foreground">{selectedExam.className}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm font-bold">Class Average: {classAvg}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                  <Trophy className="h-4 w-4" /> Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topScorer ? (
                  <div>
                    <p className="text-lg font-bold">{topScorer.name}</p>
                    <p className="text-sm text-yellow-700">{topScorer.totalObtained} / {topScorer.maxTotal} Marks</p>
                  </div>
                ) : <p className="text-sm text-muted-foreground">N/A</p>}
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Needs Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowScorer ? (
                  <div>
                    <p className="text-lg font-bold">{lowScorer.name}</p>
                    <p className="text-sm text-red-700">{lowScorer.totalObtained} / {lowScorer.maxTotal} Marks</p>
                  </div>
                ) : <p className="text-sm text-muted-foreground">N/A</p>}
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.length}</p>
              </CardContent>
            </Card>
          </div>

          <Table className="border rounded-md">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                {selectedExam.subjects.map((s, i) => (
                  <TableHead key={i} className="text-center">{s.name} <span className="text-xs">({s.totalMarks})</span></TableHead>
                ))}
                <TableHead className="text-right font-bold">Total</TableHead>
                <TableHead className="text-right font-bold">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((student, idx) => {
                const studentMarks = examResults[student._id] || {};
                return (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium text-muted-foreground">#{idx + 1}</TableCell>
                    <TableCell>{student.rollNo}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    {selectedExam.subjects.map((s, i) => (
                      <TableCell key={i} className="text-center">
                        {studentMarks[s.name] ?? "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">{student.totalObtained}</TableCell>
                    <TableCell className="text-right">{student.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (view === 'grading' && selectedExam) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedExam.name} - Grading</h1>
            <p className="text-muted-foreground">Class: {selectedExam.className}</p>
          </div>
          <div className="ml-auto">
            <Button onClick={handleSaveGrades}>
              <Save className="mr-2 h-4 w-4" />
              Save Grades
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Roll No</TableHead>
                    <TableHead className="w-[200px]">Student Name</TableHead>
                    {selectedExam.subjects.map((subj, idx) => (
                      <TableHead key={idx} className="min-w-[120px]">
                        {subj.name} <span className="text-xs text-muted-foreground">({subj.totalMarks})</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3 + selectedExam.subjects.length} className="text-center py-8 text-muted-foreground">
                        No students found for class "{selectedExam.className}"
                      </TableCell>
                    </TableRow>
                  ) : (
                    studentsList.map(student => {
                      const studentMarks = examResults[student._id] || {};
                      const totalObtained = Object.values(studentMarks).reduce((a, b) => a + (b || 0), 0);
                      const maxTotal = selectedExam.subjects.reduce((a, b) => a + b.totalMarks, 0);

                      return (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">{student.rollNo}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          {selectedExam.subjects.map((subj, idx) => (
                            <TableCell key={idx}>
                              <Input
                                type="number"
                                min={0}
                                max={subj.totalMarks}
                                className="w-20"
                                value={studentMarks[subj.name] ?? ""}
                                onChange={(e) => handleMarkChange(student._id, subj.name, e.target.value)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-bold">
                            {totalObtained} / {maxTotal}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams & Grades</h1>
          <p className="text-muted-foreground">Create and manage exams</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
              <DialogDescription className="sr-only">Fill out this form to create a new exam session.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="e.g. Final Semester 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesList.map((cls) => (
                        <SelectItem key={cls._id} value={`${cls.grade} ${cls.section}`.trim()}>
                          {cls.grade} {cls.section}
                        </SelectItem>
                      ))}
                      <SelectItem value="dpharma 1">dpharma 1</SelectItem>
                      <SelectItem value="dpharma 2">dpharma 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Subjects</Label>
                  <Button variant="outline" size="sm" onClick={handleAddSubject}>
                    <Plus className="mr-2 h-3 w-3" /> Add Subject
                  </Button>
                </div>

                {subjects.map((subject, index) => (
                  <div key={index} className="grid gap-3 p-3 border rounded-lg bg-muted/50 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveSubject(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Subject Name</Label>
                        <Input
                          placeholder="e.g. Pharmacology"
                          value={subject.name}
                          onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Marks</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={subject.totalMarks}
                          onChange={(e) => handleSubjectChange(index, 'totalMarks', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={subject.date}
                          onChange={(e) => handleSubjectChange(index, 'date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Time</Label>
                        <Input
                          type="time"
                          value={subject.time}
                          onChange={(e) => handleSubjectChange(index, 'time', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateExam}>Create Exam</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading exams...</p>
        ) : examsList.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-10">
            No exams created yet. Click "Create Exam" to start.
          </p>
        ) : (
          examsList.map((exam) => (
            <Card key={exam._id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{exam.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{exam.className}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteExam(e, exam._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{exam.subjects.length} Subjects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  {exam.subjects.slice(0, 3).map((subj, i) => (
                    <div key={i} className="flex justify-between text-muted-foreground">
                      <span>{subj.name}</span>
                      <span>{subj.date}</span>
                    </div>
                  ))}
                  {exam.subjects.length > 3 && (
                    <div className="text-xs text-muted-foreground pt-1">
                      + {exam.subjects.length - 3} more
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button variant="outline" onClick={() => handleOpenGrading(exam)}>
                    Add Grades
                  </Button>
                  <Button onClick={() => handleOpenReport(exam)}>
                    View Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Exams;
