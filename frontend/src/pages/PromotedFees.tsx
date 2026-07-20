import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { Printer, Download, Calculator, Plus, Trash2, Save, Search, User, Calendar } from "lucide-react";
import { API_BASE_URL, authFetch } from "@/config";
import { ToWords } from "to-words";

const toWords = new ToWords();

const PromotedFees = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");

  const [formData, setFormData] = useState({
    receiptNo: "0",
    date: new Date().toLocaleDateString("en-GB"),
    studentName: "",
    genderPrefix: "Sri /Miss",
    parentName: "",
    class: "",
    course: "D. Pharma",
    academicYear: "2025-26",
    yearPrefix: "2",
    rollNo: "",
    admissionNumber: "",
    email: "",
    parentPhone: "",
    paymentMethod: "Cash",
    chequeNo: "",
    payingAmount: "0",
    wordsOverride: "",
  });

  const [feeItems, setFeeItems] = useState([
    { id: 1, name: "Application Fee", value: "0" },
    { id: 2, name: "Admission Fee", value: "0" },
    { id: 3, name: "Eligibility Fee", value: "0" },
    { id: 4, name: "Tuition Fee", value: "0" },
    { id: 5, name: "Library & R.R. Fee", value: "0" },
    { id: 6, name: "Identity Card Fee", value: "0" },
    { id: 7, name: "Laboratory Fee", value: "0" },
    { id: 8, name: "Sports Fee", value: "0" },
    { id: 9, name: "Cultural Fee", value: "0" },
    { id: 10, name: "Annual Day Fee", value: "0" },
    { id: 11, name: "Digital Library Fee", value: "0" },
    { id: 12, name: "Internal Examination Fee", value: "0" },
    { id: 13, name: "Breakage Fee", value: "0" },
    { id: 14, name: "Others", value: "0" },
  ]);

  const generateReceiptNumber = () => {
    const storedSeq = localStorage.getItem("promotedReceiptNoSeq");
    let seq = storedSeq ? parseInt(storedSeq) + 1 : 101; // start promoted receipts at 101
    localStorage.setItem("promotedReceiptNoSeq", seq.toString());
    setFormData((prev) => ({ ...prev, receiptNo: seq.toString().padStart(3, "0") }));
  };

  // Fetch Students & Classes on Mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [studentsRes, classesRes, feesRes, structuresRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/students`),
          authFetch(`${API_BASE_URL}/classes`),
          authFetch(`${API_BASE_URL}/fees`),
          authFetch(`${API_BASE_URL}/fee-structures`)
        ]);

        let promotedStudentIds = new Set<string>();
        let feesData: any[] = [];
        if (feesRes.ok) {
          feesData = await feesRes.json();
          feesData.forEach((f: any) => {
            if (f.feeType === "Promoted Fee Payment" && f.studentId) {
              promotedStudentIds.add(f.studentId.toString());
            }
          });
        }

        let structuresData: any[] = [];
        if (structuresRes.ok) {
          structuresData = await structuresRes.json();
        }

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          const activeStudents = studentsData.filter((s: any) => {
            const sid = (s._id || s.id || "").toString();
            const isExcluded = promotedStudentIds.has(sid);
            if (isExcluded || s.status !== "Active") return false;

            // Check if student has a fee structure or payment for a different class/grade (indicating promotion)
            const hasDifferentClassStructure = structuresData.some(
              (fs: any) => String(fs.studentId) === sid && 
                           (fs.grade || "").toLowerCase().trim() !== (s.class || "").toLowerCase().trim()
            );

            const hasDifferentClassFee = feesData.some(
              (f: any) => String(f.studentId) === sid && 
                          (f.grade || "").toLowerCase().trim() !== (s.class || "").toLowerCase().trim()
            );

            return hasDifferentClassStructure || hasDifferentClassFee;
          });
          setStudentsList(activeStudents);
        }

        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClassesList(classesData);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
    generateReceiptNumber();
  }, []);

  const getStudentAcademicYear = (student: any) => {
    return student.academicYear || "";
  };

  // Sync filtered students when search query, class filter, or academic year filter changes
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = studentsList.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(query) ||
        s.admissionNumber.toLowerCase().includes(query);
      const matchesClass =
        classFilter === "all" || s.class === classFilter;
      
      const studentYear = s.academicYear || "";
      const matchesAcademicYear =
        academicYearFilter === "all" || studentYear === academicYearFilter;
        
      return matchesSearch && matchesClass && matchesAcademicYear;
    });
    setFilteredStudents(filtered);
  }, [searchQuery, classFilter, academicYearFilter, studentsList, classesList]);

  // Handle outside click for searchable dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleStudentSearch = (val: string) => {
    setSearchQuery(val);
    setIsDropdownOpen(true);
  };

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setSearchQuery(student.name);
    setIsDropdownOpen(false);
    const isSecondYear = student.class?.includes("2");
    setFormData((prev) => ({
      ...prev,
      studentName: student.name,
      admissionNumber: student.admissionNumber,
      rollNo: student.rollNo || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      class: student.class || "",
      email: student.email || "",
      course: student.class?.startsWith("D.") ? "D. PHARMA" : "Pharmacy Course",
      yearPrefix: isSecondYear ? "2" : "1",
      academicYear: student.academicYear || prev.academicYear,
    }));
  };

  const addCustomFee = () => {
    setFeeItems([
      ...feeItems,
      { id: Date.now(), name: "New Fee Field", value: "0" },
    ]);
  };

  const removeFeeItem = (id: number) => {
    setFeeItems(feeItems.filter((fee) => fee.id !== id));
  };

  const handleFeeValueChange = (id: number, newValue: string) => {
    setFeeItems(
      feeItems.map((item) =>
        item.id === id ? { ...item, value: newValue } : item
      )
    );
  };

  const handleFeeNameChange = (id: number, newName: string) => {
    setFeeItems(
      feeItems.map((item) =>
        item.id === id ? { ...item, name: newName } : item
      )
    );
  };

  const calculateTotal = () => {
    return feeItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  };

  const calculateDue = () => {
    const total = calculateTotal();
    const paid = Number(formData.payingAmount) || 0;
    return Math.max(0, total - paid);
  };

  // Sync paying amount with total fee items
  useEffect(() => {
    const total = calculateTotal();
    setFormData((prev) => ({ ...prev, payingAmount: total.toString() }));
  }, [feeItems]);

  const handleRegisterPromotedFees = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student from the dropdown list first.");
      return;
    }

    try {
      const feeItemsPayload = feeItems.map((item) => ({
        name: item.name,
        value: Number(item.value) || 0,
      }));

      const totalFee = calculateTotal();
      const payingAmount = Number(formData.payingAmount) || 0;
      const dueAmount = calculateDue();

      // 1. Create/Save Fee Structure
      const feeStructurePayload = {
        studentId: selectedStudent._id || selectedStudent.id,
        studentName: formData.studentName,
        admissionNumber: formData.admissionNumber,
        rollNo: formData.rollNo || "",
        grade: formData.class,
        academicYear: formData.academicYear,
        feeItems: feeItemsPayload,
        totalFee: totalFee,
        paymentMethod: formData.paymentMethod,
        paymentDate: new Date(),
      };

      const structureRes = await authFetch(`${API_BASE_URL}/fee-structures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feeStructurePayload),
      });

      if (!structureRes.ok) {
        toast.error("Failed to register promoted fee structure.");
        return;
      }

      // 2. Create/Save Payment record (feeType: "Promoted Fee Payment")
      const paymentPayload = {
        studentId: selectedStudent._id || selectedStudent.id,
        studentName: formData.studentName,
        admissionNumber: formData.admissionNumber,
        grade: formData.class,
        feeType: "Promoted Fee Payment",
        amountPaid: payingAmount,
        dueAmount: dueAmount,
        totalFee: totalFee,
        receiptNo: formData.receiptNo,
        academicYear: formData.academicYear,
        wordsOverride: formData.wordsOverride || (payingAmount > 0 ? toWords.convert(payingAmount) + " Only" : ""),
        paymentMethod: formData.paymentMethod === "Cheque" ? "Other" : formData.paymentMethod,
        date: new Date(),
        status: dueAmount === 0 ? "Paid" : "Pending",
        feeItems: feeItemsPayload,
      };

      const paymentRes = await authFetch(`${API_BASE_URL}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      if (!paymentRes.ok) {
        toast.error("Fee structure saved, but failed to record payment transaction.");
        return;
      }

      // 3. Update the Student record in the database with the new academicYear, class, and rollNo
      const studentUpdateRes = await authFetch(`${API_BASE_URL}/students/${selectedStudent._id || selectedStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear: formData.academicYear,
          class: formData.class,
          rollNo: formData.rollNo,
        }),
      });

      if (!studentUpdateRes.ok) {
        toast.error("Fee saved, but failed to update student academic year/class in database.");
        return;
      }

      toast.success(
        dueAmount === 0
          ? "Promoted Fee, Payment, and Student Academic Year updated successfully!"
          : `Promoted Fee registered with ₹${dueAmount} dues (Student Academic Year updated).`
      );

      // Download PDF receipt
      handleDownloadPDF();

      // Remove student from dropdown list locally
      setStudentsList((prev) =>
        prev.filter(
          (s) =>
            (s._id || s.id) !== selectedStudent._id &&
            (s._id || s.id) !== selectedStudent.id
        )
      );

      // Clear selection and form
      setTimeout(() => {
        setSelectedStudent(null);
        setSearchQuery("");
        setFormData((prev) => ({
          ...prev,
          studentName: "",
          email: "",
          rollNo: "",
          parentPhone: "",
          parentName: "",
          payingAmount: "0",
          chequeNo: "",
          wordsOverride: "",
          class: "",
          admissionNumber: "",
        }));

        generateReceiptNumber();
        // Reset fee items to 0
        setFeeItems((prev) => prev.map((item) => ({ ...item, value: "0" })));
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during registration.");
    }
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;

    setIsGeneratingPDF(true);

    const namePart = formData.studentName.trim() || "Student";
    const safeName = namePart.replace(/[^a-z0-9]/gi, "_");
    const filename = `${safeName}_Promoted_Fee_Receipt.pdf`;

    const element = printRef.current;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 1 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    setTimeout(() => {
      html2pdf()
        .set(opt)
        .from(element)
        .outputPdf("blob")
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success("Promoted Fee Receipt downloaded successfully!");
          setIsGeneratingPDF(false);
        })
        .catch((error) => {
          console.error("Error generating PDF:", error);
          toast.error("Failed to generate PDF");
          setIsGeneratingPDF(false);
        });
    }, 150);
  };

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto p-4">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promoted Fee Receipt</h1>
          <p className="text-muted-foreground animate-pulse text-sm font-semibold text-blue-800">
            Select promoted/existing student to register their next year fees (e.g. 2nd year)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Preview
          </Button>
          <Button variant="outline" onClick={() => handleDownloadPDF()}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={() => handleRegisterPromotedFees()} className="bg-blue-900 text-white">
            <Save className="mr-2 h-4 w-4" />
            Submit Promoted Fee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Input Details */}
        <Card className="lg:col-span-2 h-fit no-print sticky top-4">
          <CardHeader className="pb-3 border-b bg-blue-50/50">
            <CardTitle className="flex items-center gap-2 text-xl text-blue-900">
              <Calculator className="h-6 w-6" />
              Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 max-h-[90vh] overflow-y-auto pr-4 py-6">
            {/* Class Filter */}
            <div className="space-y-2">
              <Label className="font-bold text-blue-900">Filter by Class</Label>
              <Select value={classFilter} onValueChange={(val) => {
                setClassFilter(val);
                if (selectedStudent && val !== "all" && selectedStudent.class !== val) {
                  setSelectedStudent(null);
                  setSearchQuery("");
                }
              }}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Classes</SelectItem>
                  {classesList.map((cls: any) => {
                    const className = cls.grade.startsWith("D.")
                      ? (cls.section ? `${cls.grade} - ${cls.section}` : cls.grade)
                      : (cls.section ? `Grade ${cls.grade} - ${cls.section}` : `Grade ${cls.grade}`);
                    return (
                      <SelectItem key={cls._id || className} value={className}>
                        {className}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Academic Year Filter */}
            <div className="space-y-2">
              <Label className="font-bold text-blue-900">Filter by Academic Year</Label>
              <Select value={academicYearFilter} onValueChange={(val) => {
                setAcademicYearFilter(val);
                if (selectedStudent && val !== "all") {
                  const studentYear = selectedStudent.academicYear || "";
                  if (studentYear !== val) {
                    setSelectedStudent(null);
                    setSearchQuery("");
                  }
                }
              }}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="All Academic Years" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Academic Years</SelectItem>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                  <SelectItem value="2026-27">2026-27</SelectItem>
                  <SelectItem value="2027-28">2027-28</SelectItem>
                  <SelectItem value="2028-29">2028-29</SelectItem>
                  <SelectItem value="2029-30">2029-30</SelectItem>
                  <SelectItem value="2030-31">2030-31</SelectItem>
                  <SelectItem value="2031-32">2031-32</SelectItem>
                  <SelectItem value="2032-33">2032-33</SelectItem>
                  <SelectItem value="2033-34">2033-34</SelectItem>
                  <SelectItem value="2034-35">2034-35</SelectItem>
                  <SelectItem value="2035-36">2035-36</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Student Dropdown */}
            <div ref={dropdownRef} className="space-y-2 relative">
              <Label className="font-bold text-blue-900">Select Promoted Student *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student by name or admission number..."
                  value={searchQuery}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="pl-9 border-blue-200 focus-visible:ring-blue-950 font-medium"
                />
                {isDropdownOpen && filteredStudents.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <div
                        key={s._id || s.id}
                        onClick={() => handleSelectStudent(s)}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm border-b last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-blue-900" /> {s.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium ml-5">
                            Class: {s.class || "N/A"}
                          </span>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-950 font-bold px-2 py-0.5 rounded">
                          {s.admissionNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receipt No.</Label>
                <Input
                  value={formData.receiptNo}
                  onChange={(e) => handleInputChange("receiptNo", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Student Name</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.genderPrefix}
                  onValueChange={(val) => handleInputChange("genderPrefix", val)}
                >
                  <SelectTrigger className="w-24 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sri /Miss">Sri /Miss</SelectItem>
                    <SelectItem value="Kum/Mr.">Kum/Mr.</SelectItem>
                  </SelectContent>
                </Select>
                {selectedStudent ? (
                  <div className="flex-1 flex items-center px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 cursor-not-allowed select-none">
                    {formData.studentName || <span className="text-slate-400">—</span>}
                  </div>
                ) : (
                  <Input
                    className="flex-1"
                    value={formData.studentName}
                    onChange={(e) => handleInputChange("studentName", e.target.value)}
                    placeholder="Student Name"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              {selectedStudent ? (
                <div className="flex items-center px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 cursor-not-allowed select-none">
                  {formData.academicYear || <span className="text-slate-400">—</span>}
                </div>
              ) : (
                <Select
                  value={formData.academicYear}
                  onValueChange={(val) => handleInputChange("academicYear", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2026-27">2026-27</SelectItem>
                    <SelectItem value="2027-28">2027-28</SelectItem>
                    <SelectItem value="2028-29">2028-29</SelectItem>
                    <SelectItem value="2029-30">2029-30</SelectItem>
                    <SelectItem value="2030-31">2030-31</SelectItem>
                    <SelectItem value="2031-32">2031-32</SelectItem>
                    <SelectItem value="2032-33">2032-33</SelectItem>
                    <SelectItem value="2033-34">2033-34</SelectItem>
                    <SelectItem value="2034-35">2034-35</SelectItem>
                    <SelectItem value="2035-36">2035-36</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Class / Course</Label>
                {selectedStudent ? (
                  <div className="flex items-center px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 cursor-not-allowed select-none">
                    {formData.class || <span className="text-slate-400">—</span>}
                  </div>
                ) : (
                  <Input
                    value={formData.class}
                    onChange={(e) => handleInputChange("class", e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll No.</Label>
                {selectedStudent ? (
                  <div className="flex items-center px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 cursor-not-allowed select-none">
                    {formData.rollNo || <span className="text-slate-400">—</span>}
                  </div>
                ) : (
                  <Input
                    value={formData.rollNo}
                    onChange={(e) => handleInputChange("rollNo", e.target.value)}
                    placeholder="Roll No"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Admission No.</Label>
                {selectedStudent ? (
                  <div className="flex items-center px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 cursor-not-allowed select-none">
                    {formData.admissionNumber || <span className="text-slate-400">—</span>}
                  </div>
                ) : (
                  <Input
                    value={formData.admissionNumber}
                    onChange={(e) => handleInputChange("admissionNumber", e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dotted">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(val) => handleInputChange("paymentMethod", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.paymentMethod === "Cheque" && (
                <div className="space-y-2">
                  <Label>Cheque No.</Label>
                  <Input
                    value={formData.chequeNo}
                    onChange={(e) => handleInputChange("chequeNo", e.target.value)}
                    placeholder="Cheque Number"
                  />
                </div>
              )}
            </div>

            {/* Fee Particulars */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-800">Fee Particulars</h3>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  className="h-7 text-xs border-blue-900 text-blue-900 hover:bg-blue-50"
                  onClick={addCustomFee}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
                </Button>
              </div>

              <div className="space-y-2 pr-2">
                {feeItems.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center group">
                    <Input
                      className="flex-1 h-8 text-xs font-semibold uppercase"
                      value={item.name}
                      onChange={(e) => handleFeeNameChange(item.id, e.target.value)}
                    />
                    <Input
                      type="number"
                      className="w-24 h-8 text-xs text-right font-semibold"
                      value={item.value}
                      onChange={(e) => handleFeeValueChange(item.id, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFeeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Area */}
            <div className="bg-slate-100 p-4 rounded-lg space-y-4 shadow-inner border border-blue-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg text-slate-700 font-bold">
                  <span>Total Fee Amount:</span>
                  <span>₹ {calculateTotal().toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-blue-900 font-black uppercase text-[10px]">
                      Amount Paying Now
                    </Label>
                    <Input
                      type="number"
                      className="h-10 text-lg font-black border-2 border-blue-300 focus:border-blue-600 bg-white"
                      value={formData.payingAmount}
                      onChange={(e) => handleInputChange("payingAmount", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-red-900 font-black uppercase text-[10px]">
                      Balance Due Amount
                    </Label>
                    <div className="h-10 text-lg font-black border-2 border-red-100 bg-red-50 flex items-center px-3 text-red-600 rounded-md">
                      ₹ {calculateDue().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full h-14 text-xl font-black bg-blue-900 hover:bg-black shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3 text-white uppercase tracking-widest"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRegisterPromotedFees();
                  }}
                >
                  <Save className="h-6 w-6" />
                  SUBMIT & PRINT RECEIPT
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: PDF Preview */}
        <div className="lg:col-span-3 overflow-auto bg-gray-500/10 p-4 rounded-xl flex justify-center items-start min-h-[1000px]">
          <div
            ref={printRef}
            className="bg-white text-black px-8 py-6 w-[794px] h-[1000px] shadow-2xl flex flex-col relative border border-gray-200 shrink-0 select-none"
            style={{ fontFamily: "'Times New Roman', serif", boxSizing: "border-box" }}
          >
            {/* Header Box */}
            <div className="border border-blue-900 p-1.5 flex flex-col items-center relative mb-2">
              <div className="flex items-center w-full gap-4 mb-2">
                {/* Logo Section */}
                <div className="flex items-center gap-1 shrink-0 border-r-2 border-blue-900 pr-4">
                  <div className="flex flex-col text-[10px] font-bold text-blue-900 leading-none py-1">
                    <span>S</span>
                    <span>S</span>
                    <span>S</span>
                    <span>C</span>
                    <span>P</span>
                  </div>
                  <img
                    src="/ssscp_logo.png"
                    alt=""
                    className="h-20 w-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/college_logo.png";
                    }}
                  />
                </div>

                <div className="flex-1 text-center pr-12">
                  <h1 className="text-2xl font-bold tracking-tight text-blue-900 leading-none mb-1">
                    S.S.S. College of Pharmacy
                  </h1>
                  <p className="text-[10px] font-bold leading-tight uppercase text-gray-800">
                    Akshara Campus, Akshara Nagar, Opp. JNNCE, Savalanga Road,
                  </p>
                  <p className="text-[10px] font-bold leading-tight uppercase text-gray-800">
                    SHIVAMOGGA - 577 204.
                  </p>
                  <p className="text-[10px] font-bold leading-tight mt-1 text-gray-800">
                    Mob. +91 94481 27880, 96329 17880
                  </p>
                </div>
              </div>

              <div className="w-full flex justify-center mt-0.5 border-t border-blue-900 pt-0.5">
                <span className="font-bold text-base underline underline-offset-4 decoration-1">
                  FEE RECEIPT (2nd YEAR)
                </span>
              </div>

              {/* Receipt Info Line */}
              <div className="w-full flex justify-between px-2 mt-1 text-sm font-bold">
                <div className="flex gap-1 items-baseline">
                  No.{" "}
                  {isGeneratingPDF ? (
                    <span className="text-red-600 ml-4 font-normal text-xl tracking-tighter">
                      {formData.receiptNo || ""}
                    </span>
                  ) : (
                    <input
                      type="text"
                      style={{ ...inlineInputStyle, width: "100px" }}
                      className="text-red-600 ml-4 font-normal text-xl tracking-tighter"
                      value={formData.receiptNo}
                      onChange={(e) => handleInputChange("receiptNo", e.target.value)}
                    />
                  )}
                </div>
                <div className="flex gap-1 items-baseline">
                  Dt.{" "}
                  {isGeneratingPDF ? (
                    <span className="ml-4 font-normal text-lg">{formData.date || ""}</span>
                  ) : (
                    <input
                      type="text"
                      style={{ ...inlineInputStyle, width: "120px" }}
                      className="ml-4 font-normal text-lg"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Student Details Section */}
            <div className="space-y-3 px-2 mb-2 text-base">
              <div style={{ display: "flex", alignItems: "baseline", width: "100%", borderBottom: "1px solid #9ca3af", paddingBottom: "2px" }}>
                {isGeneratingPDF ? (
                  <span style={{ fontWeight: "bold", whiteSpace: "nowrap", fontSize: "14px", lineHeight: "1.4", flexShrink: 0 }}>
                    {formData.genderPrefix}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={{ ...inlineInputStyle, width: "70px", fontSize: "14px", fontWeight: "bold", flexShrink: 0 }}
                    value={formData.genderPrefix}
                    onChange={(e) => handleInputChange("genderPrefix", e.target.value)}
                  />
                )}
                {isGeneratingPDF ? (
                  <span style={{ marginLeft: "12px", fontWeight: "bold", fontSize: "20px", fontStyle: "italic", color: "#1e3a8a", textTransform: "uppercase", flex: 1, lineHeight: "1.4" }}>
                    {formData.studentName || ""}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={{ ...inlineInputStyle, marginLeft: "12px", fontWeight: "bold", fontSize: "20px", fontStyle: "italic", color: "#1e3a8a", textTransform: "uppercase", flex: 1 }}
                    value={formData.studentName}
                    onChange={(e) => handleInputChange("studentName", e.target.value)}
                    placeholder="STUDENT NAME"
                    disabled
                  />
                )}
              </div>

              {/* Course Info Row */}
              <div style={{ display: "flex", alignItems: "baseline", width: "100%", marginTop: "16px", borderBottom: "1px solid #9ca3af", paddingBottom: "3px", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px" }}>

                {/* Course Name: D. PHARMA */}
                {isGeneratingPDF ? (
                  <span style={{ flexShrink: 0, textTransform: "uppercase", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px" }}>
                    {formData.course}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={{ ...inlineInputStyle, width: "85px", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px", textTransform: "uppercase" }}
                    value={formData.course}
                    onChange={(e) => handleInputChange("course", e.target.value)}
                  />
                )}

                {/* Year Prefix: 1 or 2 */}
                {isGeneratingPDF ? (
                  <span style={{ flexShrink: 0, textTransform: "uppercase", marginLeft: "8px", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px" }}>
                    {formData.yearPrefix}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={{ ...inlineInputStyle, width: "20px", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px", textTransform: "uppercase", marginLeft: "8px" }}
                    value={formData.yearPrefix}
                    onChange={(e) => handleInputChange("yearPrefix", e.target.value)}
                  />
                )}

                {/* Label: COURSE - ACADEMIC YEAR */}
                <span style={{ flexShrink: 0, textTransform: "uppercase", marginLeft: "24px", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "11px", whiteSpace: "nowrap" }}>
                  Course - Academic Year
                </span>

                {/* Academic Year Value */}
                {isGeneratingPDF ? (
                  <span style={{ flexShrink: 0, marginLeft: "6px", textAlign: "center", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px" }}>
                    {formData.academicYear}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={{ ...inlineInputStyle, width: "60px", textAlign: "center", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px", marginLeft: "6px" }}
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange("academicYear", e.target.value)}
                  />
                )}

                {/* ADM NO label + value */}
                <span style={{ flexShrink: 0, marginLeft: "20px", textTransform: "uppercase", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "11px", whiteSpace: "nowrap" }}>
                  ADM NO:
                </span>
                {isGeneratingPDF ? (
                  <span style={{ flexShrink: 0, marginLeft: "6px", textAlign: "center", color: "#1e3a8a", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px", display: "inline-block" }}>
                    {formData.admissionNumber || ""}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={{ ...inlineInputStyle, width: "75px", textAlign: "center", color: "#1e3a8a", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px", marginLeft: "6px" }}
                    value={formData.admissionNumber}
                    onChange={(e) => handleInputChange("admissionNumber", e.target.value)}
                    disabled
                  />
                )}

                {/* ROLL NO label + value */}
                <span style={{ flexShrink: 0, marginLeft: "20px", textTransform: "uppercase", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "11px", whiteSpace: "nowrap" }}>
                  Roll No:
                </span>
                {isGeneratingPDF ? (
                  <span style={{ flexShrink: 0, marginLeft: "6px", textAlign: "center", color: "#1e3a8a", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px", display: "inline-block" }}>
                    {formData.rollNo || ""}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={{ ...inlineInputStyle, width: "45px", textAlign: "center", color: "#1e3a8a", fontFamily: "'Times New Roman', serif", fontWeight: "bold", fontSize: "12px", marginLeft: "6px" }}
                    value={formData.rollNo}
                    onChange={(e) => handleInputChange("rollNo", e.target.value)}
                  />
                )}

              </div>
            </div>



            {/* Table Area */}
            <div className="mb-2 bg-white">
              <table className="w-full text-sm font-bold border-2 border-blue-900 border-collapse table-fixed">
                <thead>
                  <tr className="border-b-2 border-blue-900 bg-blue-50/20">
                    <th className="border-r-2 border-blue-900 p-1 w-[10%] text-center text-xs">No.</th>
                    <th className="border-r-2 border-blue-900 p-1 w-[65%] text-left pl-3 uppercase text-xs">
                      Particulars
                    </th>
                    <th className="p-1 w-[25%] text-center uppercase text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {feeItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="border-r-2 border-blue-900 p-1 text-center font-normal">
                        {idx + 1}.
                      </td>
                      <td className="border-r-2 border-blue-900 p-1 pl-4 font-semibold text-[15px] uppercase">
                        {isGeneratingPDF ? (
                          <span>{item.name}</span>
                        ) : (
                          <input
                            type="text"
                            style={inlineInputStyle}
                            className="w-full font-semibold uppercase"
                            value={item.name}
                            onChange={(e) => handleFeeNameChange(item.id, e.target.value)}
                          />
                        )}
                      </td>
                      <td className="p-1 text-right pr-6 tracking-wider font-semibold">
                        {isGeneratingPDF ? (
                          <span>
                            {Number(item.value) > 0
                              ? Number(item.value).toLocaleString("en-IN") + "/-"
                              : ""}
                          </span>
                        ) : (
                          <input
                            type="text"
                            style={{ ...inlineInputStyle, textAlign: "right" }}
                            className="w-full tracking-wider font-semibold"
                            value={item.value}
                            onChange={(e) => handleFeeValueChange(item.id, e.target.value)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Due Amount & Rupees in Words */}
            <div className="px-2 mb-10 mt-4 space-y-4">
              <div className="flex items-center w-full text-base font-bold border-b border-gray-400 pb-0.5">
                <span className="shrink-0 uppercase text-[10px] mr-3">Balance Due:</span>
                <span className="font-bold text-lg text-red-600 px-2">
                  ₹{calculateDue().toLocaleString("en-IN")}/-
                </span>
              </div>

              <div className="flex items-start w-full text-base font-bold border-b border-gray-400 pb-0.5">
                <span className="shrink-0 uppercase text-[10px] mr-3 mt-1.5">Rupees in words:</span>
                {isGeneratingPDF ? (
                  <span className="font-bold text-base italic capitalize py-0.5 text-gray-800">
                    {formData.wordsOverride ||
                      (Number(formData.payingAmount) > 0
                        ? toWords.convert(Number(formData.payingAmount)) + " Only"
                        : "")}
                  </span>
                ) : (
                  <input
                    type="text"
                    style={inlineInputStyle}
                    className="font-bold text-base italic capitalize py-0.5 text-gray-800 w-full"
                    value={
                      formData.wordsOverride ||
                      (Number(formData.payingAmount) > 0
                        ? toWords.convert(Number(formData.payingAmount)) + " Only"
                        : "")
                    }
                    onChange={(e) => handleInputChange("wordsOverride", e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="mt-auto w-full">
              {/* Signature Area */}
              <div className="px-2 flex justify-between items-end w-full mb-10 pb-4">
                <div className="w-[40%] flex flex-col items-start border-t border-gray-400 pt-1">
                  <p className="font-bold text-[10px] uppercase text-gray-700 underline mb-0.5">
                    Institutional Seal
                  </p>
                  <div className="h-8 w-full"></div>
                </div>
                <div className="w-[45%] flex flex-col items-center border-t border-blue-900 pt-1">
                  <p className="font-bold text-xs uppercase text-blue-900">
                    SIGNATURE OF THE RECEIVER
                  </p>
                  <div className="h-8 w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotedFees;
