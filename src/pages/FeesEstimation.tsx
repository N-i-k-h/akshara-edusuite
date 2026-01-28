import { useState, useRef } from "react";
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
import { Printer, Download, Calculator } from "lucide-react";

const FeesEstimation = () => {
    const printRef = useRef(null);

    const [formData, setFormData] = useState({
        studentName: "",
        parentName: "",
        academicYear: "2025-26",
        courseYear: "1st Year",
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
    });

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const calculateTotal = () => {
        return (
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
            Number(formData.foodAccomFee)
        );
    };

    // --- UPDATED DOWNLOAD FUNCTION (BLOB METHOD) ---
    const handleDownloadPDF = () => {
        if (!printRef.current) return;

        // 1. Generate Safe Filename
        const namePart = formData.studentName.trim() || "Student";
        const safeName = namePart.replace(/[^a-z0-9]/gi, '_');
        const filename = `${safeName}_Fee_Estimation.pdf`;

        const element = printRef.current;

        const opt = {
            margin: 0,
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        // 2. Generate Blob -> Create Link -> Force Download
        // This bypasses the library's default save behavior which can be buggy in previews
        html2pdf()
            .set(opt)
            .from(element)
            .outputPdf('blob') // Generate a Blob object
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
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

    const today = new Date().toLocaleDateString('en-GB');

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between no-print">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Fee Estimation Generator</h1>
                    <p className="text-muted-foreground">Isolate and generate fee structures for students</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
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
                            <Input value={formData.studentName} onChange={(e) => handleInputChange("studentName", e.target.value)} placeholder="e.g. Rahul Kumar" />
                        </div>
                        <div className="space-y-2">
                            <Label>Parent Name</Label>
                            <Input value={formData.parentName} onChange={(e) => handleInputChange("parentName", e.target.value)} placeholder="e.g. Rajesh Kumar" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Course Year</Label>
                                <Select value={formData.courseYear} onValueChange={(val) => handleInputChange("courseYear", val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1st Year">1st Year</SelectItem>
                                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                                        <SelectItem value="4th Year">4th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Academic Year</Label>
                                <Select value={formData.academicYear} onValueChange={(val) => handleInputChange("academicYear", val)}>
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

                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Registration Fee</Label>
                                <Input type="number" className="h-8" value={formData.registrationFee} onChange={(e) => handleInputChange("registrationFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Admission Fee</Label>
                                <Input type="number" className="h-8" value={formData.admissionFee} onChange={(e) => handleInputChange("admissionFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Laboratory Fee</Label>
                                <Input type="number" className="h-8" value={formData.laboratoryFee} onChange={(e) => handleInputChange("laboratoryFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Internal Exam Fee</Label>
                                <Input type="number" className="h-8" value={formData.internalExamFee} onChange={(e) => handleInputChange("internalExamFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Library Fee</Label>
                                <Input type="number" className="h-8" value={formData.libraryFee} onChange={(e) => handleInputChange("libraryFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Sports/Welfare</Label>
                                <Input type="number" className="h-8" value={formData.sportsFee} onChange={(e) => handleInputChange("sportsFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Tuition Fee</Label>
                                <Input type="number" className="h-8" value={formData.tuitionFee} onChange={(e) => handleInputChange("tuitionFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Annual Exam Fee</Label>
                                <Input type="number" className="h-8" value={formData.annualExamFee} onChange={(e) => handleInputChange("annualExamFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Books & Record</Label>
                                <Input type="number" className="h-8" value={formData.booksRecordFee} onChange={(e) => handleInputChange("booksRecordFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Stationary</Label>
                                <Input type="number" className="h-8" value={formData.stationaryCharges} onChange={(e) => handleInputChange("stationaryCharges", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Uniform Fee</Label>
                                <Input type="number" className="h-8" value={formData.uniformFee} onChange={(e) => handleInputChange("uniformFee", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <Label className="text-xs">Food & Accom.</Label>
                                <Input type="number" className="h-8" value={formData.foodAccomFee} onChange={(e) => handleInputChange("foodAccomFee", e.target.value)} />
                            </div>
                        </div>

                        <div className="bg-slate-100 p-3 rounded-md flex justify-between items-center font-bold">
                            <span>Total:</span>
                            <span>₹ {calculateTotal().toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Preview / PDF Output */}
                <div className="lg:col-span-2 overflow-auto bg-gray-500/10 p-4 rounded-xl flex justify-center items-start min-h-[800px]">
                    <div
                        ref={printRef}
                        className="bg-white text-black p-8 w-[210mm] min-h-[297mm] shadow-2xl mx-auto flex flex-col relative border-[3px] border-black"
                        style={{ fontFamily: "'Times New Roman', serif" }}
                    >
                        {/* Header */}
                        {/* Header */}
                        <div className="border-b-2 border-black pb-4 mb-6">
                            <div className="flex items-center justify-between px-4">
                                <img src="/college_logo.png" alt="Logo" className="h-24 w-auto object-contain" />
                                <div className="text-center flex-1">
                                    <h1 className="text-2xl font-bold uppercase tracking-wide mb-1 text-[#8B0000]">Sri Subramanya Swamy College of Pharmacy</h1>
                                    <p className="italic text-sm text-gray-600 mb-2">Building Bridges Across Healthcare</p>
                                </div>
                                <div className="w-24"></div> {/* Balance the logo space */}
                            </div>
                            <div className="w-full h-1 bg-black mt-2 mb-1"></div>
                            <div className="w-full h-0.5 bg-black"></div>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-lg font-bold uppercase underline underline-offset-4">Bonafide Student Certificate and Fees Estimate</h2>
                        </div>

                        {/* Date */}
                        <div className="absolute top-8 right-8 text-sm font-bold">
                            Date: {today}
                        </div>

                        {/* Body Text */}
                        <div className="text-justify leading-7 px-4 mb-6 text-lg">
                            <p>
                                This is to certify that <span className="font-bold">Kum/Mr. {formData.studentName || "________________"}</span> D/o, S/o <span className="font-bold">{formData.parentName || "________________"}</span> is studying in <span className="font-bold">{formData.courseYear} {formData.course}</span> in our institution for the Academic Year <span className="font-bold">{formData.academicYear}</span>. Total Duration of the program is Two academic years. Her/His fees details are as follows.
                            </p>
                        </div>

                        {/* Table */}
                        <div className="px-4 mb-4 flex-grow">
                            <table className="w-full border-collapse border-2 border-black text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border-2 border-black p-2 w-16 text-center">Sl No.</th>
                                        <th className="border-2 border-black p-2 text-left">Particulars</th>
                                        <th className="border-2 border-black p-2 w-40 text-right">{formData.courseYear} ({formData.course})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { id: 1, name: "Registration Fee", value: formData.registrationFee },
                                        { id: 2, name: "Admission Fee", value: formData.admissionFee },
                                        { id: 3, name: "Laboratory Fee", value: formData.laboratoryFee },
                                        { id: 4, name: "Internal Examination Fee (Theory & Practical)", value: formData.internalExamFee },
                                        { id: 5, name: "Library and Magazine calendar Fee", value: formData.libraryFee },
                                        { id: 6, name: "Sports and cultural, Student welfare Fund", value: formData.sportsFee },
                                        { id: 7, name: "Tuition Fee", value: formData.tuitionFee },
                                        { id: 8, name: "Annual Exam Fee", value: formData.annualExamFee },
                                        { id: 9, name: "Books & record", value: formData.booksRecordFee },
                                        { id: 10, name: "Stationary charges", value: formData.stationaryCharges },
                                        { id: 11, name: "Uniform Fee", value: formData.uniformFee },
                                        { id: 12, name: "Food And Accommodation Fee", value: formData.foodAccomFee },
                                    ].map((item) => (
                                        <tr key={item.id}>
                                            <td className="border-2 border-black p-2 text-center">{item.id}.</td>
                                            <td className="border-2 border-black p-2 font-medium">{item.name}</td>
                                            <td className="border-2 border-black p-2 text-right tracking-wider">
                                                {Number(item.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-200 font-bold text-lg">
                                        <td className="border-2 border-black p-3 text-center" colSpan={2}>Total</td>
                                        <td className="border-2 border-black p-3 text-right">
                                            {calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                            <div className="text-center">
                                {/* Empty for seal */}
                            </div>
                            <div className="text-center">
                                <div className="mb-2 italic font-fancy text-2xl">Principal</div>
                                <p className="font-bold">Principal</p>
                                <p className="text-sm">Sri Subramanya Swamy College of Pharmacy</p>
                                <p className="text-xs">Shivamogga - 577204</p>
                            </div>
                        </div>

                        {/* Footer Stripe */}
                        <div className="bg-black text-white p-2 text-xs flex justify-between px-8 absolute bottom-0 left-0 w-full print:fixed print:bottom-0">
                            <div>Contact: 9632917880 / 9168127880</div>
                            <div>Email: principalapc@gmail.com</div>
                            <div>www.aksharapc.in</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeesEstimation;