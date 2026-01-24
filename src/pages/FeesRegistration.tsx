import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Save, CheckCircle } from "lucide-react";

interface Student {
    _id: string;
    name: string;
    class: string;
    rollNo: string;
    parentName: string;
}

interface FeeStructure {
    _id?: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    grade: string;
    academicYear: string;
    feeComponents: {
        registrationFee: number;
        admissionFee: number;
        laboratoryFee: number;
        internalExamFee: number;
        libraryFee: number;
        sportsFee: number;
        tuitionFee: number;
        annualExamFee: number;
        booksRecordFee: number;
        stationaryCharges: number;
        uniformFee: number;
        foodAccomFee: number;
    };
    totalFee: number;
}

const defaultFees = {
    registrationFee: 100,
    admissionFee: 1000,
    laboratoryFee: 2500,
    internalExamFee: 2500,
    libraryFee: 2500,
    sportsFee: 2500,
    tuitionFee: 45000,
    annualExamFee: 2500,
    booksRecordFee: 3900,
    stationaryCharges: 2500,
    uniformFee: 5000,
    foodAccomFee: 60000,
};

const FeesRegistration = () => {
    const [selectedGrade, setSelectedGrade] = useState("");
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [registeredFees, setRegisteredFees] = useState<FeeStructure[]>([]);
    const [classesList, setClassesList] = useState<any[]>([]);

    const [feeForm, setFeeForm] = useState(defaultFees);

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Students
                const studentRes = await fetch('${API_BASE_URL}/students');
                if (studentRes.ok) {
                    const data = await studentRes.json();
                    setStudents(data);
                }

                // Fetch Existing Fee Registrations
                const feesRes = await fetch('${API_BASE_URL}/fee-structures');
                if (feesRes.ok) {
                    const data = await feesRes.json();
                    setRegisteredFees(data);
                }

                // Fetch Classes
                const classesRes = await fetch("${API_BASE_URL}/classes");
                if (classesRes.ok) {
                    const classesData = await classesRes.json();
                    setClassesList(classesData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    // Filter students by grade
    useEffect(() => {
        if (selectedGrade) {
            const filtered = students.filter(s =>
                (s.class || "").toLowerCase().trim() === (selectedGrade || "").toLowerCase().trim()
            );
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents([]);
        }
        setSelectedStudent(null);
    }, [selectedGrade, students]);

    const handleFeeChange = (field: string, value: string) => {
        setFeeForm({ ...feeForm, [field]: Number(value) });
    };

    const calculateTotal = () => {
        return Object.values(feeForm).reduce((acc, curr) => acc + curr, 0);
    };

    const handleSaveFeeStructure = async () => {
        if (!selectedStudent || !selectedGrade) {
            toast.error("Please select a student first");
            return;
        }

        const payload: FeeStructure = {
            studentId: selectedStudent._id,
            studentName: selectedStudent.name,
            rollNo: selectedStudent.rollNo,
            grade: selectedGrade,
            academicYear: "2025-26", // Could be dynamic
            feeComponents: feeForm,
            totalFee: calculateTotal()
        };

        try {
            const response = await fetch('${API_BASE_URL}/fee-structures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success("Fee structure registered successfully");
                // Refresh list
                const newRecord = await response.json();
                setRegisteredFees([newRecord, ...registeredFees]);
                setSelectedStudent(null); // Reset selection
            } else {
                toast.error("Failed to register fees");
            }
        } catch (error) {
            console.error("Error saving fees:", error);
            toast.error("Failed to register fees");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Fees Registration</h1>
                    <p className="text-muted-foreground">Register fee structures for students</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Selection */}
                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Student</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Grade/Class</Label>
                                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
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

                            {selectedGrade && (
                                <div className="space-y-2">
                                    <Label>Students in {selectedGrade}</Label>
                                    <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                        {filteredStudents.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">No students found</div>
                                        ) : (
                                            filteredStudents.map(student => (
                                                <div
                                                    key={student._id}
                                                    onClick={() => setSelectedStudent(student)}
                                                    className={`p-3 cursor-pointer hover:bg-accent flex justify-between items-center text-sm ${selectedStudent?._id === student._id ? "bg-accent text-accent-foreground" : ""}`}
                                                >
                                                    <div>
                                                        <div className="font-medium">{student.name}</div>
                                                        <div className="text-xs text-muted-foreground">{student.rollNo}</div>
                                                        <div className="text-[10px] text-muted-foreground/70">{student.class}</div>
                                                    </div>
                                                    {selectedStudent?._id === student._id && <CheckCircle className="h-4 w-4 text-primary" />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Column: Registration Form */}
                <div className="lg:col-span-8">
                    {selectedStudent ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Fee Registration for {selectedStudent.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">Roll No: {selectedStudent.rollNo}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(feeForm).map(([key, value]) => (
                                        <div key={key} className="space-y-1">
                                            <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                            <Input
                                                type="number"
                                                value={value}
                                                onChange={(e) => handleFeeChange(key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t pt-4 flex justify-between items-center bg-slate-100 p-4 rounded-lg mt-4">
                                    <span className="text-lg font-bold">Total Fees</span>
                                    <span className="text-2xl font-bold text-primary">₹ {calculateTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setSelectedStudent(null)}>Cancel</Button>
                                    <Button onClick={handleSaveFeeStructure}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Register Fees
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12 bg-slate-50/50">
                            <Search className="h-12 w-12 mb-4 opacity-50" />
                            <p>Select a student from the left to register fees</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Recent Registrations List */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Registered Students List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>USN (Roll No)</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Academic Year</TableHead>
                                <TableHead className="text-right">Total Fees</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registeredFees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No fee structures registered yet.</TableCell>
                                </TableRow>
                            ) : (
                                registeredFees.map((fee) => (
                                    <TableRow key={fee._id || Math.random()}>
                                        <TableCell className="font-medium">{fee.studentName}</TableCell>
                                        <TableCell>{fee.rollNo}</TableCell>
                                        <TableCell>{fee.grade}</TableCell>
                                        <TableCell>{fee.academicYear}</TableCell>
                                        <TableCell className="text-right font-bold">₹ {fee.totalFee.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default FeesRegistration;
