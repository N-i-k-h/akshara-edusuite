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
import { Printer, Download, Calculator, Plus, Trash2 } from "lucide-react";
import { ToWords } from 'to-words';

const toWords = new ToWords();

const FeesEstimation = () => {
  const printRef = useRef(null);

  const [studentInfo, setStudentInfo] = useState({
    name: "",
    parentName: "",
    academicYear: "2025-26",
    courseYear: "1st Year",
    course: "D.Pharmacy",
    date: new Date().toLocaleDateString("en-GB"),
  });

  // Dynamic fee items to allow "Delete for all fields"
  const [feeItems, setFeeItems] = useState([
    { id: 1, name: "Registration Fee", value: "100" },
    { id: 2, name: "Admission Fee", value: "1000" },
    { id: 3, name: "Laboratory Fee", value: "2500" },
    { id: 4, name: "Internal Examination Fee (Theory & Practical)", value: "2500" },
    { id: 5, name: "Library and Magazine calendar Fee", value: "2500" },
    { id: 6, name: "Sports and cultural, Student welfare Fund", value: "2500" },
    { id: 7, name: "Tuition Fee", value: "45000" },
    { id: 8, name: "Annual Exam Fee", value: "2500" },
    { id: 9, name: "Books & record", value: "3900" },
    { id: 10, name: "Stationary charges", value: "2500" },
    { id: 11, name: "Uniform Fee", value: "5000" },
    { id: 12, name: "Food And Accommodation Fee", value: "60000" },
  ]);

  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeAmount, setNewFeeAmount] = useState("");

  const updateFee = (id: number, val: string) => {
    setFeeItems(feeItems.map(item => item.id === id ? { ...item, value: val } : item));
  };

  const addCustomFee = () => {
    if (!newFeeName || !newFeeAmount) {
      toast.error("Please enter fee name and amount");
      return;
    }
    setFeeItems([
      ...feeItems, 
      { id: Date.now(), name: newFeeName, value: newFeeAmount }
    ]);
    setNewFeeName("");
    setNewFeeAmount("");
  };

  const removeFee = (id: number) => {
    setFeeItems(feeItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return feeItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    const namePart = (studentInfo.name || "Student").trim();
    const safeName = namePart.replace(/[^a-z0-9]/gi, "_");
    const filename = `${safeName}_Fee_Estimation.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 1 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    html2pdf()
      .set(opt)
      .from(printRef.current)
      .outputPdf("blob")
      .then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Fee Estimation Downloaded");
      });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 flex flex-col items-center">
      <div className="flex items-center justify-between no-print w-full">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fee Estimation Generator</h1>
          <p className="text-muted-foreground">Certified institutional fee structure</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* INPUT SECTION */}
        <div className="lg:col-span-4 space-y-6 no-print">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Calculator className="h-5 w-5 text-blue-600" />
                 Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Student Name</Label>
                <Input value={studentInfo.name} onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })} placeholder="Full Name" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Father / Guardian Name</Label>
                <Input value={studentInfo.parentName} onChange={(e) => setStudentInfo({ ...studentInfo, parentName: e.target.value })} placeholder="Parent Name" />
              </div>
              <div className="space-y-2">
                <Label>Course Year</Label>
                <Select value={studentInfo.courseYear} onValueChange={(v) => setStudentInfo({ ...studentInfo, courseYear: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={studentInfo.academicYear} onChange={(e) => setStudentInfo({ ...studentInfo, academicYear: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Fee Particulars</CardTitle>
              <div className="text-sm font-bold text-blue-700">Total: ₹{calculateTotal().toLocaleString()}</div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {feeItems.map((item) => (
                <div key={item.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{item.name}</Label>
                    <Input 
                      type="number" 
                      value={item.value} 
                      onChange={(e) => updateFee(item.id, e.target.value)} 
                      className="h-8" 
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFee(item.id)} 
                    className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="pt-4 border-t mt-4 space-y-2 bg-slate-50 p-3 rounded-md">
                <Label className="font-bold text-sm">Add Custom Particular</Label>
                <div className="flex gap-2">
                  <Input value={newFeeName} onChange={(e) => setNewFeeName(e.target.value)} placeholder="Name (e.g. Bus Fee)" className="h-9" />
                  <Input type="number" value={newFeeAmount} onChange={(e) => setNewFeeAmount(e.target.value)} placeholder="0" className="w-24 h-9" />
                  <Button onClick={addCustomFee} className="h-9"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PREVIEW SECTION */}
        <div className="lg:col-span-8 bg-slate-200/50 p-6 rounded-3xl flex justify-center items-start min-h-screen overflow-x-auto">
          <div
            ref={printRef}
            className="bg-white text-black p-12 w-[794px] h-[1123px] shadow-2xl relative border-2 border-black shrink-0"
            style={{ fontFamily: "'Times New Roman', serif", boxSizing: "border-box" }}
          >
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <div className="flex items-center justify-between px-2">
                <img src="/college_logo.png" alt="Logo" className="h-24 w-auto" />
                <div className="text-center flex-1">
                  <h1 className="text-2xl font-bold uppercase tracking-tight text-[#8B0000]">
                    Sri Subramanya Swamy College of Pharmacy
                  </h1>
                  <p className="italic text-sm text-gray-600 mb-1">Building Bridges Across Healthcare</p>
                  <p className="text-xs font-bold">Mob. +91 94481 27880, 96329 17880</p>
                </div>
                <div className="w-24"></div>
              </div>
            </div>

            <div className="text-right mb-6 font-bold text-base px-2">
              Date: {studentInfo.date}
            </div>

            <div className="text-center mb-8">
              <h2 className="text-xl font-bold uppercase underline underline-offset-4 decoration-2">
                Fee Estimation
              </h2>
            </div>

            {/* Simplified Certification Text */}
            <div className="text-justify leading-relaxed px-4 mb-8 text-[19px]">
               <p>
                This is to certify that <span className="font-bold border-b border-black inline-block min-w-[200px]">Kum/Mr. {studentInfo.name || ""}</span> D/o, S/o <span className="font-bold border-b border-black inline-block min-w-[200px]">{studentInfo.parentName || ""}</span> is studying in <span className="font-bold border-b border-black inline-block">{studentInfo.courseYear} {studentInfo.course}</span> for the Academic Year <span className="font-bold border-b border-black inline-block">{studentInfo.academicYear}</span>.
              </p>
            </div>

            {/* Table */}
            <div className="px-4 mb-10 flex-grow">
              <table className="w-full border-collapse border-2 border-black text-[15px]">
                <thead>
                  <tr className="bg-gray-100 uppercase font-bold">
                    <th className="border-2 border-black p-2 w-14 text-center">Sl. No.</th>
                    <th className="border-2 border-black p-2 text-left pl-4">Particulars</th>
                    <th className="border-2 border-black p-2 w-44 text-right pr-6">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {feeItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border-2 border-black p-1.5 text-center">{idx + 1}.</td>
                      <td className="border-2 border-black p-1.5 pl-4 font-medium uppercase text-[14px]">{item.name}</td>
                      <td className="border-2 border-black p-1.5 text-right pr-6 font-bold tabular-nums">
                        {Number(item.value) > 0 ? Number(item.value).toLocaleString("en-IN") + "/-" : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Rupees in Words Area */}
            <div className="px-4 mb-16 font-bold italic text-[17px]">
               Total Rupees: Rs {calculateTotal().toLocaleString()} /- per year
               <div className="mt-1 text-sm text-gray-700">
                 (Rupees in words: {toWords.convert(calculateTotal())} Only)
               </div>
            </div>

            {/* Signature Area */}
            <div className="absolute bottom-20 left-0 w-full px-14">
               <div className="flex justify-between items-end w-full">
                  <div className="text-center italic text-sm text-gray-400 border border-dashed border-gray-300 p-4 rounded-full">
                     (Institution Seal)
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg uppercase mb-1">Principal</p>
                    <p className="text-sm font-bold">Sri Subramanya Swamy College of Pharmacy</p>
                    <p className="text-xs font-bold">Shivamogga - 577204</p>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-6 left-0 w-full text-center text-[10px] text-gray-300 italic">
               Computer generated estimation - Valid without manual signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesEstimation;
