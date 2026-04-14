import { useState, useEffect, useRef } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
    TableFooter,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Trash2,
    Edit,
    Search,
    Wallet,
    Calendar,
    Filter,
    Download,
    FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import html2pdf from "html2pdf.js";

const Expenditure = () => {
    const [expenditures, setExpenditures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        title: "",
        category: "General",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        paymentMethod: "Cash",
    });

    const categories = [
        "Salary",
        "Maintenance",
        "Electricity Bill",
        "Water Bill",
        "Internet Bill",
        "Rent",
        "Equipment",
        "Office Supplies",
        "Events",
        "General",
        "Other",
    ];

    useEffect(() => {
        fetchExpenditures();
    }, []);

    const fetchExpenditures = async () => {
        try {
            const response = await authFetch(`${API_BASE_URL}/expenditures`);
            if (response.ok) {
                const data = await response.json();
                setExpenditures(data);
            }
        } catch (error) {
            console.error("Error fetching expenditures:", error);
            toast.error("Failed to load expenditures");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.amount) {
            toast.error("Title and Amount are required");
            return;
        }

        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId
                ? `${API_BASE_URL}/expenditures/${editingId}`
                : `${API_BASE_URL}/expenditures`;

            const response = await authFetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    amount: Number(formData.amount),
                }),
            });

            if (response.ok) {
                toast.success(editingId ? "Updated successfully" : "Added successfully");
                setIsDialogOpen(false);
                resetForm();
                fetchExpenditures();
            } else {
                const err = await response.json();
                toast.error(err.message || "Operation failed");
            }
        } catch (error) {
            console.error("Error saving expenditure:", error);
            toast.error("An error occurred");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            category: "General",
            amount: "",
            date: new Date().toISOString().split("T")[0],
            description: "",
            paymentMethod: "Cash",
        });
        setEditingId(null);
    };

    const handleEdit = (exp: any) => {
        setEditingId(exp._id);
        setFormData({
            title: exp.title,
            category: exp.category,
            amount: exp.amount.toString(),
            date: new Date(exp.date).toISOString().split("T")[0],
            description: exp.description || "",
            paymentMethod: exp.paymentMethod || "Cash",
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this expenditure?")) return;

        try {
            const response = await authFetch(`${API_BASE_URL}/expenditures/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                toast.success("Deleted successfully");
                fetchExpenditures();
            }
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error("Delete failed");
        }
    };

    const handleDownloadCSV = () => {
        if (!filteredExpenditures.length) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Date", "Title", "Category", "Method", "Amount", "Description"];
        const rows = filteredExpenditures.map((e) => [
            new Date(e.date).toLocaleDateString(),
            e.title,
            e.category,
            e.paymentMethod || "Cash",
            e.amount,
            e.description || "",
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(",")), ["", "Total", "", "", totalAmount, ""]].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Expenditure_Report_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Downloaded");
    };

    const handleDownloadPDF = () => {
        const element = printRef.current;
        if (!element) return;

        const filename = `Expenditure_Report_${new Date().toISOString().split("T")[0]}.pdf`;
        const opt = {
            margin: 0.5,
            filename: filename,
            image: { type: "jpeg" as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
        };

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
                toast.success("PDF Downloaded");
            })
            .catch((err: any) => {
                console.error("PDF Error:", err);
                toast.error("Failed to generate PDF");
            });
    };

    const filteredExpenditures = expenditures.filter((exp) => {
        const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter;
        
        // Date filter
        let matchesDate = true;
        if (startDate && endDate) {
            const d = new Date(exp.date);
            const s = new Date(startDate);
            s.setHours(0,0,0,0);
            const e = new Date(endDate);
            e.setHours(23,59,59,999);
            matchesDate = d >= s && d <= e;
        }
        
        return matchesSearch && matchesCategory && matchesDate;
    });

    const totalAmount = filteredExpenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Expenditures</h1>
                    <p className="text-muted-foreground">
                        Manage your college expenses and overheads.
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Edit Expenditure" : "Add New Expenditure"}</DialogTitle>
                                <DialogDescription>
                                    Fill in the details for the college expense.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="title">Title / Item Name</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. March Maintenance"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => handleSelectChange("category", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₹)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentMethod">Payment Method</Label>
                                        <Select
                                            value={formData.paymentMethod}
                                            onValueChange={(val) => handleSelectChange("paymentMethod", val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cash">Cash</SelectItem>
                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="Cheque">Cheque</SelectItem>
                                                <SelectItem value="UPI">UPI / Online</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <textarea
                                            id="description"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Add more details about the expense..."
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingId ? "Update Expense" : "Save Expense"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <div className="flex gap-2">
                         <Button variant="outline" onClick={handleDownloadCSV} disabled={filteredExpenditures.length === 0} title="Export CSV">
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={handleDownloadPDF} disabled={filteredExpenditures.length === 0} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                            <FileText className="mr-2 h-4 w-4" />
                            Report
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenditure</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {filteredExpenditures.length} transactions
                        </p>
                    </CardContent>
                </Card>
                <div className="md:col-span-3 flex flex-wrap items-end gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="space-y-1.5 flex-1 min-w-[150px]">
                        <Label htmlFor="start" className="text-xs font-bold uppercase">From Date</Label>
                        <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} size={5} className="h-9" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-[150px]">
                        <Label htmlFor="end" className="text-xs font-bold uppercase">To Date</Label>
                        <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} size={5} className="h-9" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-[150px]">
                        <Label className="text-xs font-bold uppercase">Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setCategoryFilter("all"); setSearchQuery(""); }} className="h-9">
                        Reset
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Quick search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 border-primary/20"
                    />
                </div>
            </div>

            <Card className="border-primary/10">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="font-bold">Title</TableHead>
                                <TableHead className="font-bold">Category</TableHead>
                                <TableHead className="font-bold">Method</TableHead>
                                <TableHead className="text-right font-bold">Amount</TableHead>
                                <TableHead className="w-24 text-center font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        Loading records...
                                    </TableCell>
                                </TableRow>
                            ) : filteredExpenditures.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                                        No expenditure records match your filters
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenditures.map((exp) => (
                                    <TableRow key={exp._id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {new Date(exp.date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{exp.title}</span>
                                                {exp.description && (
                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                        {exp.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold bg-secondary/20">
                                                {exp.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">{exp.paymentMethod || "Cash"}</TableCell>
                                        <TableCell className="text-right font-black text-rose-600">
                                            ₹{exp.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleEdit(exp)}
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(exp._id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter className="bg-muted/50 border-t-2">
                            <TableRow>
                                <TableCell colSpan={4} className="text-right font-black uppercase text-xs">Total Amount</TableCell>
                                <TableCell className="text-right font-black text-rose-700 text-lg">₹{totalAmount.toLocaleString()}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </CardContent>
            </Card>

            {/* HIDDEN PRINTABLE REPORT TEMPLATE */}
            <div className="hidden">
                <div ref={printRef} className="p-8 text-black bg-white min-h-[1000px]">
                    <div className="text-center border-b-2 border-gray-100 pb-6 mb-8">
                        <h1 className="text-2xl font-black text-[#8B0000] uppercase tracking-tighter">
                            Sri Subramanya Swamy College of Pharmacy
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs mt-1">Official Expenditure Report</p>
                        <div className="flex justify-between mt-6 text-[10px] font-bold text-gray-400 uppercase">
                            <p>Date Range: {startDate && endDate ? `${startDate} to ${endDate}` : "All Records"}</p>
                            <p>Generated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 border rounded">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Expenses</p>
                            <p className="text-3xl font-black text-rose-700">₹{totalAmount.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1">{filteredExpenditures.length} TRANSACTIONS RECORDED</p>
                        </div>
                        <div className="bg-gray-50 p-4 border rounded">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Filter Applied</p>
                            <p className="text-xl font-black text-gray-700 capitalize">{categoryFilter === "all" ? "All Categories" : categoryFilter}</p>
                        </div>
                    </div>

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-200">
                                <th className="text-left px-3 py-3 text-[10px] font-black uppercase">Date</th>
                                <th className="text-left px-3 py-3 text-[10px] font-black uppercase">Transaction Details</th>
                                <th className="text-left px-3 py-3 text-[10px] font-black uppercase">Category</th>
                                <th className="text-left px-3 py-3 text-[10px] font-black uppercase text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenditures.map((ex) => (
                                <tr key={ex._id} className="border-b border-gray-100">
                                    <td className="px-3 py-3 text-xs">{new Date(ex.date).toLocaleDateString()}</td>
                                    <td className="px-3 py-3">
                                        <p className="font-bold text-sm">{ex.title}</p>
                                        <p className="text-[9px] text-gray-400">{ex.paymentMethod || "Cash"}</p>
                                    </td>
                                    <td className="px-3 py-3 text-[10px] font-bold uppercase text-gray-500">{ex.category}</td>
                                    <td className="px-3 py-3 text-right font-black text-rose-600">₹{Number(ex.amount).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50">
                                <td colSpan={3} className="px-3 py-4 text-right text-[10px] font-black uppercase">Grand Total Expenditure</td>
                                <td className="px-3 py-4 text-right font-black text-rose-700 text-lg border-t border-gray-200">
                                    ₹{totalAmount.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-20 flex justify-between px-10">
                        <div className="text-center border-t border-gray-300 pt-2 min-w-[150px]">
                            <p className="text-[9px] font-black uppercase text-gray-400">Accountant Signature</p>
                        </div>
                        <div className="text-center border-t border-gray-300 pt-2 min-w-[150px]">
                            <p className="text-[9px] font-black uppercase text-gray-400">Principal Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenditure;

