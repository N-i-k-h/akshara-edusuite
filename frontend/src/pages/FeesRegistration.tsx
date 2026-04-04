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
import { Printer, Download, Calculator, Plus, Trash2, Save, CreditCard } from "lucide-react";
import { API_BASE_URL, authFetch } from "@/config";
import { ToWords } from 'to-words';

const toWords = new ToWords();

const FeesRegistration = () => {
  const printRef = useRef(null);

  const [classesList, setClassesList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    receiptNo: "623",
    date: new Date().toLocaleDateString("en-GB"),
    studentName: "",
    genderPrefix: "Sri /Miss",
    parentName: "",
    class: "",
    course: "D. Pharma",
    academicYear: "2025-26",
    yearPrefix: "I / II",
    rollNo: "",
    admissionNumber: "",
    email: "",
    parentPhone: "",
    paymentMethod: "Cash",
    chequeNo: "",
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

  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");

  // Generate Admission Number and Fetch Classes on Mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesRes = await authFetch(`${API_BASE_URL}/classes`);
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          setClassesList(classesData);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();

    const generateAdmissionNumber = () => {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const storedSeq = localStorage.getItem("feeEstimationSeq");
      let seq = storedSeq ? parseInt(storedSeq) : 0;
      seq += 1;
      localStorage.setItem("feeEstimationSeq", seq.toString());
      const formattedSeq = seq.toString().padStart(3, "0");
      const newAdmNo = `${currentYear}01${formattedSeq}`;
      setFormData((prev) => ({ ...prev, admissionNumber: newAdmNo }));
    };

    generateAdmissionNumber();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const addCustomFee = () => {
    if (!newFeeName || !newFeeAmount) {
      toast.error("Please enter both fee name and amount");
      return;
    }
    setFeeItems([
      ...feeItems,
      { id: Date.now(), name: newFeeName, value: newFeeAmount },
    ]);
    setNewFeeName("");
    setNewFeeAmount("");
  };

  const removeFeeItem = (id: number) => {
    setFeeItems(feeItems.filter((fee) => fee.id !== id));
  };

  const handleFeeValueChange = (id: number, newValue: string) => {
    setFeeItems(feeItems.map(item => 
      item.id === id ? { ...item, value: newValue } : item
    ));
  };

  const handleFeeNameChange = (id: number, newName: string) => {
    setFeeItems(feeItems.map(item => 
      item.id === id ? { ...item, name: newName } : item
    ));
  };

  const calculateTotal = () => {
    return feeItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  };

  const handleRegisterStudentAndFees = async (isPaid: boolean = true) => {
    if (!formData.studentName || !formData.class || !formData.parentName || !formData.parentPhone) {
      toast.error("Please fill required student details (Name, Class, Parent Name, Parent Phone).");
      return;
    }

    try {
      const studentPayload = {
        name: formData.studentName,
        admissionNumber: formData.admissionNumber,
        rollNo: formData.rollNo || "",
        email: formData.email || "",
        phone: formData.parentPhone,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        class: formData.class,
        status: "Active"
      };

      const studentRes = await authFetch(`${API_BASE_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentPayload)
      });

      if (!studentRes.ok) {
        const errorData = await studentRes.json();
        toast.error(errorData.message || "Failed to register student");
        return;
      }

      const newStudent = await studentRes.json();

      const feeItemsPayload = feeItems.map(item => ({
        name: item.name,
        value: Number(item.value) || 0
      }));

      const totalFee = calculateTotal();

      const feePayload = {
        studentId: newStudent._id,
        studentName: newStudent.name,
        admissionNumber: newStudent.admissionNumber,
        rollNo: newStudent.rollNo || "",
        grade: newStudent.class,
        academicYear: formData.academicYear,
        feeItems: feeItemsPayload,
        totalFee: totalFee,
        paymentMethod: formData.paymentMethod,
        paymentDate: new Date()
      };

      const feeRes = await authFetch(`${API_BASE_URL}/fee-structures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feePayload)
      });

      if (!feeRes.ok) {
        toast.error("Student registered but failed to register fee structure.");
        return;
      }

      if (isPaid) {
         // 3. Mark the payment in the main fees tracking system (so it doesn't show as Due)
         const paymentPayload = {
           studentId: newStudent._id,
           studentName: newStudent.name,
           admissionNumber: newStudent.admissionNumber,
           grade: newStudent.class,
           feeType: "Fee Receipt Payment",
           amountPaid: totalFee,
           dueAmount: 0,
           paymentMethod: formData.paymentMethod === "Cheque" ? "Other" : formData.paymentMethod, // Map to enum ["Card", "Cash", "UPI", "Other"]
           date: new Date(),
           status: "Paid"
         };

         await authFetch(`${API_BASE_URL}/fees`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(paymentPayload)
         });
      } else {
        // Register without payment (sets full due amount)
        const duePayload = {
          studentId: newStudent._id,
          studentName: newStudent.name,
          admissionNumber: newStudent.admissionNumber,
          grade: newStudent.class,
          feeType: "Fee Structure Defined",
          amountPaid: 0,
          dueAmount: totalFee,
          paymentMethod: "Other",
          date: new Date(),
          status: "Pending"
        };

        await authFetch(`${API_BASE_URL}/fees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duePayload)
        });
      }

      toast.success(isPaid ? "Student and Payment registered successfully!" : "Student registered with dues.");

      // 4. Download PDF automatically
      handleDownloadPDF();

      // 2. Prepare for next entry after a short delay
      setTimeout(() => {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const storedSeq = localStorage.getItem("feeEstimationSeq");
        let seq = storedSeq ? parseInt(storedSeq) : 0;
        seq += 1;
        localStorage.setItem("feeEstimationSeq", seq.toString());
        const newAdmNo = `${currentYear}01${seq.toString().padStart(3, "0")}`;

        setFormData(prev => ({
          ...prev,
          studentName: "",
          email: "",
          rollNo: "",
          parentPhone: "",
          parentName: "",
          admissionNumber: newAdmNo,
          receiptNo: (parseInt(prev.receiptNo || "623") + 1).toString(),
          chequeNo: ""
        }));

        // Reset fee items to 0
        setFeeItems(prev => prev.map(item => ({ ...item, value: "0" })));
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error("An error occurred during registration.");
    }
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;

    const namePart = formData.studentName.trim() || "Student";
    const safeName = namePart.replace(/[^a-z0-9]/gi, "_");
    const filename = `${safeName}_Fee_Receipt.pdf`;

    const element = printRef.current;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 1 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

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
        toast.success("Fee Receipt downloaded successfully!");
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF");
      });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Fee Receipt
          </h1>
          <p className="text-muted-foreground">
            Register new student and set their initial fee statement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={() => handleRegisterStudentAndFees(false)}>
            <Save className="mr-2 h-4 w-4" />
            Save & Register
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1 h-fit no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[85vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Receipt No.</Label>
                <Input
                  value={formData.receiptNo}
                  onChange={(e) => handleInputChange("receiptNo", e.target.value)}
                  placeholder="623"
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
                <Input
                  className="flex-1"
                  value={formData.studentName}
                  onChange={(e) =>
                    handleInputChange("studentName", e.target.value)
                  }
                  placeholder="e.g. Bhavana N.G."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(val) => handleInputChange("academicYear", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2026-27">2026-27</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year (I / II)</Label>
                <Select
                  value={formData.yearPrefix}
                  onValueChange={(val) => handleInputChange("yearPrefix", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">I</SelectItem>
                    <SelectItem value="II">II</SelectItem>
                    <SelectItem value="I / II">I / II</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll No.</Label>
                <Input
                  value={formData.rollNo}
                  onChange={(e) => handleInputChange("rollNo", e.target.value)}
                  placeholder="e.g. 05"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parent Name</Label>
              <Input
                value={formData.parentName}
                onChange={(e) =>
                  handleInputChange("parentName", e.target.value)
                }
                placeholder="Parent/Guardian Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parent Phone</Label>
                <Input
                  value={formData.parentPhone}
                  onChange={(e) =>
                    handleInputChange("parentPhone", e.target.value)
                  }
                  placeholder="Phone No"
                />
              </div>
              <div className="space-y-2">
                <Label>Admin No.</Label>
                <Input
                  value={formData.admissionNumber}
                  onChange={(e) => handleInputChange("admissionNumber", e.target.value)}
                  placeholder="Auto-generated"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Class / Course</Label>
              <Select
                value={formData.class}
                onValueChange={(val) => handleInputChange("class", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classesList.map((cls: any) => {
                    const className = cls.grade.startsWith("D.")
                      ? `${cls.grade} - ${cls.section}`
                      : `Grade ${cls.grade} - ${cls.section}`;
                    return (
                      <SelectItem key={cls._id || className} value={className}>
                        {className}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
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
                    placeholder="e.g. 123456"
                  />
                </div>
              )}
            </div>
            
            <div className="border-t pt-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Fee Particulars</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  type="button"
                  className="h-7 text-xs"
                  onClick={() => setFeeItems([...feeItems, { id: Date.now(), name: "New Fee", value: "0" }])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Field
                </Button>
              </div>

              <div className="space-y-2 pr-2">
                {feeItems.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center group">
                    <Input 
                      className="flex-1 h-8 text-xs font-medium" 
                      value={item.name}
                      onChange={(e) => handleFeeNameChange(item.id, e.target.value)}
                    />
                    <Input 
                      type="number" 
                      className="w-24 h-8 text-xs text-right" 
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

            <div className="bg-slate-100 p-4 rounded-lg space-y-4 font-bold mt-4 shadow-inner border">
              <div className="flex justify-between items-center text-xl text-blue-900">
                <span>Total Amount:</span>
                <span>₹ {calculateTotal().toLocaleString()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button 
                  variant="outline"
                  className="h-14 text-base font-bold border-2 border-blue-900 text-blue-900 hover:bg-blue-50 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRegisterStudentAndFees(false);
                  }}
                >
                  <Save className="h-5 w-5" />
                  REGISTER ONLY
                </Button>
                
                <Button 
                  className="h-14 text-base font-bold bg-green-600 hover:bg-green-700 shadow-md transform active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRegisterStudentAndFees(true);
                  }}
                >
                  <CreditCard className="h-5 w-5" />
                  PAY FEE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>        {/* Live Preview / PDF Output */}
        <div className="lg:col-span-2 overflow-auto bg-gray-500/10 p-4 rounded-xl flex justify-center items-start min-h-[900px]">
          <div
            ref={printRef}
            className="bg-white text-black px-10 py-10 w-[794px] h-[1123px] shadow-2xl flex flex-col relative border border-gray-200 shrink-0 select-none"
            style={{ fontFamily: "'Times New Roman', serif", boxSizing: "border-box" }}
          >
            {/* Header Box */}
            <div className="border-2 border-blue-900 p-2 flex flex-col items-center relative mb-4">
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
                  <h1 className="text-3xl font-bold tracking-tight text-blue-900 leading-none mb-2">
                    S.S.S. College of Pharmacy
                  </h1>
                  <p className="text-[11px] font-bold leading-tight uppercase text-gray-800">
                    Akshara Campus, Akshara Nagar, Opp. JNNCE, Savalanga Road,
                  </p>
                  <p className="text-[11px] font-bold leading-tight uppercase text-gray-800">
                    SHIVAMOGGA - 577 204.
                  </p>
                  <p className="text-[11px] font-bold leading-tight mt-1 text-gray-800">
                    Mob. +91 94481 27880, 96329 17880
                  </p>
                </div>
              </div>
              
              <div className="w-full flex justify-center mt-1 border-t-2 border-blue-900 pt-1">
                <span className="font-bold text-lg underline underline-offset-4 decoration-2">
                  FEE RECEIPT
                </span>
              </div>
              
              {/* Receipt Info Line */}
              <div className="w-full flex justify-between px-2 mt-2 text-base font-bold">
                <div className="flex gap-1 items-baseline">
                  No. <span className="text-red-600 ml-4 font-normal text-2xl tracking-tighter">{formData.receiptNo || ""}</span>
                </div>
                <div className="flex gap-1 items-baseline">
                  Dt. <span className="ml-4 font-normal text-xl">{formData.date || ""}</span>
                </div>
              </div>
            </div>

            {/* Student Details Section */}
            <div className="space-y-6 px-2 mb-4 text-lg">
              <div className="flex items-end w-full border-b border-black pb-1">
                <span className="shrink-0 font-bold whitespace-nowrap">{formData.genderPrefix}</span>
                <span className="ml-4 font-bold text-2xl italic text-blue-900 flex-1 px-2 uppercase">
                  {formData.studentName || ""}
                </span>
              </div>
              
              <div className="flex items-end w-full leading-tight font-bold gap-4 border-b border-black pb-1">
                <span className="shrink-0 uppercase text-sm">{formData.yearPrefix} D. Pharma Course- academic year</span>
                <span className="font-bold text-lg text-center px-4">
                  {formData.academicYear}
                </span>
                <div className="flex gap-2 ml-auto items-end">
                  <span className="uppercase text-sm">Roll No:</span>
                  <span className="font-bold text-lg px-4">{formData.rollNo || ""}</span>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="mb-4 bg-white">
              <table className="w-full text-base font-bold border-2 border-blue-900 border-collapse table-fixed">
                <thead>
                  <tr className="border-b-2 border-blue-900 bg-blue-50/20">
                    <th className="border-r-2 border-blue-900 p-2 w-[10%] text-center">No.</th>
                    <th className="border-r-2 border-blue-900 p-2 w-[65%] text-left pl-4 uppercase">Particulars</th>
                    <th className="p-2 w-[25%] text-center uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {feeItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="border-r-2 border-blue-900 p-1 text-center font-normal">{idx + 1}.</td>
                      <td className="border-r-2 border-blue-900 p-1 pl-4 font-semibold text-[15px]">{item.name}</td>
                      <td className="p-1 text-right pr-6 tracking-wider font-semibold">
                        {Number(item.value) > 0 ? Number(item.value).toLocaleString("en-IN") + "/-" : ""}
                      </td>
                    </tr>
                  ))}
                  
                  {Array.from({ length: Math.max(1, 12 - feeItems.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-gray-100">
                      <td className="border-r-2 border-blue-900 p-1 text-center h-8 font-normal text-gray-300">{feeItems.length + i + 1}.</td>
                      <td className="border-r-2 border-blue-900 p-1"></td>
                      <td className="p-1"></td>
                    </tr>
                  ))}

                  {/* Grand Total Row - Integrated in Table */}
                  <tr className="font-bold text-lg border-t-2 border-blue-900 bg-blue-50/10">
                    <td className="p-4 text-right pr-4 uppercase tracking-widest text-[#001f3f] border-r-2 border-blue-900" colSpan={2}>
                      GRAND TOTAL
                    </td>
                    <td className="p-4 text-right pr-6 text-2xl text-blue-900 font-extrabold">
                      {calculateTotal().toLocaleString("en-IN")}/-
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rupees in Words - Immediately After Table */}
            <div className="px-2 mb-8">
              <div className="flex items-start w-full text-lg font-bold border-b border-black pb-1">
                <span className="shrink-0 uppercase text-sm mr-4 mt-2">Rupees in words:</span>
                <span className="font-bold text-xl italic capitalize py-1 text-gray-800">
                   {calculateTotal() > 0 ? toWords.convert(calculateTotal()) + " Only" : ""}
                </span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-8 px-2 flex justify-between items-end w-full">
              <div className="w-[40%] flex flex-col items-start border-t border-black pt-2">
                 <p className="font-bold text-xs uppercase text-gray-700 underline mb-1">Institutional Seal</p>
                 <div className="h-12 w-full"></div>
              </div>
              <div className="w-[45%] flex flex-col items-center border-t-2 border-blue-900 pt-2">
                 <p className="font-bold text-sm uppercase text-blue-900">SIGNATURE OF THE RECEIVER</p>
                 <div className="h-12 w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesRegistration;
