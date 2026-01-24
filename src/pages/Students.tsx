import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, Download } from "lucide-react";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    email: "",
    phone: "",
    class: "",
    parentName: "",
    parentPhone: ""
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error("Failed to fetch students");
      }

      // Fetch Classes
      const classesRes = await fetch("${API_BASE_URL}/classes");
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClassesList(classesData);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, class: value });
  };

  const handleAddStudent = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchStudents();
        setIsAddDialogOpen(false);
        setFormData({
          name: "",
          rollNo: "",
          email: "",
          phone: "",
          class: "",
          parentName: "",
          parentPhone: ""
        });
      } else {
        console.error("Failed to add student");
      }
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentStats, setStudentStats] = useState({
    attendance: 0,
    totalFee: 0,
    paidFee: 0,
    dueFee: 0
  });

  const handleViewProfile = async (student: any) => {
    setSelectedStudent(student);
    setIsProfileOpen(true);

    // Fetch Stats
    try {
      // 1. Attendance
      const attRes = await fetch(`${API_BASE_URL}/attendance/student/${student._id}`);
      let attendanceVal = 0;
      if (attRes.ok) {
        const attData = await attRes.json();
        attendanceVal = attData.attendancePercentage || 0;
      }

      // 2. Fees
      const [feesRes, structRes] = await Promise.all([
        fetch('${API_BASE_URL}/fees'),
        fetch('${API_BASE_URL}/fee-structures')
      ]);

      let total = 0;
      let paid = 0;

      if (feesRes.ok && structRes.ok) {
        const feesData = await feesRes.json();
        const structData = await structRes.json();

        // Calculate expected total from structures
        const studentStructs = structData.filter((s: any) => s.studentId === student._id || s.rollNo === student.rollNo);
        total = studentStructs.reduce((sum: number, s: any) => sum + (Number(s.totalFee) || 0), 0);

        // Calculate paid from transactions
        const studentTrans = feesData.filter((f: any) => f.studentId === student._id);
        paid = studentTrans.reduce((sum: number, f: any) => sum + (Number(f.amountPaid) || 0), 0);
      }

      setStudentStats({
        attendance: attendanceVal,
        totalFee: total,
        paidFee: paid,
        dueFee: total - paid
      });

    } catch (error) {
      console.error("Error fetching profile stats:", error);
    }
  };

  const downloadProfilePDF = () => {
    const element = document.getElementById('student-profile-content');
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `${selectedStudent?.name}_Profile.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">Manage student records and information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter student name" value={formData.name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rollNo">Roll Number</Label>
                  <Input id="rollNo" placeholder="Enter roll number" value={formData.rollNo} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select onValueChange={handleSelectChange} value={formData.class}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesList.length > 0 ? (
                        classesList.map((cls: any) => {
                          const className = cls.grade.startsWith("D.")
                            ? `${cls.grade} - ${cls.section}`
                            : `Grade ${cls.grade} - ${cls.section}`;
                          return (
                            <SelectItem key={cls._id} value={className}>
                              {className}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <>
                          <SelectItem value="D.Pharm 1">D.Pharm 1</SelectItem>
                          <SelectItem value="D.Pharm 2">D.Pharm 2</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent Name</Label>
                  <Input id="parentName" placeholder="Enter parent name" value={formData.parentName} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent Phone</Label>
                <Input id="parentPhone" placeholder="Enter parent phone" value={formData.parentPhone} onChange={handleInputChange} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent}>Save Student</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              <div id="student-profile-content" className="p-6 bg-white rounded-lg border shadow-sm">

                {/* Header */}
                <div className="flex items-center gap-4 border-b pb-6 mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                    <p className="text-gray-500">{selectedStudent.class} | Roll: {selectedStudent.rollNo}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                      {selectedStudent.status}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Father's / Parent Name</p>
                    <p className="font-medium text-gray-900">{selectedStudent.parentName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium text-gray-900">{selectedStudent.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-900">{selectedStudent.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Parent Contact</p>
                    <p className="font-medium text-gray-900">{selectedStudent.parentPhone}</p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-sm text-gray-500 mb-1">Attendance</p>
                    <p className={`text-2xl font-bold ${studentStats.attendance < 75 ? 'text-red-600' : 'text-green-600'}`}>
                      {studentStats.attendance}%
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-sm text-gray-500 mb-1">Total Fees Paid</p>
                    <p className="text-2xl font-bold text-blue-600">₹{studentStats.paidFee.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-sm text-gray-500 mb-1">Pending Dues</p>
                    <p className={`text-2xl font-bold ${studentStats.dueFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{studentStats.dueFee.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
                  Close
                </Button>
                <Button onClick={downloadProfilePDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading students...</TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">No students found</TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student._id || student.id}>
                  <TableCell className="font-medium">{student.rollNo}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={student.status === "Active" ? "default" : "secondary"}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.feesPaid ? "default" : "destructive"}
                      className={student.feesPaid ? "bg-green-100 text-green-800" : ""}
                    >
                      {student.feesPaid ? "Paid" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Students;
