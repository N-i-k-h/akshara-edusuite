import { useState, useEffect, useRef } from "react";
import { API_BASE_URL, authFetch } from "@/config";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table";
import {
    Calendar as CalendarIcon,
    DollarSign,
    Users,
    CreditCard,
    FileText,
    Search,
    Download,
    Printer
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import html2pdf from "html2pdf.js";

const Reports = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [allFees, setAllFees] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [students, setStudents] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);

    const printRef = useRef<HTMLDivElement>(null);

    // Metrics state
    const [reportData, setReportData] = useState({
        collectedAmount: 0,
        collectedCount: 0,
        totalDueAmount: 0,
        studentsWithDue: 0,
        totalExpectedFee: 0
    });

    const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [feesRes, studentsRes, structRes] = await Promise.all([
                authFetch(`${API_BASE_URL}/fees?t=${Date.now()}`),
                authFetch(`${API_BASE_URL}/students`),
                authFetch(`${API_BASE_URL}/fee-structures`)
            ]);

            if (feesRes.ok && studentsRes.ok && structRes.ok) {
                const feesData = await feesRes.json();
                const studentsData = await studentsRes.json();
                const structData = await structRes.json();

                setAllFees(feesData);
                setStudents(studentsData);
                setFeeStructures(structData);

                calculateGlobalDues(feesData, structData);
                filterByDate(feesData, "", "");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const calculateGlobalDues = (fees: any[], structures: any[]) => {
        let totalDue = 0;
        let dueCount = 0;
        let expectedTotal = 0;

        structures.forEach(struct => {
            const studentId = struct.studentId;
            const totalFee = Number(struct.totalFee) || 0;

            const studentPayments = fees
                .filter(f => String(f.studentId) === String(studentId))
                .reduce((sum, f) => sum + (Number(f.amountPaid) || 0), 0);

            const due = totalFee - studentPayments;

            expectedTotal += totalFee;
            if (due > 0) {
                totalDue += due;
                dueCount++;
            }
        });

        setReportData(prev => ({
            ...prev,
            totalDueAmount: totalDue,
            studentsWithDue: dueCount,
            totalExpectedFee: expectedTotal
        }));
    };

    const filterByDate = (fees: any[], start: string, end: string) => {
        let filtered = fees;

        if (start && end) {
            const s = new Date(start);
            s.setHours(0, 0, 0, 0);
            const e = new Date(end);
            e.setHours(23, 59, 59, 999);

            filtered = fees.filter(f => {
                const d = new Date(f.date);
                return d >= s && d <= e;
            });
        }

        const collected = filtered.reduce((sum: number, f: any) => sum + (Number(f.amountPaid) || 0), 0);

        setFilteredTransactions(filtered);
        setReportData(prev => ({
            ...prev,
            collectedAmount: collected,
            collectedCount: filtered.length
        }));
    };

    const handleApplyFilter = () => {
        filterByDate(allFees, startDate, endDate);
        toast.success("Report updated");
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        filterByDate(allFees, "", "");
        toast.info("Filters reset");
    };

    const handleDownloadCSV = () => {
        if (!filteredTransactions.length) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Date", "Student Name", "Grade", "Fee Type", "Payment Method", "Amount Paid", "Status"];
        const rows = filteredTransactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.studentName,
            t.grade,
            t.feeType,
            t.paymentMethod,
            t.amountPaid,
            "Paid"
        ]);

        // Add Total Row
        const totalAmount = filteredTransactions.reduce((sum, t) => sum + (Number(t.amountPaid) || 0), 0);
        const totalRow = ["", "", "", "", "Total Payment", totalAmount, ""];

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(r => r.join(",")), totalRow.join(",")].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Akshara_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Excel (CSV) Downloaded");
    };


    const handleDownloadPDF = () => {
        const element = printRef.current;
        if (!element) return;

        const filename = `Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        const opt = {
            margin: 0.5,
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' as const }
        };

        // Force download via Blob to ensure filename is respected
        html2pdf().set(opt).from(element).outputPdf('blob').then((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("PDF Downloaded");
        }).catch((err: any) => {
            console.error("PDF Error:", err);
            toast.error("Failed to generate PDF");
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                <p className="text-muted-foreground">
                    View collections, due payments, and transaction history.
                </p>
            </div>

            {/* Filters - Not in Print Area */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        Date Filter
                    </CardTitle>
                    <CardDescription>Select a date range to filter collection reports</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 w-full md:w-auto">
                            <Label htmlFor="from">From Date</Label>
                            <Input
                                id="from"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 w-full md:w-auto">
                            <Label htmlFor="to">To Date</Label>
                            <Input
                                id="to"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto items-end">
                            <Button onClick={handleApplyFilter} disabled={!startDate || !endDate}>
                                <Search className="mr-2 h-4 w-4" />
                                Generate Report
                            </Button>
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto md:ml-auto">
                            <Button variant="outline" onClick={handleDownloadCSV} disabled={filteredTransactions.length === 0}>
                                <FileText className="mr-2 h-4 w-4" />
                                Save as Excel
                            </Button>
                            <Button variant="default" onClick={handleDownloadPDF}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* PRINTABLE AREA */}
            <div ref={printRef} className="space-y-6 bg-white p-4 rounded-lg">
                {/* Header for PDF (visible only when printed usually, but here visible always makes sense for preview) */}
                <div className="text-center pb-4 border-b mb-4">
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <img src="/college_logo.png" alt="Logo" className="h-20 w-auto object-contain" />
                        <h2 className="text-2xl font-bold text-[#8B0000] uppercase">Sri Subramanya Swamy College of Pharmacy</h2>
                    </div>
                    <p className="text-gray-600 font-medium">Financial Report</p>
                    <p className="text-sm text-gray-500">
                        {startDate && endDate
                            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                            : `All Time Report (Generated: ${new Date().toLocaleDateString()})`}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-green-50 border-green-200 shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-900">Fees Collected</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700">₹{reportData.collectedAmount.toLocaleString()}</div>
                            <p className="text-xs text-green-600">{reportData.collectedCount} transactions</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 border-red-200 shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-900">Total Due Amount</CardTitle>
                            <CreditCard className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">₹{reportData.totalDueAmount.toLocaleString()}</div>
                            <p className="text-xs text-red-600">Outstanding balance</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200 shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-900">Students with Dues</CardTitle>
                            <Users className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700">{reportData.studentsWithDue}</div>
                            <p className="text-xs text-orange-600">Pending payments</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-slate-200 shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{reportData.totalExpectedFee.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Based on structures</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Transaction List */}
                <Card className="shadow-none border">
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>
                            Detailed list of all transactions in this period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                            No transactions found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((t) => (
                                        <TableRow key={t._id}>
                                            <TableCell>{t.date ? new Date(t.date).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{t.studentName}</TableCell>
                                            <TableCell>{t.grade}</TableCell>
                                            <TableCell>{t.feeType}</TableCell>
                                            <TableCell>{t.paymentMethod}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                ₹{Number(t.amountPaid).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-muted/50 font-bold">
                                    <TableCell colSpan={5} className="text-right">Total Payment</TableCell>
                                    <TableCell className="text-right text-green-700 text-lg">
                                        ₹{reportData.collectedAmount.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
};

export default Reports;
