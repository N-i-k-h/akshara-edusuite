import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/config";
import { Plus, CreditCard, TrendingUp, AlertCircle, FileText } from "lucide-react";
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
    date: ""
  });

  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students when grade changes
  useEffect(() => {
    if (formData.grade) {
      const filtered = students.filter(s =>
        (s.class || "").toLowerCase().trim() === (formData.grade || "").toLowerCase().trim()
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [formData.grade, students]);

  const fetchData = async () => {
    try {
      const [feesRes, studentsRes, structRes, classesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/fees?t=${Date.now()}`),
        fetch('${API_BASE_URL}/students'),
        fetch('${API_BASE_URL}/fee-structures'),
        fetch('${API_BASE_URL}/classes')
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
  const getStudentFinancials = (studentId: string, currentEditId: string | null) => {
    const structure = feeStructures.find(fs => String(fs.studentId) === String(studentId));
    let totalFee = structure ? Number(structure.totalFee) : 0;

    const otherPayments = fees
      .filter(f =>
        String(f.studentId) === String(studentId) &&
        (currentEditId ? String(f._id) !== String(currentEditId) : true)
      )
      .reduce((sum, f) => sum + (Number(f.amountPaid) || 0), 0);

    if (!structure && currentEditId) {
      const currentRecord = fees.find(f => String(f._id) === String(currentEditId));
      if (currentRecord) {
        totalFee = otherPayments + Number(currentRecord.amountPaid) + Number(currentRecord.dueAmount);
      }
    }

    return { totalFee, otherPayments };
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s._id === studentId);
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
      date: ""
    });
  };

  const handleAmountChange = (val: string) => {
    const { totalFee, otherPayments } = getStudentFinancials(formData.studentId, editFeeId);
    const paidNow = Number(val);
    const newDue = totalFee - (otherPayments + paidNow);

    setFormData({
      ...formData,
      amountPaid: val,
      dueAmount: (newDue > 0 ? newDue : 0).toString()
    });
  };

  const handleDueChange = (val: string) => {
    const { totalFee, otherPayments } = getStudentFinancials(formData.studentId, editFeeId);
    const desiredDue = Number(val);
    const newPaid = totalFee - otherPayments - desiredDue;

    setFormData({
      ...formData,
      dueAmount: val,
      amountPaid: (newPaid > 0 ? newPaid : 0).toString()
    });
  }

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
      date: fee.date
    });
    setIsAddDialogOpen(true);
  };

  const downloadReceiptPDF = () => {
    const element = receiptRef.current;
    if (!element) return;

    const filename = `Receipt_${receiptData?.studentName || 'Student'}_${Date.now()}.pdf`;
    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };

    // Force download via Blob
    html2pdf().set(opt).from(element).outputPdf('blob').then((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
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
    setReceiptData({
      ...feePayload,
      totalFee: totalFee,
      receiptNo: `RCT-${Date.now().toString().slice(-6)}`,
      dateStr: new Date().toLocaleDateString()
    });

    // Allow react to render the receipt template
    setTimeout(() => {
      downloadReceiptPDF();
    }, 500);
  };

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.amountPaid || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editFeeId
        ? `${API_BASE_URL}/fees/${editFeeId}`
        : '${API_BASE_URL}/fees';

      const method = editFeeId ? 'PUT' : 'POST';

      const payload = {
        studentId: formData.studentId,
        studentName: formData.studentName,
        grade: formData.grade,
        feeType: formData.feeType,
        amountPaid: Number(formData.amountPaid),
        dueAmount: Number(formData.dueAmount),
        paymentMethod: formData.paymentMethod,
        date: formData.date ? formData.date : new Date()
      };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editFeeId ? "Payment updated successfully" : "Payment recorded successfully");
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
          date: ""
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
      date: ""
    });
    setIsAddDialogOpen(true);
  }

  const totalRevenue = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const outstanding = fees.reduce((sum, f) => sum + (f.dueAmount || 0), 0);
  const totalDue = totalRevenue + outstanding;
  const collectionRate = totalDue > 0 ? Math.round((totalRevenue / totalDue) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fees Payment</h1>
          <p className="text-muted-foreground">Manage fee collection and invoices</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editFeeId ? "Add Payment to Transaction" : "Record Fee Payment"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">

              {/* Grade Selection */}
              <div className="space-y-2">
                <Label htmlFor="grade">Grade/Class</Label>
                <Select
                  onValueChange={(val) => setFormData({ ...formData, grade: val })}
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
                    <SelectValue placeholder={formData.grade ? "Select student" : "Select grade first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length === 0 ? (
                      <SelectItem value="none" disabled>No students found</SelectItem>
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

              {/* Fee Info Display */}
              {formData.studentId && (
                <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Fee:</span>
                    <span className="font-semibold">₹{Number(formData.totalFee).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* DYNAMIC INPUT FIELDS: Edit (Increment) vs New (Standard) */}
              {editFeeId ? (
                // --- INCREMENT MODE (For Edit) ---
                <div className="space-y-4 border p-3 rounded-md bg-slate-50 border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Paid Amount:</span>
                    <span className="font-medium">₹{baseAmount.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="increment" className="text-blue-700 font-semibold">Amount to Add (₹)</Label>
                    <Input
                      id="increment"
                      type="number"
                      placeholder="Enter amount to add..."
                      value={paymentIncrement}
                      onChange={(e) => handleIncrementChange(e.target.value)}
                      className="border-blue-300 focus-visible:ring-blue-500 bg-white"
                      autoFocus
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                    <span className="text-muted-foreground">New Total Paid:</span>
                    <span className="font-bold text-blue-900">₹{Number(formData.amountPaid).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining Due:</span>
                    <span className={`font-bold ${Number(formData.dueAmount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{Number(formData.dueAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

              ) : (
                // --- STANDARD MODE (For New) ---
                <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })} value={formData.paymentMethod}>
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

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>{editFeeId ? "Update & Download" : "Pay & Download"}</Button>
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
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
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
              <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{collectionRate}%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outstanding Fees</p>
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
                  <TableCell colSpan={9} className="text-center py-4">Loading data...</TableCell>
                </TableRow>
              ) : fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">No records found</TableCell>
                </TableRow>
              ) : (
                fees.map((fee) => (
                  <TableRow key={fee._id}>
                    <TableCell>{new Date(fee.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{fee.studentName}</TableCell>
                    <TableCell>{fee.grade}</TableCell>
                    <TableCell>{fee.feeType}</TableCell>
                    <TableCell className="text-green-600 font-medium">₹{fee.amountPaid.toLocaleString()}</TableCell>
                    <TableCell className={fee.dueAmount > 0 ? "text-red-500" : "text-muted-foreground"}>
                      ₹{fee.dueAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>{fee.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge variant={fee.dueAmount > 0 ? "destructive" : "default"} className={fee.dueAmount === 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                        {fee.dueAmount > 0 ? "Partial" : "Paid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(fee)}>
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
      <div className="overflow-hidden h-0 w-0">
        {receiptData && (
          <div ref={receiptRef} className="w-[210mm] p-10 bg-white text-black font-sans relative">
            {/* Header/Banner from Estimation style */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-3xl font-bold uppercase tracking-wide mb-1 text-[#8B0000]">Akshara Pharmacy College</h1>
              <p className="italic text-sm text-gray-600 mb-2">Building Bridges Across Healthcare</p>
              <div className="w-full h-1 bg-black mt-2 mb-1"></div>
              <div className="w-full h-0.5 bg-black"></div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-xl font-bold uppercase tracking-widest border px-4 py-2 inline-block border-black">Fee Receipt</h2>
            </div>

            <div className="flex justify-between mb-8 text-sm">
              <div>
                <p><strong>Receipt No:</strong> {receiptData.receiptNo}</p>
                <p><strong>Date:</strong> {receiptData.dateStr}</p>
              </div>
              <div className="text-right">
                <p><strong>Academic Year:</strong> 2025-26</p> {/* Dynamic if available */}
              </div>
            </div>

            <div className="mb-8 border border-black p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="font-bold text-lg">{receiptData.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade / Class</p>
                  <p className="font-bold text-lg">{receiptData.grade}</p>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse border border-black mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-3 text-left">Description</th>
                  <th className="border border-black p-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-3">
                    <p className="font-bold">{receiptData.feeType} Payment</p>
                    <p className="text-sm text-gray-600">Payment via {receiptData.paymentMethod}</p>
                  </td>
                  <td className="border border-black p-3 text-right text-lg">
                    {Number(receiptData.amountPaid).toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-black p-3 font-bold text-right">Total Paid Now</td>
                  <td className="border border-black p-3 text-right font-bold text-lg">
                    ₹ {Number(receiptData.amountPaid).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-start mb-12">
              <div className="w-1/2">
                <h3 className="font-bold border-b border-black inline-block mb-2">Payment Status</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Total Agreed Fee:</span>
                  <span className="font-medium">₹ {Number(receiptData.totalFee).toLocaleString()}</span>
                  <span className="text-gray-600">Balance Due:</span>
                  <span className={`font-bold ${Number(receiptData.dueAmount) > 0 ? "text-red-600" : "text-green-600"}`}>
                    ₹ {Number(receiptData.dueAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-20 pt-10">
              <div className="text-center">
                <div className="w-32 border-b border-black mb-2"></div>
                <p className="text-sm">Student/Parent Signature</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-black mb-2"></div>
                <p className="text-sm">Authorized Signatory</p>
                <p className="text-xs text-gray-500">Akshara Pharmacy College</p>
              </div>
            </div>

            <div className="mt-10 text-center text-xs text-gray-400">
              This is a computer generated receipt.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fees;
