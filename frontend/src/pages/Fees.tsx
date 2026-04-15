import { useState, useEffect, useRef } from "react";
import { API_BASE_URL, authFetch } from "@/config";

import {
  Plus,
  CreditCard,
  TrendingUp,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import html2pdf from "html2pdf.js";
import { ToWords } from 'to-words';

const toWords = new ToWords();

const Fees = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editFeeId, setEditFeeId] = useState<string | null>(null);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [paymentIncrement, setPaymentIncrement] = useState<string>("");

  // Refs for Receipt Printing
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    grade: "",
    studentId: "",
    studentName: "",
    feeType: "Tuition",
    amountPaid: "",
    dueAmount: "0",
    paymentMethod: "",
    totalFee: "0",
    date: "",
    admissionNumber: "",
  });

  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students when grade changes
  useEffect(() => {
    if (formData.grade) {
      const filtered = students.filter(
        (s) =>
          (s.class || "").toLowerCase().trim() ===
          (formData.grade || "").toLowerCase().trim(),
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [formData.grade, students]);

  const fetchData = async () => {
    try {
      const [feesRes, studentsRes, structRes, classesRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/fees?t=${Date.now()}`),
        authFetch(`${API_BASE_URL}/students`),
        authFetch(`${API_BASE_URL}/fee-structures`),
        authFetch(`${API_BASE_URL}/classes`),
      ]);

      if (feesRes.ok && studentsRes.ok && structRes.ok) {
        setFees(await feesRes.json());
        setStudents(await studentsRes.json());
        setFeeStructures(await structRes.json());
      }

      if (classesRes.ok) {
        setClassesList(await classesRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get financial context for a student (Total Fee & Amount Paid so far)
  const getStudentFinancials = (
    studentId: string,
    currentEditId: string | null,
  ) => {
    const structure = feeStructures.find(
      (fs) => String(fs.studentId) === String(studentId),
    );
    let totalFee = structure ? Number(structure.totalFee) : 0;

    const otherPayments = fees
      .filter(
        (f) =>
          String(f.studentId) === String(studentId) &&
          (currentEditId ? String(f._id) !== String(currentEditId) : true),
      )
      .reduce((sum, f) => sum + (Number(f.amountPaid) || 0), 0);

    if (!structure && currentEditId) {
      const currentRecord = fees.find(
        (f) => String(f._id) === String(currentEditId),
      );
      if (currentRecord) {
        totalFee =
          otherPayments +
          Number(currentRecord.amountPaid) +
          Number(currentRecord.dueAmount);
      }
    }

    return { totalFee, otherPayments };
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    if (!student) return;

    const { totalFee, otherPayments } = getStudentFinancials(studentId, null);
    const currentBalance = totalFee - otherPayments;

    setFormData({
      ...formData,
      studentId: student._id,
      studentName: student.name,
      grade: student.class,
      totalFee: totalFee.toString(),
      dueAmount: currentBalance.toString(),
      amountPaid: "",
      date: "",
      admissionNumber: student.admissionNumber || "",
    });
  };

  const handleAmountChange = (val: string) => {
    const { totalFee, otherPayments } = getStudentFinancials(
      formData.studentId,
      editFeeId,
    );
    const paidNow = Number(val);
    const newDue = totalFee - (otherPayments + paidNow);

    setFormData({
      ...formData,
      amountPaid: val,
      dueAmount: (newDue > 0 ? newDue : 0).toString(),
    });
  };

  const handleDueChange = (val: string) => {
    const { totalFee, otherPayments } = getStudentFinancials(
      formData.studentId,
      editFeeId,
    );
    const desiredDue = Number(val);
    const newPaid = totalFee - otherPayments - desiredDue;

    setFormData({
      ...formData,
      dueAmount: val,
      amountPaid: (newPaid > 0 ? newPaid : 0).toString(),
    });
  };

  const handleIncrementChange = (val: string) => {
    setPaymentIncrement(val);
    const increment = Number(val);
    const newTotalPaid = baseAmount + increment;
    handleAmountChange(newTotalPaid.toString());
  };

  const handleEdit = (fee: any) => {
    setEditFeeId(fee._id);
    setBaseAmount(Number(fee.amountPaid));
    setPaymentIncrement("");

    const { totalFee } = getStudentFinancials(fee.studentId, fee._id);

    setFormData({
      grade: fee.grade,
      studentId: fee.studentId,
      studentName: fee.studentName,
      feeType: fee.feeType,
      amountPaid: fee.amountPaid.toString(),
      dueAmount: fee.dueAmount.toString(),
      paymentMethod: fee.paymentMethod,
      totalFee: totalFee.toString(),
      date: fee.date,
      admissionNumber: fee.admissionNumber || "",
    });
    setIsAddDialogOpen(true);
  };

  const downloadReceiptPDF = () => {
    const element = receiptRef.current;
    if (!element) return;

    const filename = `Receipt_${receiptData?.studentName || "Student"}_${Date.now()}.pdf`;
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 1 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    // Force download via Blob
    html2pdf()
      .set(opt)
      .from(element)
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
        toast.success("Receipt Downloaded");
      });
  };

  // Triggered after submission to prepare receipt data and download
  const triggerReceiptDownload = (feePayload: any, totalFee: number) => {
    // Find the student's fee structure to populate the particulars table
    const structure = (feeStructures || []).find(
      (fs) => String(fs.studentId) === String(feePayload.studentId)
    );

    setReceiptData({
      ...feePayload,
      totalFee: totalFee,
      feeItems: structure ? structure.feeItems : [],
      receiptNo: `RCT-${Date.now().toString().slice(-6)}`,
      dateStr: new Date().toLocaleDateString(),
    });

    // Provide React time to render before triggering PDF capture
    setTimeout(() => {
      downloadReceiptPDF();
    }, 500);
  };

  const handleSubmit = async () => {
    if (
      !formData.studentId ||
      !formData.amountPaid ||
      !formData.paymentMethod
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editFeeId
        ? `${API_BASE_URL}/fees/${editFeeId}`
        : `${API_BASE_URL}/fees`;

      const method = editFeeId ? "PUT" : "POST";

      const finalReceiptNo = editFeeId 
        ? (fees.find(f => f._id === editFeeId)?.receiptNo || `RCT-${Date.now().toString().slice(-6)}`)
        : `RCT-${Date.now().toString().slice(-6)}`;

      const studentStructure = feeStructures.find(
        (fs) => String(fs.studentId) === String(formData.studentId)
      );

      const payload = {
        studentId: formData.studentId,
        studentName: formData.studentName,
        grade: formData.grade,
        feeType: formData.feeType,
        amountPaid: Number(formData.amountPaid),
        dueAmount: Number(formData.dueAmount),
        totalFee: Number(formData.totalFee),
        receiptNo: finalReceiptNo,
        feeItems: studentStructure?.feeItems || [], // Snapshot of items at time of payment
        paymentMethod: formData.paymentMethod,
        date: formData.date ? formData.date : new Date(),
        admissionNumber: formData.admissionNumber,
      };

      const response = await authFetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          editFeeId
            ? "Payment updated successfully"
            : "Payment recorded successfully",
        );
        setIsAddDialogOpen(false);
        await fetchData();

        triggerReceiptDownload(payload, Number(formData.totalFee));

        setFormData({
          grade: "",
          studentId: "",
          studentName: "",
          feeType: "Tuition",
          amountPaid: "",
          dueAmount: "0",
          paymentMethod: "",
          totalFee: "0",
          date: "",
          admissionNumber: "",
        });
        setEditFeeId(null);
      } else {
        toast.error("Failed to save fee record");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Error submitting request");
    }
  };

  const handleAddNew = () => {
    setEditFeeId(null);
    setFormData({
      grade: "",
      studentId: "",
      studentName: "",
      feeType: "Tuition",
      amountPaid: "",
      dueAmount: "0",
      paymentMethod: "",
      totalFee: "0",
      date: "",
      admissionNumber: "",
    });
    setIsAddDialogOpen(true);
  };

  const totalRevenue = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const outstanding = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
  const totalDue = totalRevenue + outstanding;
  const collectionRate =
    totalDue > 0 ? Math.round((totalRevenue / totalDue) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fees Payment</h1>
          <p className="text-muted-foreground">
            Manage fee collection and invoices
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editFeeId
                  ? "Add Payment to Transaction"
                  : "Record Fee Payment"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Grade Selection */}
              <div className="space-y-2">
                <Label htmlFor="grade">Grade / Class</Label>
                <Select
                  onValueChange={(val) =>
                    setFormData({ ...formData, grade: val })
                  }
                  value={formData.grade}
                  disabled={!!editFeeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Grade" />
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

              {/* Student Selection */}
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select
                  onValueChange={handleStudentSelect}
                  value={formData.studentId}
                  disabled={!formData.grade || !!editFeeId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.grade ? "Select student" : "Select grade first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No students found
                      </SelectItem>
                    ) : (
                      filteredStudents.map((student) => (
                        <SelectItem key={student._id} value={student._id}>
                          {student.name} ({student.rollNo})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input
                  id="admissionNumber"
                  value={formData.admissionNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admissionNumber: e.target.value,
                    })
                  }
                  placeholder="e.g. 2601001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select
                  onValueChange={(val) =>
                    setFormData({ ...formData, paymentMethod: val })
                  }
                  value={formData.paymentMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Info Display */}
              {formData.studentId && (
                <div className="p-3 md:col-span-2 bg-muted rounded-md text-sm flex justify-between items-center h-11">
                  <span className="font-medium">Total Student Fee:</span>
                  <span className="font-bold text-lg text-blue-900 px-3 py-0.5 rounded border border-blue-200 bg-blue-50">
                    ₹{Number(formData.totalFee).toLocaleString()}/-
                  </span>
                </div>
              )}
              {/* DYNAMIC INPUT FIELDS: Edit (Increment) vs New (Standard) */}
              {editFeeId ? (
                // --- INCREMENT MODE (For Edit) ---
                <div className="md:col-span-2 space-y-4 border p-4 rounded-lg bg-blue-50/30 border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Paid Amount:</span>
                        <span className="font-medium">₹{baseAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-bold text-blue-800">New Total Paid:</span>
                        <span className="font-black text-blue-900 border-b-2 border-blue-200">
                          ₹{Number(formData.amountPaid).toLocaleString()}/-
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="increment" className="text-blue-700 font-bold text-base">
                          Add Extra Payment (₹)
                       </Label>
                       <Input
                         id="increment"
                         type="number"
                         placeholder="0"
                         value={paymentIncrement}
                         onChange={(e) => handleIncrementChange(e.target.value)}
                         className="border-blue-300 focus-visible:ring-blue-500 bg-white text-lg h-12"
                         autoFocus
                       />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-blue-100 flex justify-center items-center gap-4">
                     <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Resulting Balance Due:</span>
                     <span className={`text-xl font-black ${Number(formData.dueAmount) > 0 ? "text-red-600" : "text-green-600"}`}>
                        ₹{Number(formData.dueAmount).toLocaleString()}/-
                     </span>
                  </div>
                </div>
              ) : (
                // --- STANDARD MODE (For New) ---
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount Paying (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={formData.amountPaid}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 relative">
                    <div className="flex justify-between">
                      <Label htmlFor="due">Balance Due (₹)</Label>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          handleDueChange("0");
                        }}
                      >
                        Pay Full
                      </button>
                    </div>
                    <Input
                      id="due"
                      type="number"
                      placeholder="0"
                      value={formData.dueAmount}
                      onChange={(e) => handleDueChange(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="md:col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editFeeId ? "Update & Download" : "Pay & Download"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                ₹{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Collection Rate
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {collectionRate}%
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Outstanding Fees
              </p>
              <p className="mt-1 text-2xl font-bold text-destructive">
                ₹{outstanding.toLocaleString()}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                fees
                  .filter((fee, index, self) => 
                     index === self.findIndex((f) => String(f.studentId) === String(fee.studentId))
                  )
                  .map((fee) => (
                  <TableRow key={fee._id}>
                    <TableCell>
                      {new Date(fee.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {fee.studentName}
                    </TableCell>
                    <TableCell>{fee.grade}</TableCell>
                    <TableCell>{fee.feeType}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      ₹{fee.amountPaid.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={
                        fee.dueAmount > 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }
                    >
                      ₹{fee.dueAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>{fee.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge
                        variant={fee.dueAmount > 0 ? "destructive" : "default"}
                        className={
                          fee.dueAmount === 0
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {fee.dueAmount > 0 ? "Partial" : "Paid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(fee)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* HIDDEN RECEIPT TEMPLATE FOR HTML2PDF */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        {receiptData && (
          <div
            ref={receiptRef}
            className="bg-white text-black px-8 py-6 w-[794px] h-[1000px] shadow-2xl flex flex-col relative border border-gray-200 shrink-0 select-none"
            style={{ fontFamily: "'Times New Roman', serif", boxSizing: "border-box" }}
          >
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
                  PAYMENT RECEIPT
                </span>
              </div>
              
              {/* Receipt Info Line */}
              <div className="w-full flex justify-between px-2 mt-1 text-sm font-bold">
                <div className="flex gap-1 items-baseline">
                  No. <span className="text-red-600 ml-4 font-normal text-xl tracking-tighter">{receiptData.receiptNo || ""}</span>
                </div>
                <div className="flex gap-1 items-baseline">
                  Dt. <span className="ml-4 font-normal text-lg">{receiptData.dateStr || ""}</span>
                </div>
              </div>
            </div>

            {/* Student Details Section */}
            <div className="space-y-3 px-2 mb-2 text-base">
              <div className="flex items-end w-full border-b border-gray-400 pb-0.5">
                <span className="shrink-0 font-bold whitespace-nowrap text-sm">Sri /Miss</span>
                <span className="ml-3 font-bold text-xl italic text-blue-900 flex-1 px-1 uppercase">
                  {receiptData.studentName || ""}
                </span>
              </div>
              
              <div className="flex items-end w-full leading-tight font-bold gap-3 border-b border-gray-400 pb-0.5">
                <span className="shrink-0 uppercase text-[10px]">D. Pharma Course- academic year</span>
                <span className="font-bold text-sm text-center px-2">
                  2025-26
                </span>
                <div className="flex gap-4 ml-auto items-end">
                  <div className="flex gap-1 items-end">
                    <span className="uppercase text-[8px] text-gray-500">ADM NO:</span>
                    <span className="font-bold text-base px-1 leading-none text-blue-900 border-b border-gray-400">
                      {students.find(s => s._id === receiptData.studentId)?.admissionNumber || ""}
                    </span>
                  </div>
                  <div className="flex gap-1 items-end">
                    <span className="uppercase text-[8px] text-gray-500">Roll No:</span>
                    <span className="font-bold text-base px-1 leading-none text-blue-900 border-b border-gray-400">
                      {students.find(s => s._id === receiptData.studentId)?.rollNo || ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="mb-2 bg-white">
              <table className="w-full text-sm font-bold border-2 border-blue-900 border-collapse table-fixed">
                <thead>
                  <tr className="border-b-2 border-blue-900 bg-blue-50/20">
                    <th className="border-r-2 border-blue-900 p-1 w-[10%] text-center text-xs">No.</th>
                    <th className="border-r-2 border-blue-900 p-1 w-[65%] text-left pl-3 uppercase text-xs">Particulars</th>
                    <th className="p-1 w-[25%] text-center uppercase text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.feeItems && receiptData.feeItems.length > 0 ? (
                    receiptData.feeItems.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="border-r-2 border-blue-900 p-1 text-center font-normal">{idx + 1}.</td>
                        <td className="border-r-2 border-blue-900 p-1 pl-4 font-semibold text-[15px] uppercase">
                          {item.name}
                        </td>
                        <td className="p-1 text-right pr-6 tracking-wider font-semibold">
                          {Number(item.value) > 0 ? Number(item.value).toLocaleString("en-IN") + "/-" : ""}
                        </td>
                      </tr>
                    ))
                  ) : (
                    [
                      "APPLICATION FEE", "ADMISSION FEE", "ELIGIBILITY FEE", "TUITION FEE",
                      "LIBRARY & R.R. FEE", "IDENTITY CARD FEE", "LABORATORY FEE", "SPORTS FEE",
                      "CULTURAL FEE", "ANNUAL DAY FEE", "DIGITAL LIBRARY FEE", "INTERNAL EXAMINATION FEE",
                      "BREAKAGE FEE", "OTHERS"
                    ].map((name, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="border-r-2 border-blue-900 p-1 text-center font-normal">{idx + 1}.</td>
                        <td className="border-r-2 border-blue-900 p-1 pl-4 font-semibold text-[15px] uppercase">
                          {name}
                        </td>
                        <td className="p-1 text-right pr-6 tracking-wider font-semibold">
                          {idx === 13 ? Number(receiptData.amountPaid).toLocaleString("en-IN") + "/-" : ""}
                        </td>
                      </tr>
                    ))
                  )}
                  

                </tbody>
              </table>
            </div>



            {/* Rupees in Words */}
            <div className="px-2 mb-10 mt-6">
              <div className="flex items-start w-full text-base font-bold border-b border-gray-400 pb-0.5">
                <span className="shrink-0 uppercase text-[10px] mr-3 mt-1.5">Rupees in words:</span>
                <span className="font-bold text-base italic capitalize py-0.5 text-gray-800">
                   {Number(receiptData.amountPaid) > 0 ? toWords.convert(Number(receiptData.amountPaid)) + " Only" : ""}
                </span>
              </div>
            </div>

            <div className="mt-auto w-full">
              {/* Signature Area */}
              <div className="px-2 flex justify-between items-end w-full mb-10 pb-4">
                <div className="w-[40%] flex flex-col items-start border-t border-gray-400 pt-1">
                   <p className="font-bold text-[10px] uppercase text-gray-700 underline mb-0.5">Institutional Seal</p>
                   <div className="h-8 w-full"></div>
                </div>
                <div className="w-[45%] flex flex-col items-center border-t-2 border-blue-900 pt-1">
                   <p className="font-bold text-xs uppercase text-blue-900">SIGNATURE OF THE RECEIVER</p>
                   <div className="h-8 w-full"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-10 text-center text-[10px] text-gray-400">
              This is a computer generated receipt. For any discrepancies, please contact college office.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fees;
