import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_BASE_URL, authFetch } from "@/config";
import TransferCertificate from "./TransferCertificate";
import StudyCertificate from "./StudyCertificate";

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
import { User, Phone, Mail, Home, ShieldCheck, GraduationCap, FileText, Wallet, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
const Students = () => {
  const [isGeneratingReceiptPDF, setIsGeneratingReceiptPDF] = useState(false);
  const inlineInputStyle = {
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    fontStyle: "inherit",
    color: "inherit",
    backgroundColor: "transparent",
    border: "none",
    padding: "0",
    margin: "0",
    outline: "none",
  };

  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [allFees, setAllFees] = useState<any[]>([]);
  const pageSize = 10;

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
    address: "",
    dob: "",
    joiningDate: "",
    fatherName: "",
    motherName: "",
    passingYear: "",
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

      // Fetch All Fees for summary
      const feesRes = await authFetch(`${API_BASE_URL}/fees`);
      if (feesRes.ok) {
        const feesData = await feesRes.json();
        setAllFees(feesData);
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
      address: student.address || "",
      dob: student.dob || "",
      joiningDate: student.joiningDate || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      passingYear: student.passingYear || "",
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
      address: "",
      dob: "",
      joiningDate: "",
      fatherName: "",
      motherName: "",
      passingYear: "",
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
          address: "",
          dob: "",
          joiningDate: "",
          fatherName: "",
          motherName: "",
          passingYear: "",
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
      student.rollNo.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    const matchesClass =
      classFilter === "all" || student.class === classFilter;
    return matchesSearch && matchesStatus && matchesClass;
  });

  const getStudentFeeSummary = (studentId: string) => {
      const studentTrans = allFees
          .filter((f: any) => String(f.studentId) === String(studentId))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
      if (studentTrans.length > 0) {
          const latest = studentTrans[0];
          const totalFee = Number(latest.totalFee) || (Number(latest.amountPaid) + Number(latest.dueAmount));
          return {
              total: totalFee,
              paid: latest.amountPaid,
              due: latest.dueAmount
          };
      }
      return { total: 0, paid: 0, due: 0 };
  };

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, classFilter]);

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<any | null>(null);
  const [amountPayingNow, setAmountPayingNow] = useState(0);
  const [activeProfileTab, setActiveProfileTab] = useState("receipt");
  
  // Custom Fields State
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  // Promotion/Graduation State
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [promotingStudent, setPromotingStudent] = useState<any | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<string>("");

  // Bulk Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = (pageStudents: any[]) => {
    const pageStudentIds = pageStudents.map((s) => s._id || s.id);
    const allOnPageSelected = pageStudentIds.every((id) => selectedStudentIds.includes(id));

    if (allOnPageSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !pageStudentIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => {
        const uniqueIds = new Set([...prev, ...pageStudentIds]);
        return Array.from(uniqueIds);
      });
    }
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim() || !newFieldValue.trim()) {
      toast.error("Please enter both field name and value");
      return;
    }
    if (!selectedStudent) return;
    const updatedCustomFields = [
      ...(selectedStudent.customFields || []),
      { label: newFieldName.trim(), value: newFieldValue.trim() }
    ];
    setSelectedStudent({ ...selectedStudent, customFields: updatedCustomFields });
    setNewFieldName("");
    setNewFieldValue("");
  };

  const handleRemoveCustomField = (index: number) => {
    if (!selectedStudent) return;
    const updatedCustomFields = (selectedStudent.customFields || []).filter(
      (_: any, idx: number) => idx !== index
    );
    setSelectedStudent({ ...selectedStudent, customFields: updatedCustomFields });
  };

  const handleCustomFieldChange = (index: number, key: 'label' | 'value', val: string) => {
    if (!selectedStudent) return;
    const updatedCustomFields = [...(selectedStudent.customFields || [])];
    updatedCustomFields[index] = { ...updatedCustomFields[index], [key]: val };
    setSelectedStudent({ ...selectedStudent, customFields: updatedCustomFields });
  };

  const handleStudentFieldChange = (field: string, val: string) => {
    setSelectedStudent((prev: any) => {
      if (!prev) return null;
      return { ...prev, [field]: val };
    });
  };

  const handleSaveStudentDetails = async () => {
    if (!selectedStudent) return;
    const toastId = toast.loading("Saving student details...");
    try {
      const studentId = selectedStudent._id || selectedStudent.id;
      const response = await authFetch(`${API_BASE_URL}/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedStudent.name,
          rollNo: selectedStudent.rollNo,
          admissionNumber: selectedStudent.admissionNumber,
          email: selectedStudent.email,
          phone: selectedStudent.phone,
          class: selectedStudent.class,
          parentName: selectedStudent.parentName,
          parentPhone: selectedStudent.parentPhone,
          status: selectedStudent.status,
          address: selectedStudent.address,
          dob: selectedStudent.dob,
          joiningDate: selectedStudent.joiningDate,
          fatherName: selectedStudent.fatherName,
          motherName: selectedStudent.motherName,
          passingYear: selectedStudent.passingYear,
          customFields: selectedStudent.customFields || [],
        }),
      });

      if (response.ok) {
        const updatedStudent = await response.json();
        toast.success("Student details saved successfully!", { id: toastId });
        setSelectedStudent(updatedStudent);
        setStudents((prev) =>
          prev.map((s) => (s._id === studentId || s.id === studentId ? updatedStudent : s))
        );
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to save student details", { id: toastId });
      }
    } catch (error) {
      console.error("Error saving student details:", error);
      toast.error("An error occurred while saving student details", { id: toastId });
    }
  };

  const handlePromoteStudent = async () => {
    const isBulk = !promotingStudent && selectedStudentIds.length > 0;
    
    if ((!promotingStudent && !isBulk) || !promoteTarget) {
      toast.error("Please select a target class or graduation option.");
      return;
    }

    const toastId = toast.loading("Processing student promotion/graduation...");
    try {
      const isGraduation = promoteTarget === "Graduated";

      if (isBulk) {
        // Bulk Promotion logic
        const payload = isGraduation
          ? { studentIds: selectedStudentIds, status: "Graduated" }
          : { studentIds: selectedStudentIds, targetClass: promoteTarget };

        const response = await authFetch(`${API_BASE_URL}/students/bulk/promote`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success(
            isGraduation
              ? `Successfully graduated ${selectedStudentIds.length} students!`
              : `Successfully promoted ${selectedStudentIds.length} students to ${promoteTarget}!`,
            { id: toastId }
          );
          
          fetchStudents();
          setSelectedStudentIds([]);
          setIsPromoteDialogOpen(false);
          setPromoteTarget("");
        } else {
          const err = await response.json();
          toast.error(err.message || "Failed to promote students in bulk", { id: toastId });
        }
      } else {
        // Single Student Promotion logic
        const studentId = promotingStudent._id || promotingStudent.id;
        const payload = isGraduation
          ? { status: "Graduated" }
          : { class: promoteTarget };

        const response = await authFetch(`${API_BASE_URL}/students/${studentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const updatedStudent = await response.json();
          toast.success(
            isGraduation
              ? "Student marked as Graduated / Pass Out!"
              : `Student promoted to ${promoteTarget}!`,
            { id: toastId }
          );
          
          setStudents((prev) =>
            prev.map((s) => (s._id === studentId || s.id === studentId ? updatedStudent : s))
          );
          setIsPromoteDialogOpen(false);
          setPromotingStudent(null);
          setPromoteTarget("");
        } else {
          const err = await response.json();
          toast.error(err.message || "Failed to promote student", { id: toastId });
        }
      }
    } catch (error) {
      console.error("Error promoting student(s):", error);
      toast.error("An error occurred while promoting student(s)", { id: toastId });
    }
  };

  const handleReceiptInputChange = (field: string, value: any) => {
    setLatestReceipt((prev: any) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleReceiptFeeNameChange = (index: number, newName: string) => {
    setLatestReceipt((prev: any) => {
      if (!prev) return null;
      const updated = [...(prev.feeItems || [])];
      updated[index] = { ...updated[index], name: newName };
      return { ...prev, feeItems: updated };
    });
  };

  const handleReceiptFeeValueChange = (index: number, newValue: string) => {
    setLatestReceipt((prev: any) => {
      if (!prev) return null;
      const updated = [...(prev.feeItems || [])];
      updated[index] = { ...updated[index], value: Number(newValue) || 0 };
      return { ...prev, feeItems: updated };
    });
  };

  const handleAddReceiptFeeItem = () => {
    setLatestReceipt((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        feeItems: [...(prev.feeItems || []), { name: "NEW PARTICULAR", value: 0 }]
      };
    });
  };

  const handleRemoveReceiptFeeItem = (index: number) => {
    setLatestReceipt((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        feeItems: (prev.feeItems || []).filter((_: any, idx: number) => idx !== index)
      };
    });
  };

  const calculateReceiptTotal = () => {
    if (!latestReceipt || !latestReceipt.feeItems) return 0;
    return latestReceipt.feeItems.reduce((sum: number, item: any) => sum + (Number(item.value) || 0), 0);
  };

  const calculateReceiptDue = () => {
    if (!latestReceipt) return 0;
    const total = calculateReceiptTotal();
    const paid = Number(latestReceipt.amountPaid) || 0;
    return Math.max(0, total - paid);
  };

  const handleSaveReceiptChanges = async () => {
    if (!latestReceipt) return;
    try {
      const newAmountPaid = Number(latestReceipt.amountPaid || 0) + amountPayingNow;
      const totalFee = calculateReceiptTotal();
      const dueAmount = Math.max(0, totalFee - newAmountPaid);
      const payload = {
        ...latestReceipt,
        amountPaid: newAmountPaid,
        totalFee,
        dueAmount,
      };

      const response = await authFetch(`${API_BASE_URL}/fees/${latestReceipt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Receipt changes and payment saved successfully!");
        setAmountPayingNow(0);
        fetchStudents();
        handleViewProfile(selectedStudent);
      } else {
        toast.error("Failed to save receipt changes.");
      }
    } catch (error) {
      console.error("Error saving receipt changes:", error);
      toast.error("An error occurred while saving.");
    }
  };

  const handleViewProfile = async (student: any) => {
    setSelectedStudent(student);
    setIsProfileOpen(true);
    setLatestReceipt(null);
    setActiveProfileTab("receipt");

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
            feeItems = institutionalItems.map((item, idx) => 
              idx === 13 ? { ...item, value: Number(latest.amountPaid) || 0 } : item
            );
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

  const handleOverviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading passport photo...");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result;
        try {
          const uploadRes = await authFetch(`${API_BASE_URL}/upload-passport`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image: base64Data }),
          });

          if (!uploadRes.ok) {
            throw new Error("Failed to upload photo to server");
          }

          const uploadData = await uploadRes.json();
          const passportUrl = uploadData.url;

          const studentId = selectedStudent._id || selectedStudent.id;
          const updateRes = await authFetch(`${API_BASE_URL}/students/${studentId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ passportImage: passportUrl }),
          });

          if (!updateRes.ok) {
            throw new Error("Failed to save photo URL to student profile");
          }

          const updatedStudent = await updateRes.json();
          setSelectedStudent(updatedStudent);
          
          setStudents((prevStudents) =>
            prevStudents.map((st) => (st._id === studentId || st.id === studentId ? updatedStudent : st))
          );

          toast.success("Passport photo updated successfully!", { id: toastId });
        } catch (error: any) {
          console.error("Upload error:", error);
          toast.error(error.message || "Failed to update passport photo", { id: toastId });
        }
      };
    } catch (err) {
      console.error(err);
      toast.error("Failed to read file", { id: toastId });
    }
  };

  const handleDeletePassportPhoto = async () => {
    if (!window.confirm("Are you sure you want to remove this passport photo?")) return;
    const toastId = toast.loading("Removing passport photo...");

    try {
      const studentId = selectedStudent._id || selectedStudent.id;
      const updateRes = await authFetch(`${API_BASE_URL}/students/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passportImage: "" }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to remove photo from student profile");
      }

      const updatedStudent = await updateRes.json();
      setSelectedStudent(updatedStudent);

      setStudents((prevStudents) =>
        prevStudents.map((st) => (st._id === studentId || st.id === studentId ? updatedStudent : st))
      );

      toast.success("Passport photo removed successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Delete photo error:", error);
      toast.error(error.message || "Failed to remove passport photo", { id: toastId });
    }
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
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    placeholder="Enter father's name"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name</Label>
                  <Input
                    id="motherName"
                    placeholder="Enter mother's name"
                    value={formData.motherName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth (DOB)</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passingYear">Passing Year</Label>
                  <Input
                    id="passingYear"
                    placeholder="e.g. 2026"
                    value={formData.passingYear}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter home address"
                    value={formData.address}
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
        <DialogContent className="max-w-[1250px] w-[95vw] overflow-y-auto max-h-[95vh] bg-slate-50 p-6">
          <DialogHeader className="no-print mb-4 border-b pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Student Profile: {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <Tabs value={activeProfileTab} onValueChange={setActiveProfileTab} className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-4 max-w-2xl mx-auto no-print bg-slate-100 p-1">
                <TabsTrigger value="receipt" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-900">
                   <FileText className="h-4 w-4" /> Latest Receipt
                </TabsTrigger>
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-900">
                   <User className="h-4 w-4" /> Student Details
                </TabsTrigger>
                <TabsTrigger value="study-cert" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-900">
                   <GraduationCap className="h-4 w-4" /> Study Certificate
                </TabsTrigger>
                <TabsTrigger value="transfer-cert" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-900">
                   <FileText className="h-4 w-4" /> Transfer Cert (TC)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="receipt" className="space-y-6 animate-in fade-in duration-300">
                {latestReceipt ? (
                  <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
                     {/* Payment Details Panel (left side, no-print) */}
                     <Card className="w-full xl:w-[320px] h-fit no-print shadow-sm border-blue-100 bg-white shrink-0">
                       <CardContent className="p-4 space-y-4">
                         <h3 className="font-bold text-base text-blue-900 border-b pb-2 flex items-center gap-2">
                           <Wallet className="h-4 w-4" /> Payment Details
                         </h3>
                         
                         <div className="space-y-2">
                           <Label className="text-xs">Payment Method</Label>
                           <Select
                             value={latestReceipt.paymentMethod || "Cash"}
                             onValueChange={(val) => handleReceiptInputChange("paymentMethod", val)}
                           >
                             <SelectTrigger className="h-9 text-xs">
                               <SelectValue placeholder="Select method" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="Cash">Cash</SelectItem>
                               <SelectItem value="Card">Card</SelectItem>
                               <SelectItem value="UPI">UPI</SelectItem>
                               <SelectItem value="Cheque">Cheque</SelectItem>
                               <SelectItem value="Other">Other</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         <div className="space-y-2">
                           <Label className="text-xs">Amount Paying Now (₹)</Label>
                           <Input
                             type="number"
                             value={amountPayingNow || ""}
                             onChange={(e) => setAmountPayingNow(Number(e.target.value) || 0)}
                             className="h-9 text-sm font-bold"
                             placeholder="0"
                           />
                         </div>

                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                           <div className="flex justify-between">
                             <span className="text-slate-500">Total Course Fee:</span>
                             <span className="font-bold">₹{calculateReceiptTotal().toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-slate-500">Previously Paid:</span>
                             <span className="font-bold text-green-600">₹{Number(latestReceipt.amountPaid || 0).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-blue-600 border-t pt-1.5 mt-1.5">
                             <span className="font-semibold">New Total Paid:</span>
                             <span className="font-bold">₹{(Number(latestReceipt.amountPaid || 0) + amountPayingNow).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-red-600 border-t pt-1.5 mt-1.5">
                             <span className="font-semibold">Remaining Due:</span>
                             <span className="font-bold">₹{Math.max(0, calculateReceiptTotal() - (Number(latestReceipt.amountPaid || 0) + amountPayingNow)).toLocaleString()}</span>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

                     {/* Receipt Preview */}
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
                             No. {isGeneratingReceiptPDF ? (
                               <span className="text-red-600 font-bold text-lg ml-6">{latestReceipt.receiptNo || "RCT-303842"}</span>
                             ) : (
                               <input
                                 type="text"
                                 style={{ ...inlineInputStyle, width: "120px" }}
                                 className="text-red-600 font-bold text-lg ml-6"
                                 value={latestReceipt.receiptNo || ""}
                                 onChange={(e) => handleReceiptInputChange("receiptNo", e.target.value)}
                               />
                             )}
                          </div>
                          <div className="flex gap-2 items-baseline">
                             Dt. {isGeneratingReceiptPDF ? (
                               <span className="font-bold ml-10">{latestReceipt.dateStr || ""}</span>
                             ) : (
                               <input
                                 type="text"
                                 style={{ ...inlineInputStyle, width: "120px" }}
                                 className="font-bold ml-10"
                                 value={latestReceipt.dateStr || ""}
                                 onChange={(e) => handleReceiptInputChange("dateStr", e.target.value)}
                               />
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-4 px-2 mb-4 text-sm">
                       <div className="flex items-end w-full border-b border-gray-400 pb-0.5">
                          {isGeneratingReceiptPDF ? (
                            <span className="shrink-0 font-bold whitespace-nowrap text-xs inline-block pb-0.5 leading-normal align-bottom">{latestReceipt.genderPrefix || "Sri /Miss"}</span>
                          ) : (
                            <input
                              type="text"
                              style={{ ...inlineInputStyle, width: "70px" }}
                              className="shrink-0 font-bold whitespace-nowrap text-xs"
                              value={latestReceipt.genderPrefix || "Sri /Miss"}
                              onChange={(e) => handleReceiptInputChange("genderPrefix", e.target.value)}
                            />
                          )}
                          {isGeneratingReceiptPDF ? (
                            <span className="ml-8 font-bold text-xl italic text-[#1e3a8a] flex-1 px-1 uppercase inline-block pb-0.5 leading-normal align-bottom">
                               {latestReceipt.studentName || selectedStudent.name}
                            </span>
                          ) : (
                            <input
                              type="text"
                              style={inlineInputStyle}
                              className="ml-8 font-bold text-xl italic text-[#1e3a8a] flex-1 px-1 uppercase leading-none"
                              value={latestReceipt.studentName || selectedStudent.name}
                              onChange={(e) => handleReceiptInputChange("studentName", e.target.value)}
                              placeholder="STUDENT NAME"
                            />
                          )}
                       </div>

                       <div className="flex items-end w-full font-bold gap-4 border-b border-gray-400 pb-0.5">
                          {isGeneratingReceiptPDF ? (
                            <span className="shrink-0 uppercase text-[9px] inline-block pb-0.5 leading-normal align-bottom">{latestReceipt.course || "D. PHARMA COURSE"} - ACADEMIC YEAR</span>
                          ) : (
                            <div className="flex gap-1 items-center shrink-0">
                              <input
                                type="text"
                                style={{ ...inlineInputStyle, width: "120px" }}
                                className="uppercase text-[9px]"
                                value={latestReceipt.course || "D. PHARMA COURSE"}
                                onChange={(e) => handleReceiptInputChange("course", e.target.value)}
                              />
                              <span className="uppercase text-[9px]">- ACADEMIC YEAR</span>
                            </div>
                          )}
                          {isGeneratingReceiptPDF ? (
                            <span className="font-bold text-sm px-2 inline-block pb-0.5 leading-normal align-bottom">{latestReceipt.academicYear || "2025-26"}</span>
                          ) : (
                            <input
                              type="text"
                              style={{ ...inlineInputStyle, width: "80px" }}
                              className="font-bold text-sm px-2"
                              value={latestReceipt.academicYear || "2025-26"}
                              onChange={(e) => handleReceiptInputChange("academicYear", e.target.value)}
                            />
                          )}
                          <div className="flex gap-6 ml-auto items-end">
                             <div className="flex gap-1 items-end">
                                <span className="uppercase text-[8px] text-gray-500">ADM NO:</span>
                                {isGeneratingReceiptPDF ? (
                                  <span className="text-[#1e3a8a] text-base inline-block pb-0.5 leading-normal border-b border-blue-900 px-1 text-center min-w-[80px]">{latestReceipt.admissionNumber || selectedStudent.admissionNumber || ""}</span>
                                ) : (
                                  <input
                                    type="text"
                                    style={{ ...inlineInputStyle, width: "100px", textAlign: "center" }}
                                    className="text-[#1e3a8a] text-base leading-none border-b border-blue-900 px-1 text-center"
                                    value={latestReceipt.admissionNumber || selectedStudent.admissionNumber || ""}
                                    onChange={(e) => handleReceiptInputChange("admissionNumber", e.target.value)}
                                  />
                                )}
                             </div>
                             <div className="flex gap-1 items-end">
                                <span className="uppercase text-[8px] text-gray-500">ROLL NO:</span>
                                {isGeneratingReceiptPDF ? (
                                  <span className="text-[#1e3a8a] text-base inline-block pb-0.5 leading-normal border-b border-blue-900 px-1 text-center min-w-[40px]">{latestReceipt.rollNo || selectedStudent.rollNo || ""}</span>
                                ) : (
                                  <input
                                    type="text"
                                    style={{ ...inlineInputStyle, width: "60px", textAlign: "center" }}
                                    className="text-[#1e3a8a] text-base leading-none border-b border-blue-900 px-1 text-center"
                                    value={latestReceipt.rollNo || selectedStudent.rollNo || ""}
                                    onChange={(e) => handleReceiptInputChange("rollNo", e.target.value)}
                                  />
                                )}
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Table Area */}
                    <div className="mb-4 bg-white flex-grow relative">
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
                                   <tr key={idx} className="border-b border-blue-900/20 h-7 group">
                                      <td className="border-r border-blue-900 p-1.5 text-center font-normal relative">
                                         {idx + 1}.
                                         {!isGeneratingReceiptPDF && (
                                            <button
                                               type="button"
                                               onClick={() => handleRemoveReceiptFeeItem(idx)}
                                               className="absolute left-1 top-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full h-5 w-5 flex items-center justify-center border font-sans font-bold"
                                               title="Delete Row"
                                            >
                                               ✕
                                            </button>
                                         )}
                                      </td>
                                      <td className="border-r border-blue-900 p-1.5 pl-6 font-semibold uppercase">
                                         {isGeneratingReceiptPDF ? (
                                            <span>{item.name}</span>
                                         ) : (
                                            <input
                                               type="text"
                                               style={inlineInputStyle}
                                               className="w-full font-semibold uppercase"
                                               value={item.name}
                                               onChange={(e) => handleReceiptFeeNameChange(idx, e.target.value)}
                                            />
                                         )}
                                      </td>
                                      <td className="p-1.5 text-right pr-6 font-semibold">
                                         {isGeneratingReceiptPDF ? (
                                            <span>{item.value > 0 ? Number(item.value).toLocaleString("en-IN") + "/-" : ""}</span>
                                         ) : (
                                            <input
                                               type="text"
                                               style={{ ...inlineInputStyle, textAlign: "right" }}
                                               className="w-full font-semibold"
                                               value={item.value}
                                               onChange={(e) => handleReceiptFeeValueChange(idx, e.target.value)}
                                            />
                                         )}
                                      </td>
                                   </tr>
                                ))
                             ) : (
                                institutionalItems.map((item, idx) => (
                                   <tr key={idx} className="border-b border-blue-900/20 h-7">
                                      <td className="border-r border-blue-900 p-1.5 text-center font-normal">{idx + 1}.</td>
                                      <td className="border-r-2 border-blue-900 p-1.5 pl-6 font-semibold uppercase">{item.name}</td>
                                      <td className="p-1.5 text-right pr-6 font-semibold">
                                         {idx === 13 ? Number(Number(latestReceipt.amountPaid || 0) + amountPayingNow).toLocaleString("en-IN") + "/-" : ""}
                                      </td>
                                   </tr>
                                ))
                             )}
                          </tbody>
                       </table>
                       {!isGeneratingReceiptPDF && (
                          <div className="mt-2 flex justify-start">
                             <Button
                                size="sm"
                                variant="outline"
                                type="button"
                                onClick={handleAddReceiptFeeItem}
                                className="h-7 text-xs border border-dashed border-blue-900 text-blue-900 hover:bg-blue-50"
                             >
                                + Add Field
                             </Button>
                          </div>
                       )}
                    </div>

                    {/* Words */}
                    <div className="px-2 mb-10 flex flex-col gap-2 border-b border-gray-300 pb-2 mt-6">
                       <div className="flex items-center w-full text-base font-bold border-b border-gray-100 pb-0.5 mb-2">
                          <span className="shrink-0 uppercase text-[10px] mr-3">Balance Due:</span>
                          <span className="font-bold text-lg text-red-600 px-2">
                             ₹{calculateReceiptDue().toLocaleString("en-IN")}/-
                          </span>
                       </div>
                       <div className="flex items-baseline w-full">
                          <span className="shrink-0 uppercase text-[10px] font-black mr-6">RUPEES IN WORDS:</span>
                          {isGeneratingReceiptPDF ? (
                             <span className="font-bold text-lg italic capitalize flex-1 text-gray-800">
                                {latestReceipt.wordsOverride || (toWords.convert(Number(latestReceipt.amountPaid || 0) + amountPayingNow) + " Only")}
                             </span>
                          ) : (
                             <input
                                type="text"
                                style={inlineInputStyle}
                                className="font-bold text-lg italic capitalize flex-1 text-gray-800"
                                value={latestReceipt.wordsOverride || (toWords.convert(Number(latestReceipt.amountPaid || 0) + amountPayingNow) + " Only")}
                                onChange={(e) => handleReceiptInputChange("wordsOverride", e.target.value)}
                             />
                          )}
                       </div>
                    </div>

                    <div className="mt-auto w-full">
                       {/* Footer - Seal and Signatories */}
                       <div className="px-2 flex justify-between items-end w-full mb-10 pb-4 font-bold">
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
                  </div>
                 </div>
                ) : (
                  <div className="py-20 text-center w-full bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-muted-foreground italic text-lg">No fee history found for this student.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="overview" className="space-y-6 no-print animate-in transition-all">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Photo Section */}
                  <Card className="w-full md:w-[200px] border-blue-100 shadow-sm overflow-hidden flex flex-col items-center justify-center p-4 bg-white shrink-0">
                    <h3 className="font-bold text-sm text-blue-900 mb-3">Passport Photo</h3>
                    <div className="w-[100px] h-[120px] border-2 border-dashed border-blue-200 rounded-md flex items-center justify-center bg-slate-50 relative overflow-hidden group shadow-inner">
                      {selectedStudent.passportImage ? (
                        <>
                          <img
                            src={selectedStudent.passportImage}
                            alt="Passport"
                            className="w-full h-full object-cover"
                          />
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
                            Update
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleOverviewPhotoUpload}
                            />
                          </label>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-slate-400 hover:text-blue-500 transition-colors">
                          <Plus className="h-6 w-6 mb-1" />
                          <span className="text-[10px] font-bold uppercase">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleOverviewPhotoUpload}
                          />
                        </label>
                      )}
                    </div>
                    {selectedStudent.passportImage && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-red-500 hover:text-red-700 text-xs mt-2 h-auto p-0"
                        onClick={handleDeletePassportPhoto}
                      >
                        Remove Photo
                      </Button>
                    )}
                  </Card>

                  {/* Details Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 w-full">
                     {/* Column 1: Academic Details & Parent & Contact Details */}
                     <div className="space-y-4 w-full">
                        <Card className="border-blue-100 shadow-sm overflow-hidden bg-white">
                          <div className="bg-blue-600 text-white p-3 flex items-center gap-2">
                             <GraduationCap className="h-5 w-5" />
                             <h3 className="font-bold">Academic Details</h3>
                          </div>
                          <CardContent className="p-4 space-y-4 pt-4">
                             <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                                <span className="text-sm text-slate-500 font-medium">Admission No</span>
                                <span className="font-bold text-blue-900">{selectedStudent.admissionNumber}</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                                <span className="text-sm text-slate-500 font-medium">Roll Number</span>
                                <span className="font-bold text-blue-900">{selectedStudent.rollNo || "N/A"}</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-blue-50 pb-2">
                                <span className="text-sm text-slate-500 font-medium">Current Class</span>
                                <span className="font-bold text-blue-900">{selectedStudent.class}</span>
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Date of Birth (DOB)</Label>
                                <Input
                                  type="date"
                                  value={selectedStudent.dob || ""}
                                  onChange={(e) => handleStudentFieldChange("dob", e.target.value)}
                                  className="h-8 text-xs bg-slate-50 border-slate-200"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Joining Date</Label>
                                <Input
                                  type="date"
                                  value={selectedStudent.joiningDate || ""}
                                  onChange={(e) => handleStudentFieldChange("joiningDate", e.target.value)}
                                  className="h-8 text-xs bg-slate-50 border-slate-200"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Passing Year</Label>
                                <Input
                                  value={selectedStudent.passingYear || ""}
                                  onChange={(e) => handleStudentFieldChange("passingYear", e.target.value)}
                                  className="h-8 text-xs bg-slate-50 border-slate-200"
                                  placeholder="e.g. 2026"
                                />
                             </div>
                          </CardContent>
                        </Card>

                        <Card className="border-indigo-100 shadow-sm overflow-hidden bg-white">
                          <div className="bg-indigo-600 text-white p-3 flex items-center gap-2">
                             <User className="h-5 w-5" />
                             <h3 className="font-bold">Parent & Contact Details</h3>
                          </div>
                          <CardContent className="p-4 space-y-3 pt-4">
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Parent/Guardian Name</Label>
                                <Input
                                  value={selectedStudent.parentName || ""}
                                  onChange={(e) => handleStudentFieldChange("parentName", e.target.value)}
                                  className="h-8 text-xs font-semibold bg-slate-50 border-slate-200"
                                  placeholder="Parent Name"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Father's Name</Label>
                                <Input
                                  value={selectedStudent.fatherName || ""}
                                  onChange={(e) => handleStudentFieldChange("fatherName", e.target.value)}
                                  className="h-8 text-xs font-semibold bg-slate-50 border-slate-200"
                                  placeholder="Father's Name"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Mother's Name</Label>
                                <Input
                                  value={selectedStudent.motherName || ""}
                                  onChange={(e) => handleStudentFieldChange("motherName", e.target.value)}
                                  className="h-8 text-xs font-semibold bg-slate-50 border-slate-200"
                                  placeholder="Mother's Name"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Parent Phone</Label>
                                <Input
                                  value={selectedStudent.parentPhone || ""}
                                  onChange={(e) => handleStudentFieldChange("parentPhone", e.target.value)}
                                  className="h-8 text-xs font-semibold bg-slate-50 border-slate-200"
                                  placeholder="Parent Phone"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Student Phone</Label>
                                <Input
                                  value={selectedStudent.phone || ""}
                                  onChange={(e) => handleStudentFieldChange("phone", e.target.value)}
                                  className="h-8 text-xs bg-slate-50 border-slate-200"
                                  placeholder="Student Phone"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Student Email</Label>
                                <Input
                                  value={selectedStudent.email || ""}
                                  onChange={(e) => handleStudentFieldChange("email", e.target.value)}
                                  className="h-8 text-xs bg-slate-50 border-slate-200"
                                  placeholder="Student Email"
                                />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs text-slate-500 font-medium">Home Address</Label>
                                <Input
                                  value={selectedStudent.address || ""}
                                  onChange={(e) => handleStudentFieldChange("address", e.target.value)}
                                  className="h-8 text-xs bg-slate-50 border-slate-200"
                                  placeholder="Home Address"
                                />
                             </div>
                          </CardContent>
                        </Card>
                     </div>

                     {/* Column 2: Fee Summary & Custom Fields */}
                     <div className="space-y-4 w-full">
                       <Card className="border-emerald-100 shadow-sm overflow-hidden bg-white">
                         <div className="bg-emerald-600 text-white p-3 flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            <h3 className="font-bold">Fee Summary</h3>
                         </div>
                         <CardContent className="p-4 space-y-4 pt-4">
                            <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                               <span className="text-sm text-slate-500 font-medium">Total Course Fee</span>
                               <span className="font-bold text-slate-900">₹{Number(latestReceipt?.totalFee || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                               <span className="text-sm text-slate-500 font-medium">Total Paid Amount</span>
                               <span className="font-bold text-emerald-600">₹{Number(latestReceipt?.amountPaid || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-sm text-slate-500 font-medium">Balance Due</span>
                               <span className="font-bold text-rose-600">₹{Number(latestReceipt?.dueAmount || 0).toLocaleString()}</span>
                            </div>
                         </CardContent>
                       </Card>

                       <Card className="border-violet-100 shadow-sm overflow-hidden bg-white">
                         <div className="bg-violet-600 text-white p-3 flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            <h3 className="font-bold">Custom Fields</h3>
                         </div>
                         <CardContent className="p-4 space-y-3 pt-4">
                            {/* Existing Custom Fields */}
                            {(selectedStudent.customFields || []).length > 0 ? (
                               <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                  {(selectedStudent.customFields || []).map((field: any, idx: number) => (
                                     <div key={idx} className="flex gap-2 items-center group">
                                        <Input
                                           className="flex-1 h-8 text-xs font-semibold uppercase bg-slate-50 border-slate-200"
                                           value={field.label}
                                           onChange={(e) => handleCustomFieldChange(idx, "label", e.target.value)}
                                           placeholder="Label"
                                        />
                                        <Input
                                           className="flex-1 h-8 text-xs bg-slate-50 border-slate-200"
                                           value={field.value}
                                           onChange={(e) => handleCustomFieldChange(idx, "value", e.target.value)}
                                           placeholder="Value"
                                        />
                                        <Button
                                           variant="ghost"
                                           size="icon"
                                           type="button"
                                           className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                           onClick={() => handleRemoveCustomField(idx)}
                                        >
                                           <Trash2 className="h-4 w-4" />
                                        </Button>
                                     </div>
                                  ))}
                               </div>
                            ) : (
                               <p className="text-xs text-muted-foreground italic text-center py-2">
                                  No custom fields added yet. Add one below!
                               </p>
                            )}

                            {/* Add New Custom Field Form */}
                            <div className="flex gap-2 items-center pt-3 border-t border-slate-100 mt-2">
                               <Input
                                  placeholder="New Field Label"
                                  value={newFieldName}
                                  onChange={(e) => setNewFieldName(e.target.value)}
                                  className="h-8 text-xs flex-1"
                               />
                               <Input
                                  placeholder="Value"
                                  value={newFieldValue}
                                  onChange={(e) => setNewFieldValue(e.target.value)}
                                  className="h-8 text-xs flex-1"
                               />
                               <Button
                                  size="sm"
                                  variant="outline"
                                  type="button"
                                  onClick={handleAddCustomField}
                                  className="h-8 text-xs border border-dashed border-violet-900 text-violet-900 hover:bg-violet-50"
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add
                               </Button>
                            </div>
                         </CardContent>
                       </Card>
                     </div>
                  </div>
                </div>
                {/* Save Details Action Panel */}
                <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
                   <Button
                      onClick={handleSaveStudentDetails}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 flex items-center gap-2"
                   >
                      <Save className="h-4 w-4" /> Save Student Details
                   </Button>
                </div>
              </TabsContent>

              <TabsContent value="study-cert" className="no-print mt-4">
                <StudyCertificate
                  isEmbedded={true}
                  prefilledData={{
                    studentId: selectedStudent?._id || selectedStudent?.id,
                    admissionNo: selectedStudent?.admissionNumber,
                    studentName: selectedStudent?.name,
                    parentName: selectedStudent?.parentName,
                    course: selectedStudent?.class?.startsWith("D.Pharm") ? "D.PHARMA" : selectedStudent?.class || "D.PHARMA",
                    regNo: selectedStudent?.rollNo,
                    passportImage: selectedStudent?.passportImage,
                  }}
                  onStudentUpdate={(updatedStudent) => {
                    setSelectedStudent(updatedStudent);
                    setStudents((prev) =>
                      prev.map((s) => (s._id === updatedStudent._id || s.id === updatedStudent._id ? updatedStudent : s))
                    );
                  }}
                />
              </TabsContent>

              <TabsContent value="transfer-cert" className="no-print mt-4">
                <TransferCertificate
                  isEmbedded={true}
                  prefilledData={{
                    admissionNo: selectedStudent?.admissionNumber,
                    studentName: selectedStudent?.name,
                    fatherName: selectedStudent?.parentName,
                    classLeft: selectedStudent?.class || "",
                    regNo: selectedStudent?.rollNo || "",
                  }}
                />
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 w-full mt-4 no-print border-t pt-4">
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Close
            </Button>
            {latestReceipt && activeProfileTab === "receipt" && (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSaveReceiptChanges}
                >
                  Save Changes
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    const el = document.getElementById("student-receipt-content");
                    if (el) {
                      setIsGeneratingReceiptPDF(true);
                      setTimeout(() => {
                        html2pdf()
                          .set({
                            margin: 0,
                            filename: `${selectedStudent.name}_Payment_Receipt.pdf`,
                            image: { type: "jpeg", quality: 1 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                          })
                          .from(el)
                          .save()
                          .then(() => {
                            setIsGeneratingReceiptPDF(false);
                          })
                          .catch(() => {
                            setIsGeneratingReceiptPDF(false);
                          });
                      }, 150);
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF Receipt
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Promote Student Dialog */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-lg shadow-xl">
          <DialogHeader className="border-b pb-3 mb-4">
            <DialogTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <User className="h-5 w-5" /> Promote / Graduate Student
            </DialogTitle>
          </DialogHeader>

          {promotingStudent ? (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2 text-sm">
                <div>
                  <span className="text-slate-500 font-medium">Student Name: </span>
                  <span className="font-bold text-slate-800">{promotingStudent.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Admission No: </span>
                  <span className="font-bold text-slate-800">{promotingStudent.admissionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Current Class: </span>
                  <span className="font-bold text-blue-800">{promotingStudent.class}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Current Status: </span>
                  <span className="font-bold text-slate-700">{promotingStudent.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoteTarget" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Target Destination / Action
                </Label>
                <Select value={promoteTarget} onValueChange={setPromoteTarget}>
                  <SelectTrigger id="promoteTarget" className="w-full">
                    <SelectValue placeholder="Select class or graduate option" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesList.map((cls: any) => {
                      const className = cls.grade.startsWith("D.")
                        ? `${cls.grade} - ${cls.section}`
                        : `Grade ${cls.grade} - ${cls.section}`;
                      return (
                        <SelectItem key={cls._id} value={className}>
                          {className} (Promote)
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="Graduated" className="text-emerald-700 font-bold hover:bg-emerald-50">
                      ★ Pass Out (Graduate Student)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePromoteStudent}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Confirm Action
                </Button>
              </div>
            </div>
          ) : selectedStudentIds.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm flex flex-col gap-1.5">
                <div className="font-semibold text-blue-900">
                  Bulk Operation Selected
                </div>
                <div className="text-slate-600">
                  You are performing a bulk action on <span className="font-bold text-slate-900">{selectedStudentIds.length}</span> students.
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoteTargetBulk" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Target Destination / Action for all selected
                </Label>
                <Select value={promoteTarget} onValueChange={setPromoteTarget}>
                  <SelectTrigger id="promoteTargetBulk" className="w-full">
                    <SelectValue placeholder="Select class or graduate option" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesList.map((cls: any) => {
                      const className = cls.grade.startsWith("D.")
                        ? `${cls.grade} - ${cls.section}`
                        : `Grade ${cls.grade} - ${cls.section}`;
                      return (
                        <SelectItem key={cls._id} value={className}>
                          {className} (Promote All)
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="Graduated" className="text-emerald-700 font-bold hover:bg-emerald-50">
                      ★ Pass Out (Graduate All)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePromoteStudent}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Confirm Bulk Action
                </Button>
              </div>
            </div>
          ) : null}
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
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-56">
            <GraduationCap className="mr-2 h-4 w-4" />
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classesList.map((cls: any) => {
              const className = cls.grade.startsWith("D.")
                ? `${cls.grade} - ${cls.section}`
                : `Grade ${cls.grade} - ${cls.section}`;
              return (
                <SelectItem key={cls._id} value={className}>
                  {className}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Graduated">Graduated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedStudentIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-sm text-blue-900 font-medium">
            <span className="bg-blue-200 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-bold">
              {selectedStudentIds.length}
            </span>
            <span>students selected for actions</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setPromotingStudent(null);
                setPromoteTarget("");
                setIsPromoteDialogOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs flex items-center gap-1.5"
            >
              <GraduationCap className="h-3.5 w-3.5" /> Bulk Promote / Graduate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedStudentIds([])}
              className="border-slate-300 text-slate-700 h-8 text-xs hover:bg-slate-100"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedStudents.length > 0 &&
                    paginatedStudents.every((s) => selectedStudentIds.includes(s._id || s.id))
                  }
                  onChange={() => handleSelectAllStudents(paginatedStudents)}
                  className="rounded border-slate-300 h-4 w-4 accent-blue-600 cursor-pointer"
                />
              </TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Total Fee</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Loading students...
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((student) => (
                <TableRow key={student._id || student.id} className={selectedStudentIds.includes(student._id || student.id) ? "bg-blue-50/20" : ""}>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student._id || student.id)}
                      onChange={() => handleSelectStudent(student._id || student.id)}
                      className="rounded border-slate-300 h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.rollNo}
                  </TableCell>
                  <TableCell>{student.admissionNumber}</TableCell>
                  <TableCell className="font-bold">{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell className="text-right font-medium">₹{getStudentFeeSummary(student._id || student.id).total.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-green-600">₹{getStudentFeeSummary(student._id || student.id).paid.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">₹{getStudentFeeSummary(student._id || student.id).due.toLocaleString()}</TableCell>
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
                          onClick={() => {
                            setPromotingStudent(student);
                            setPromoteTarget(student.class || "");
                            setIsPromoteDialogOpen(true);
                          }}
                        >
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Promote / Graduate
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredStudents.length)} of{" "}
            {filteredStudents.length} students
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className="w-8"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
