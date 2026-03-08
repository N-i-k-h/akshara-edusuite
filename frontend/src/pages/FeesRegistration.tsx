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
import { Printer, Download, Calculator, Plus, Trash2, Save } from "lucide-react";
import { API_BASE_URL, authFetch } from "@/config";

const FeesRegistration = () => {
  const printRef = useRef(null);

  const [classesList, setClassesList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    rollNo: "",
    parentName: "",
    parentPhone: "",
    class: "",
    academicYear: "2025-26",
    course: "D.Pharmacy",

    // Fee Components
    registrationFee: "100",
    admissionFee: "1000",
    laboratoryFee: "2500",
    internalExamFee: "2500",
    libraryFee: "2500",
    sportsFee: "2500",
    tuitionFee: "45000",
    annualExamFee: "2500",
    booksRecordFee: "3900",
    stationaryCharges: "2500",
    uniformFee: "5000",
    foodAccomFee: "60000",
    admissionNumber: "",
  });

  const [customFees, setCustomFees] = useState<
    { id: number; name: string; value: string }[]
  >([]);
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
      const currentYear = new Date().getFullYear().toString().slice(-2); // e.g., '26'
      const storedSeq = localStorage.getItem("feeEstimationSeq");
      let seq = storedSeq ? parseInt(storedSeq) : 0;

      // Increment sequence
      seq += 1;
      localStorage.setItem("feeEstimationSeq", seq.toString());

      // Format: YY + 01 + XXX (e.g., 2601001)
      // The user requested 'year o1' which likely means static '01' or course related.
      // We use '01' as static part based on request "year 26 and year o1".
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
    setCustomFees([
      ...customFees,
      { id: Date.now(), name: newFeeName, value: newFeeAmount },
    ]);
    setNewFeeName("");
    setNewFeeAmount("");
  };

  const removeCustomFee = (id: number) => {
    setCustomFees(customFees.filter((fee) => fee.id !== id));
  };

  const calculateTotal = () => {
    const standardTotal =
      Number(formData.registrationFee) +
      Number(formData.admissionFee) +
      Number(formData.laboratoryFee) +
      Number(formData.internalExamFee) +
      Number(formData.libraryFee) +
      Number(formData.sportsFee) +
      Number(formData.tuitionFee) +
      Number(formData.annualExamFee) +
      Number(formData.booksRecordFee) +
      Number(formData.stationaryCharges) +
      Number(formData.uniformFee) +
      Number(formData.foodAccomFee);

    const customTotal = customFees.reduce(
      (sum, fee) => sum + (Number(fee.value) || 0),
      0,
    );

    return standardTotal + customTotal;
  };

  const handleRegisterStudentAndFees = async () => {
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

      const feeComponents = {
        registrationFee: Number(formData.registrationFee),
        admissionFee: Number(formData.admissionFee),
        laboratoryFee: Number(formData.laboratoryFee),
        internalExamFee: Number(formData.internalExamFee),
        libraryFee: Number(formData.libraryFee),
        sportsFee: Number(formData.sportsFee),
        tuitionFee: Number(formData.tuitionFee),
        annualExamFee: Number(formData.annualExamFee),
        booksRecordFee: Number(formData.booksRecordFee),
        stationaryCharges: Number(formData.stationaryCharges),
        uniformFee: Number(formData.uniformFee),
        foodAccomFee: Number(formData.foodAccomFee),
      };

      const totalFee = calculateTotal();

      const feePayload = {
        studentId: newStudent._id,
        studentName: newStudent.name,
        admissionNumber: newStudent.admissionNumber,
        rollNo: newStudent.rollNo || "",
        grade: newStudent.class,
        academicYear: formData.academicYear,
        feeComponents: feeComponents,
        totalFee: totalFee
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

      toast.success("Student and Fee Structure registered successfully!");

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
        admissionNumber: newAdmNo
      }));
      setCustomFees([]);

    } catch (error) {
      console.error(error);
      toast.error("An error occurred during registration.");
    }
  };

  // --- UPDATED DOWNLOAD FUNCTION (BLOB METHOD) ---
  const handleDownloadPDF = () => {
    if (!printRef.current) return;

    // 1. Generate Safe Filename
    const namePart = formData.studentName.trim() || "Student";
    const safeName = namePart.replace(/[^a-z0-9]/gi, "_");
    const filename = `${safeName}_Fee_Estimation.pdf`;

    const element = printRef.current;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 1 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    // 2. Generate Blob -> Create Link -> Force Download
    // This bypasses the library's default save behavior which can be buggy in previews
    html2pdf()
      .set(opt)
      .from(element)
      .outputPdf("blob") // Generate a Blob object
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename; // This attribute forces the correct name
        document.body.appendChild(link);
        link.click(); // Trigger the download
        document.body.removeChild(link); // Clean up
        URL.revokeObjectURL(url); // Free memory
        toast.success("Fee Estimation downloaded successfully!");
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF");
      });
  };

  const today = new Date().toLocaleDateString("en-GB");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Fee Registration
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
          <Button onClick={handleRegisterStudentAndFees}>
            <Save className="mr-2 h-4 w-4" />
            Register Student & Fees
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1 h-fit no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Estimation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input
                value={formData.studentName}
                onChange={(e) =>
                  handleInputChange("studentName", e.target.value)
                }
                placeholder="e.g. Rahul Kumar"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Name</Label>
              <Input
                value={formData.parentName}
                onChange={(e) =>
                  handleInputChange("parentName", e.target.value)
                }
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parent Phone</Label>
                <Input
                  value={formData.parentPhone}
                  onChange={(e) =>
                    handleInputChange("parentPhone", e.target.value)
                  }
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label>Email ID</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Student Roll No (Optional)</Label>
              <Input
                value={formData.rollNo}
                onChange={(e) => handleInputChange("rollNo", e.target.value)}
                placeholder="e.g. DP001"
              />
            </div>
            <div className="space-y-2">
              <Label>Admission No. (Auto)</Label>
              <Input
                value={formData.admissionNumber}
                onChange={(e) =>
                  handleInputChange("admissionNumber", e.target.value)
                }
                placeholder="e.g. 2601001"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class / Grade</Label>
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
                    {classesList.length === 0 && (
                      <>
                        <SelectItem value="D.Pharm 1 - A">D.Pharm 1 - A</SelectItem>
                        <SelectItem value="D.Pharm 2 - A">D.Pharm 2 - A</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(val) =>
                    handleInputChange("academicYear", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2026-27">2026-27</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Fee Particulars (₹)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Registration Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.registrationFee}
                  onChange={(e) =>
                    handleInputChange("registrationFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Admission Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.admissionFee}
                  onChange={(e) =>
                    handleInputChange("admissionFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Laboratory Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.laboratoryFee}
                  onChange={(e) =>
                    handleInputChange("laboratoryFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Internal Exam Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.internalExamFee}
                  onChange={(e) =>
                    handleInputChange("internalExamFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Library Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.libraryFee}
                  onChange={(e) =>
                    handleInputChange("libraryFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Sports/Welfare</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.sportsFee}
                  onChange={(e) =>
                    handleInputChange("sportsFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Tuition Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.tuitionFee}
                  onChange={(e) =>
                    handleInputChange("tuitionFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Annual Exam Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.annualExamFee}
                  onChange={(e) =>
                    handleInputChange("annualExamFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Books & Record</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.booksRecordFee}
                  onChange={(e) =>
                    handleInputChange("booksRecordFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Stationary</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.stationaryCharges}
                  onChange={(e) =>
                    handleInputChange("stationaryCharges", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Uniform Fee</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.uniformFee}
                  onChange={(e) =>
                    handleInputChange("uniformFee", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <Label className="text-xs">Food & Accom.</Label>
                <Input
                  type="number"
                  className="h-8"
                  value={formData.foodAccomFee}
                  onChange={(e) =>
                    handleInputChange("foodAccomFee", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Custom Fees Section */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Add Custom Fees</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Fee Name</Label>
                  <Input
                    value={newFeeName}
                    onChange={(e) => setNewFeeName(e.target.value)}
                    placeholder="e.g. Bus Fee"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    value={newFeeAmount}
                    onChange={(e) => setNewFeeAmount(e.target.value)}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button
                onClick={addCustomFee}
                className="w-full h-8 text-xs bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Fee
              </Button>

              {customFees.length > 0 && (
                <div className="space-y-2 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                  {customFees.map((fee) => (
                    <div
                      key={fee.id}
                      className="flex justify-between items-center text-xs p-1"
                    >
                      <span>
                        {fee.name}:{" "}
                        <span className="font-semibold">₹{fee.value}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-red-500 hover:bg-red-50"
                        onClick={() => removeCustomFee(fee.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-100 p-3 rounded-md flex justify-between items-center font-bold mt-4">
              <span>Total:</span>
              <span>₹ {calculateTotal().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview / PDF Output */}
        <div className="lg:col-span-2 overflow-auto bg-gray-500/10 p-4 rounded-xl flex justify-center items-start min-h-[800px]">
          <div
            ref={printRef}
            className="bg-white text-black px-10 py-10 w-[794px] h-[1123px] shadow-2xl flex flex-col relative border-4 border-black shrink-0"
            style={{ fontFamily: "'Times New Roman', serif", boxSizing: "border-box" }}
          >
            {/* Header */}
            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <div className="flex items-center justify-between px-4">
                <img
                  src="/college_logo.png"
                  alt="Logo"
                  className="h-24 w-auto object-contain"
                />
                <div className="text-center flex-1">
                  <h1 className="text-2xl font-bold uppercase tracking-wide mb-1 text-[#8B0000]">
                    Sri Subramanya Swamy College of Pharmacy
                  </h1>
                  <p className="italic text-sm text-gray-600 mb-2">
                    Building Bridges Across Healthcare
                  </p>
                </div>
                <div className="w-24"></div> {/* Balance the logo space */}
              </div>
              <div className="w-full h-1 bg-black mt-2 mb-1"></div>
              <div className="w-full h-0.5 bg-black"></div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-bold uppercase underline underline-offset-4">
                Fee Registration
              </h2>
            </div>

            {/* Date */}
            <div className="absolute top-8 left-8 text-sm font-bold hidden">
              Ref No: {formData.admissionNumber}
            </div>
            <div className="absolute top-8 right-8 text-sm font-bold">
              Date: {today}
            </div>

            {/* Body Text */}
            <div className="text-justify leading-7 px-4 mb-6 text-lg">
              <p>
                This is to certify that{" "}
                <span className="font-bold">
                  Kum/Mr. {formData.studentName || "________________"}
                </span>{" "}
                D/o, S/o{" "}
                <span className="font-bold">
                  {formData.parentName || "________________"}
                </span>{" "}
                is studying in{" "}
                <span className="font-bold">
                  {formData.class || "________________"}
                </span>{" "}
                in our institution for the Academic Year{" "}
                <span className="font-bold">{formData.academicYear}</span> with
                Admission Number{" "}
                <span className="font-bold">{formData.admissionNumber}</span>.
                Total Duration of the program is Two academic years. Her/His
                fees details are as follows.
              </p>
            </div>

            {/* Table */}
            <div className="px-4 mb-4 flex-grow">
              <table className="w-full border-collapse border-2 border-black text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-2 border-black p-2 w-16 text-center">
                      Sl No.
                    </th>
                    <th className="border-2 border-black p-2 text-left">
                      Particulars
                    </th>
                    <th className="border-2 border-black p-2 w-40 text-right">
                      {formData.class || "Class"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 1,
                      name: "Registration Fee",
                      value: formData.registrationFee,
                    },
                    {
                      id: 2,
                      name: "Admission Fee",
                      value: formData.admissionFee,
                    },
                    {
                      id: 3,
                      name: "Laboratory Fee",
                      value: formData.laboratoryFee,
                    },
                    {
                      id: 4,
                      name: "Internal Examination Fee (Theory & Practical)",
                      value: formData.internalExamFee,
                    },
                    {
                      id: 5,
                      name: "Library and Magazine calendar Fee",
                      value: formData.libraryFee,
                    },
                    {
                      id: 6,
                      name: "Sports and cultural, Student welfare Fund",
                      value: formData.sportsFee,
                    },
                    { id: 7, name: "Tuition Fee", value: formData.tuitionFee },
                    {
                      id: 8,
                      name: "Annual Exam Fee",
                      value: formData.annualExamFee,
                    },
                    {
                      id: 9,
                      name: "Books & record",
                      value: formData.booksRecordFee,
                    },
                    {
                      id: 10,
                      name: "Stationary charges",
                      value: formData.stationaryCharges,
                    },
                    { id: 11, name: "Uniform Fee", value: formData.uniformFee },
                    {
                      id: 12,
                      name: "Food And Accommodation Fee",
                      value: formData.foodAccomFee,
                    },
                    ...customFees.map((fee, index) => ({
                      id: 13 + index,
                      name: fee.name,
                      value: fee.value,
                    })),
                  ].map((item) => (
                    <tr key={item.id}>
                      <td className="border-2 border-black p-2 text-center">
                        {item.id}.
                      </td>
                      <td className="border-2 border-black p-2 font-medium">
                        {item.name}
                      </td>
                      <td className="border-2 border-black p-2 text-right tracking-wider">
                        {Number(item.value).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold text-lg">
                    <td
                      className="border-2 border-black p-3 text-center"
                      colSpan={2}
                    >
                      Total
                    </td>
                    <td className="border-2 border-black p-3 text-right">
                      {calculateTotal().toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Words */}
            <div className="px-4 mb-16 font-bold italic text-center text-lg">
              Total Rupees: Rs {calculateTotal().toLocaleString()} /- per year
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end px-12 mt-auto mb-16">
              <div className="text-center">{/* Empty for seal */}</div>
              <div className="text-center">
                <p className="font-bold">Principal</p>
                <p className="text-sm">
                  Sri Subramanya Swamy College of Pharmacy
                </p>
                <p className="text-xs">Shivamogga - 577204</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesRegistration;
