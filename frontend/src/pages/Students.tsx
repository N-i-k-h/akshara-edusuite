import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_BASE_URL, authFetch } from "@/config";

import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { ToWords } from "to-words";
const toWords = new ToWords();

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { User, Phone, Mail, Home, ShieldCheck, GraduationCap, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<any[]>([]);

  const institutionalItems = [
    "APPLICATION FEE", "ADMISSION FEE", "ELIGIBILITY FEE", "TUITION FEE",
    "LIBRARY & R.R. FEE", "IDENTITY CARD FEE", "LABORATORY FEE", "SPORTS FEE",
    "CULTURAL FEE", "ANNUAL DAY FEE", "DIGITAL LIBRARY FEE", "INTERNAL EXAMINATION FEE",
    "BREAKAGE FEE", "OTHERS"
  ].map(name => ({ name, value: 0 }));

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    rollNo: "",
    admissionNumber: "",
    email: "",
    phone: "",
    class: "",
    parentName: "",
    parentPhone: "",
    status: "Active",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/students`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error("Failed to fetch students");
      }

      // Fetch Classes
      const classesRes = await authFetch(`${API_BASE_URL}/classes`);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClassesList(classesData);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error(
        "Failed to connect to server. Please check your internet or server status.",
      );
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

  const handleEditClick = (student: any) => {
    setEditingStudentId(student._id || student.id);
    setFormData({
      name: student.name || "",
      rollNo: student.rollNo || "",
      admissionNumber: student.admissionNumber || "",
      email: student.email || "",
      phone: student.phone || "",
      class: student.class || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      status: student.status || "Active",
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenAddNew = () => {
    setEditingStudentId(null);
    setFormData({
      name: "",
      rollNo: "",
      admissionNumber: "",
      email: "",
      phone: "",
      class: "",
      parentName: "",
      parentPhone: "",
      status: "Active",
    });
    setIsAddDialogOpen(true);
  };

  const handleAddStudent = async () => {
    try {
      const url = editingStudentId
        ? `${API_BASE_URL}/students/${editingStudentId}`
        : `${API_BASE_URL}/students`;

      const response = await authFetch(url, {
        method: editingStudentId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingStudentId ? "Student updated successfully" : "Student added successfully");
        fetchStudents();
        setIsAddDialogOpen(false);
        setEditingStudentId(null);
        setFormData({
          name: "",
          rollNo: "",
          admissionNumber: "",
          email: "",
          phone: "",
          class: "",
          parentName: "",
          parentPhone: "",
          status: "Active",
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || (editingStudentId ? "Failed to update student" : "Failed to add student"));
        console.error("Failed to save student:", errorData);
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error("An error occurred while saving student");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!id) {
      toast.error("Error: Invalid student ID");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this student? Use this action with caution as it deletes all related data.",
      )
    )
      return;

    try {
      console.log("Deleting student with ID:", id);
      const response = await authFetch(`${API_BASE_URL}/students/${id}`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 404) {
        toast.success("Student deleted successfully");
        // Optimistically update UI
        setStudents((prev) =>
          prev.filter((item) => (item._id || item.id) !== id),
        );
        // fetchStudents(); // Removed to prevent stale data re-fetch
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Delete failed:", response.status, errorData);
        toast.error(errorData.message || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student. Check console for details.");
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);

  const handleViewProfile = async (student: any) => {
    setSelectedStudent(student);
    setIsProfileOpen(true);
    setLatestReceipt(null);

    try {
      const [feesRes, structRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/fees`),
        authFetch(`${API_BASE_URL}/fee-structures/student/${student._id || student.id}`)
      ]);

      if (feesRes.ok) {
        const feesData = await feesRes.json();
        const studentTrans = feesData
          .filter((f: any) => String(f.studentId) === String(student._id || student.id))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (studentTrans.length > 0) {
          const latest = studentTrans[0];
          
          // PRIORITY 1: Use snapshot from payment record if exists
          let feeItems = latest.feeItems || [];
          
          // PRIORITY 2: Fallback to current structure if snapshot is missing (legacy records)
          if (feeItems.length === 0 && structRes.ok) {
            const structData = await structRes.json();
            if (structData && structData.feeItems) {
              feeItems = structData.feeItems;
            }
          }
          
          // PRIORITY 3: Fallback to Institutional Defaults (Image 3)
          if (feeItems.length === 0) {
            feeItems = institutionalItems;
          }

          const totalCalculated = Number(latest.totalFee) || (Number(latest.amountPaid) + Number(latest.dueAmount));
          
          setLatestReceipt({
            ...latest,
            feeItems,
            totalFee: totalCalculated,
            dateStr: new Date(latest.date).toLocaleDateString("en-GB")
          });
        }
      }
    } catch (error) {
      console.error("Error fetching latest receipt:", error);
      toast.error("Failed to load latest fee receipt");
    }
  };

  const downloadProfilePDF = () => {
    const element = document.getElementById("student-profile-content");
    if (!element) return;

    const opt = {
      margin: 0.5,
      filename: `${selectedStudent?.name}_Profile.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and information
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStudentId ? "Edit Student Details" : "Add New Student"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rollNo">Roll Number (Optional)</Label>
                  <Input
                    id="rollNo"
                    placeholder="Enter roll number"
                    value={formData.rollNo}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admissionNumber">Admission Number</Label>
                  <Input
                    id="admissionNumber"
                    placeholder="Enter admission number"
                    value={formData.admissionNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    onValueChange={handleSelectChange}
                    value={formData.class}
                  >
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent Name</Label>
                  <Input
                    id="parentName"
                    placeholder="Enter parent name"
                    value={formData.parentName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentPhone">Parent Phone</Label>
                  <Input
                    id="parentPhone"
                    placeholder="Enter parent phone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                    value={formData.status}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddStudent}>{editingStudentId ? "Update Student" : "Save Student"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-[880px] overflow-y-auto max-h-[95vh] bg-slate-50 p-6">
          <DialogHeader className="no-print mb-4 border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Student Profile: {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="receipt" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-2 max-w-sm mx-auto no-print bg-slate-100 p-1">
                <TabsTrigger value="receipt" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-900">
                   <FileText className="h-4 w-4" /> Latest Receipt
                </TabsTrigger>
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-900">
                   <User className="h-4 w-4" /> Student Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="receipt" className="space-y-6 flex flex-col items-center animate-in fade-in duration-300">
                {latestReceipt ? (
                  <div
                    id="student-receipt-content"
                    className="bg-white text-black px-12 py-10 w-[794px] h-[1050px] shadow-2xl flex flex-col relative border border-gray-100 shrink-0 select-none overflow-hidden"
                    style={{ fontFamily: "'Times New Roman', serif", boxSizing: "border-box" }}
                  >
                    {/* Institutional Header Box */}
                    <div className="border border-blue-900 p-2 flex flex-col items-center relative mb-2">
                       <div className="flex items-center w-full gap-4 mb-2">
                          {/* Logo Section */}
                          <div className="flex items-center gap-3 shrink-0 border-r border-blue-900 pr-5 h-20">
                             <div className="flex flex-col text-[11px] font-black text-blue-900 leading-[0.8] py-1 uppercase tracking-tighter self-center">
                               <span>S</span><span>S</span><span>S</span><span>C</span><span>P</span>
                             </div>
                             <img
                               src="/college_logo.png"
                               alt="College Logo"
                               className="h-16 w-auto object-contain"
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.src = "/ssscp_logo.png";
                               }}
                             />
                          </div>

                          <div className="flex-1 text-center pr-10">
                             <h1 className="text-2xl font-bold tracking-tight text-blue-900 leading-none mb-1">
                               S.S.S. College of Pharmacy
                             </h1>
                             <p className="text-[9px] font-extrabold leading-tight uppercase text-gray-800 tracking-tight">
                               AKSHARA CAMPUS, AKSHARA NAGAR, OPP. JNNCE, SAVALANGA ROAD,
                             </p>
                             <p className="text-[9px] font-extrabold leading-tight uppercase text-gray-800">
                               SHIVAMOGGA - 577 204.
                             </p>
                             <p className="text-[9px] font-bold leading-tight mt-1 text-gray-800">
                               Mob. +91 94481 27880, 56329 17880
                             </p>
                          </div>
                       </div>

                       <div className="w-full flex justify-center mt-1 border-t border-blue-900 pt-1">
                          <span className="font-bold text-base underline underline-offset-4 decoration-1 uppercase tracking-widest text-[#1e3a8a]">
                            PAYMENT RECEIPT
                          </span>
                       </div>

                       {/* Meta Info Inside Box */}
                       <div className="w-full flex justify-between px-2 mt-1 text-[13px] font-bold">
                          <div className="flex gap-2 items-baseline">
                             No. <span className="text-red-600 font-bold text-lg ml-6">{latestReceipt.receiptNo || "RCT-303842"}</span>
                          </div>
                          <div className="flex gap-2 items-baseline">
                             Dt. <span className="font-bold ml-10">{latestReceipt.dateStr || ""}</span>
                          </div>
                       </div>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-4 px-2 mb-4 text-sm">
                       <div className="flex items-end w-full border-b border-gray-400 pb-0.5">
                          <span className="shrink-0 font-bold whitespace-nowrap text-xs">Sri /Miss</span>
                          <span className="ml-8 font-bold text-xl italic text-[#1e3a8a] flex-1 px-1 uppercase leading-none">
                             {selectedStudent.name}
                          </span>
                       </div>

                       <div className="flex items-end w-full font-bold gap-4 border-b border-gray-400 pb-0.5">
                          <span className="shrink-0 uppercase text-[9px]">D. PHARMA COURSE- ACADEMIC YEAR</span>
                          <span className="font-bold text-sm px-2">2025-26</span>
                          <div className="flex gap-2 ml-auto items-end">
                             <span className="uppercase text-[9px]">ROLL NO:</span>
                             <span className="text-[#1e3a8a] text-lg leading-none border-b border-blue-900 px-2">{selectedStudent.rollNo || ""}</span>
                          </div>
                       </div>
                    </div>

                    {/* Table Area */}
                    <div className="mb-4 bg-white flex-grow">
                       <table className="w-full text-xs font-bold border border-blue-900 border-collapse table-fixed">
                          <thead>
                             <tr className="border-b border-blue-900 bg-blue-50/5">
                                <th className="border-r border-blue-900 p-1 w-[10%] text-center uppercase">No.</th>
                                <th className="border-r border-blue-900 p-1 w-[60%] text-left pl-6 uppercase">PARTICULARS</th>
                                <th className="p-1 w-[30%] text-center uppercase">AMOUNT</th>
                             </tr>
                          </thead>
                          <tbody>
                             {latestReceipt.feeItems && latestReceipt.feeItems.length > 0 ? (
                                latestReceipt.feeItems.map((item: any, idx: number) => (
                                   <tr key={idx} className="border-b border-blue-900/20 h-7">
                                      <td className="border-r border-blue-900 p-1.5 text-center font-normal">{idx + 1}.</td>
                                      <td className="border-r border-blue-900 p-1.5 pl-6 font-semibold uppercase">{item.name}</td>
                                      <td className="p-1.5 text-right pr-6 font-semibold">{item.value > 0 ? Number(item.value).toLocaleString("en-IN") + "/-" : ""}</td>
                                   </tr>
                                ))
                             ) : (
                                institutionalItems.map((item, idx) => (
                                   <tr key={idx} className="border-b border-blue-900/20 h-7">
                                      <td className="border-r border-blue-900 p-1.5 text-center font-normal">{idx + 1}.</td>
                                      <td className="border-r border-blue-900 p-1.5 pl-6 font-semibold uppercase">{item.name}</td>
                                      <td className="p-1.5 text-right pr-6 font-semibold">
                                         {idx === 13 ? Number(latestReceipt.amountPaid).toLocaleString("en-IN") + "/-" : ""}
                                      </td>
                                   </tr>
                                ))
                             )}

                             {Array.from({ length: Math.max(0, 15 - (latestReceipt.feeItems?.length || 14)) }).map((_, i) => (
                                <tr key={`fill-${i}`} className="border-b border-blue-900/10 h-7 opacity-50">
                                   <td className="border-r border-blue-900 p-1.5 text-center font-normal text-gray-200">
                                      {(latestReceipt.feeItems?.length || 14) + i + 1}.
                                   </td>
                                   <td className="border-r border-blue-900 p-1.5"></td>
                                   <td className="p-1.5"></td>
                                </tr>
                             ))}

                             {/* Grand Total */}
                             <tr className="border-t-2 border-blue-900 h-9 font-bold bg-blue-50/5">
                                <td className="p-1.5 text-right pr-6 uppercase text-[9px] border-r border-blue-900" colSpan={2}>
                                   GRAND TOTAL AMOUNT
                                </td>
                                <td className="p-1.5 text-right pr-6 text-sm text-blue-900 font-extrabold">
                                   ₹ {Number(latestReceipt.totalFee).toLocaleString("en-IN")}/-
                                </td>
                             </tr>
                             {/* Paid */}
                             <tr className="border-t border-blue-900 h-9 font-bold">
                                <td className="p-1.5 text-right pr-6 uppercase text-[9px] border-r border-blue-900 text-green-700" colSpan={2}>
                                   CURRENT PAID AMOUNT
                                </td>
                                <td className="p-1.5 text-right pr-6 text-sm text-green-700 font-extrabold">
                                   ₹ {Number(latestReceipt.amountPaid).toLocaleString("en-IN")}/-
                                </td>
                             </tr>
                             {/* Due */}
                             <tr className="border-t border-blue-900 h-9 font-bold">
                                <td className="p-1.5 text-right pr-6 uppercase text-[9px] border-r border-blue-900 text-red-600" colSpan={2}>
                                   BALANCE DUE AMOUNT
                                </td>
                                <td className="p-1.5 text-right pr-6 text-sm text-red-600 font-extrabold">
                                   ₹ {Number(latestReceipt.dueAmount).toLocaleString("en-IN")}/-
                                </td>
                             </tr>
                          </tbody>
                       </table>
                    </div>

                    {/* Words */}
                    <div className="px-2 mb-8 flex items-baseline border-b border-gray-300 pb-1 mt-2">
                       <span className="shrink-0 uppercase text-[10px] font-black mr-6">RUPEES IN WORDS:</span>
                       <span className="font-bold text-lg italic capitalize flex-1 text-gray-800">
                          {toWords.convert(Number(latestReceipt.amountPaid))} Only
                       </span>
                    </div>

                    {/* Footer - Seal and Signatories */}
                    <div className="mt-auto px-2 flex justify-between items-end w-full mb-6 font-bold">
                       <div className="w-[45%] flex flex-col items-start">
                          <div className="w-full border-t border-black mb-2"></div>
                          <p className="text-[11px] uppercase font-bold tracking-tight text-black">INSTITUTIONAL SEAL</p>
                       </div>
                       <div className="w-[48%] flex flex-col items-center">
                          <div className="w-full border-t border-blue-900 mb-2"></div>
                          <p className="text-[12px] uppercase font-bold text-blue-900 tracking-tight">SIGNATURE OF THE RECEIVER</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center w-full bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-muted-foreground italic text-lg">No fee history found for this student.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="overview" className="space-y-6 no-print animate-in transition-all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-100 shadow-sm overflow-hidden">
                    <div className="bg-blue-600 text-white p-3 flex items-center gap-2">
                       <GraduationCap className="h-5 w-5" />
                       <h3 className="font-bold">Academic Details</h3>
                    </div>
                    <CardContent className="p-4 space-y-4 pt-4">
                       <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                          <span className="text-sm text-slate-500">Admission No</span>
                          <span className="font-bold text-blue-900">{selectedStudent.admissionNumber}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                          <span className="text-sm text-slate-500">Roll Number</span>
                          <span className="font-bold text-blue-900">{selectedStudent.rollNo || "N/A"}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Current Class</span>
                          <span className="font-bold text-blue-900">{selectedStudent.class}</span>
                       </div>
                    </CardContent>
                  </Card>

                  <Card className="border-indigo-100 shadow-sm overflow-hidden">
                    <div className="bg-indigo-600 text-white p-3 flex items-center gap-2">
                       <Phone className="h-5 w-5" />
                       <h3 className="font-bold">Contact Details</h3>
                    </div>
                    <CardContent className="p-4 space-y-4 pt-4">
                       <div className="flex items-center gap-3 border-b border-indigo-50 pb-2">
                          <Mail className="h-4 w-4 text-indigo-500" />
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-slate-400">Email</span>
                             <span className="font-medium text-slate-700">{selectedStudent.email || "N/A"}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-indigo-500" />
                          <div className="flex flex-col">
                             <span className="text-[10px] uppercase text-slate-400">Parent Phone</span>
                             <span className="font-bold text-indigo-900">{selectedStudent.parentPhone}</span>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 w-full mt-4 no-print border-t pt-4">
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Close
            </Button>
            {latestReceipt && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  const el = document.getElementById("student-receipt-content");
                  if (el) {
                    html2pdf()
                      .set({
                        margin: 0,
                        filename: `${selectedStudent.name}_Payment_Receipt.pdf`,
                        image: { type: "jpeg", quality: 1 },
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                      })
                      .from(el)
                      .save();
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF Receipt
              </Button>
            )}
          </div>
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
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Admission No</TableHead>
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
                <TableCell colSpan={9} className="text-center py-8">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student._id || student.id}>
                  <TableCell className="font-medium">
                    {student.rollNo}
                  </TableCell>
                  <TableCell>{student.admissionNumber}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.feesPaid ? "default" : "destructive"}
                      className={
                        student.feesPaid ? "bg-green-100 text-green-800" : ""
                      }
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
                        <DropdownMenuItem
                          onClick={() => handleViewProfile(student)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(student)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            handleDeleteStudent(student._id || student.id)
                          }
                        >
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
