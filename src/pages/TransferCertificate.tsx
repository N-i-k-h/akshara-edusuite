import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { Printer, Download, FileText } from "lucide-react";
import { ToWords } from "to-words";

const TransferCertificate = () => {
  const printRef = useRef(null);
  const toWords = new ToWords();

  const [formData, setFormData] = useState({
    admissionNo: "",
    tcNo: "",
    studentName: "",
    gender: "",
    nationality: "INDIAN",
    fatherName: "",
    motherName: "",
    religionCaste: "",
    casteCategory: "No", // SC/ST
    dob: "",
    dobWords: "",
    placeOfBirth: "",
    dateOfAdmission: "",
    dateOfLeaving: "",
    classLeft: "",
    promotionStatus: "YES", // Qualified for promotion
    regNo: "",
    examMonth: "",
    examYear: "",
    duesPaid: "YES",
    character: "Satisfactory",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (formData.dob) {
      try {
        const dateObj = new Date(formData.dob);
        // Basic conversion, can be improved for "Twenty Fourth September Two Thousand..."
        // For now using simple locale string or to-words library if needed for numbers
        // Let's formatting it like the image: "Twentyfour - September - Two Thousand ..."

        const day = dateObj.getDate();
        const month = dateObj.toLocaleString("default", { month: "long" });
        const year = dateObj.getFullYear();

        const dayWords = toWords.convert(day);
        const yearWords = toWords.convert(year);

        setFormData((prev) => ({
          ...prev,
          dobWords: `${dayWords} - ${month} - ${yearWords}`,
        }));
      } catch (e) {
        // ignore
      }
    }
  }, [formData.dob]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;

    const namePart = formData.studentName.trim() || "Student";
    const safeName = namePart.replace(/[^a-z0-9]/gi, "_");
    const filename = `TC_${safeName}_${formData.tcNo || "Draft"}.pdf`;

    const element = printRef.current;
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
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
        toast.success("Transfer Certificate Downloaded");
      });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Transfer Certificate
          </h1>
          <p className="text-muted-foreground">
            Generate and print Transfer Certificates
          </p>
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
        {/* Inputs */}
        <Card className="lg:col-span-1 h-fit no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              TC Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Admission No</Label>
                <Input
                  value={formData.admissionNo}
                  onChange={(e) =>
                    handleInputChange("admissionNo", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>TC No</Label>
                <Input
                  value={formData.tcNo}
                  onChange={(e) => handleInputChange("tcNo", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input
                value={formData.studentName}
                onChange={(e) =>
                  handleInputChange("studentName", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  placeholder="MALE / Female"
                />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) =>
                    handleInputChange("nationality", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Father's Name</Label>
              <Input
                value={formData.fatherName}
                onChange={(e) =>
                  handleInputChange("fatherName", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Mother's Name</Label>
              <Input
                value={formData.motherName}
                onChange={(e) =>
                  handleInputChange("motherName", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Religion / Caste (Category)</Label>
              <Input
                value={formData.religionCaste}
                onChange={(e) =>
                  handleInputChange("religionCaste", e.target.value)
                }
                placeholder="e.g. HINDU - GOWDA (3A)"
              />
            </div>

            <div className="space-y-2">
              <Label>Scheduled Caste/Tribe?</Label>
              <Input
                value={formData.casteCategory}
                onChange={(e) =>
                  handleInputChange("casteCategory", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange("dob", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>DOB (Words) - *Auto-filled*</Label>
              <Textarea
                value={formData.dobWords}
                onChange={(e) => handleInputChange("dobWords", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Place of Birth</Label>
              <Input
                value={formData.placeOfBirth}
                onChange={(e) =>
                  handleInputChange("placeOfBirth", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Admission</Label>
              <Input
                type="date"
                value={formData.dateOfAdmission}
                onChange={(e) =>
                  handleInputChange("dateOfAdmission", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Leaving</Label>
              <Input
                type="date"
                value={formData.dateOfLeaving}
                onChange={(e) =>
                  handleInputChange("dateOfLeaving", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Class Leaving</Label>
              <Input
                value={formData.classLeft}
                onChange={(e) => handleInputChange("classLeft", e.target.value)}
                placeholder="e.g. D.PHARM COMPLETED"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label className="font-semibold">Promotion Status</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={formData.regNo}
                  onChange={(e) => handleInputChange("regNo", e.target.value)}
                  placeholder="Reg No"
                />
                <Input
                  value={formData.examYear}
                  onChange={(e) =>
                    handleInputChange("examYear", e.target.value)
                  }
                  placeholder="Year (e.g. 2024)"
                />
                <Input
                  value={formData.examMonth}
                  onChange={(e) =>
                    handleInputChange("examMonth", e.target.value)
                  }
                  placeholder="Month (e.g. JANUARY)"
                  className="md:col-span-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paid All Dues?</Label>
              <Input
                value={formData.duesPaid}
                onChange={(e) => handleInputChange("duesPaid", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Character</Label>
              <Input
                value={formData.character}
                onChange={(e) => handleInputChange("character", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* PDF Preview Area */}
        <div className="lg:col-span-2 bg-gray-500/10 p-4 rounded-xl flex justify-center items-start min-h-[500px] lg:min-h-[800px] overflow-hidden">
          <div className="transform scale-[0.45] md:scale-[0.7] lg:scale-[0.85] xl:scale-100 origin-top transition-transform duration-300">
            <div
              ref={printRef}
              className="bg-white text-black p-8 w-[210mm] min-h-[297mm] shadow-2xl flex flex-col relative border-[2px] border-black"
              style={{ fontFamily: "'Times New Roman', serif" }}
            >
              {/* Header */}
              <div className="flex border-b-[2px] border-black pb-2 mb-4">
                <div className="w-[15%] flex items-center justify-center p-2 border-r-[2px] border-black">
                  <img
                    src="/college_logo.png"
                    alt="Logo"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="w-[85%] text-center p-2 flex flex-col justify-center">
                  <h1 className="text-2xl font-bold uppercase text-[#8B0000] tracking-wide mb-1">
                    Sri Subramanya Swamy College of Pharmacy
                  </h1>
                  <p className="text-sm font-medium">
                    2nd Floor, Akshara College Building, Opp.JNNCE, Savalanaga
                    Road, Shivamogga - 577204
                  </p>
                  <div className="w-full h-[1px] bg-black my-1"></div>
                  <p className="text-xs font-medium">
                    (Approved by Govt.of Karnataka and Affiliated by PCI, NEW
                    DELHI)
                  </p>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-widest text-gray-700">
                  TRANSFER CERTIFICATE
                </h2>
              </div>

              <div className="flex justify-between font-bold mb-4 px-2">
                <span>Admission No: {formData.admissionNo}</span>
                <span>T.C No. {formData.tcNo}</span>
              </div>

              {/* Table */}
              <div className="border-[2px] border-black text-sm">
                {/* Row 1 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    1
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Name of the Student
                  </div>
                  <div className="flex-1 p-2 font-bold uppercase">
                    {formData.studentName}
                  </div>
                </div>
                {/* Row 2 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    2
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Gender :
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.gender}
                  </div>
                </div>
                {/* Row 3 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    3
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Nationality :
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.nationality}
                  </div>
                </div>
                {/* Row 4 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    4
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Father's Name :
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.fatherName}
                  </div>
                </div>
                {/* Row 5 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    5
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Mother's Name :
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.motherName}
                  </div>
                </div>
                {/* Row 6 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    6
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Religion/Category & Caste
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.religionCaste}
                  </div>
                </div>
                {/* Row 7 */}
                <div className="flex border-b-[1px] border-black min-h-[40px]">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold flex items-center justify-center">
                    7
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Whether the candidate belongs to Scheduled Caste or
                    Scheduled Tribe ?
                  </div>
                  <div className="flex-1 p-2 font-medium flex items-center uppercase">
                    {formData.casteCategory}
                  </div>
                </div>
                {/* Row 8 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold flex items-center justify-center">
                    8
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Date of Birth according to Admission Register
                  </div>
                  <div className="flex-1 p-2 font-medium">
                    <div className="mb-1">
                      (In Figures){" "}
                      <strong>
                        {formData.dob
                          ? new Date(formData.dob).toLocaleDateString("en-GB")
                          : ""}
                      </strong>
                    </div>
                    <div>
                      (In Words){" "}
                      <span className="capitalize">{formData.dobWords}</span>
                    </div>
                  </div>
                </div>
                {/* Row 9 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    9
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Place Birth :
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.placeOfBirth}
                  </div>
                </div>
                {/* Row 10 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    10
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Date of Admission
                  </div>
                  <div className="flex-1 p-2 font-medium">
                    {formData.dateOfAdmission
                      ? new Date(formData.dateOfAdmission).toLocaleDateString(
                          "en-GB",
                        )
                      : ""}
                  </div>
                </div>
                {/* Row 11 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    11
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Date of Leaving
                  </div>
                  <div className="flex-1 p-2 font-medium">
                    {formData.dateOfLeaving
                      ? new Date(formData.dateOfLeaving).toLocaleDateString(
                          "en-GB",
                        )
                      : ""}
                  </div>
                </div>
                {/* Row 12 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    12
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Class from which the pupil leaves the College
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.classLeft}
                  </div>
                </div>
                {/* Row 13 */}
                <div className="flex border-b-[1px] border-black min-h-[50px]">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold flex items-center justify-center">
                    13
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Whether qualified for promotion to the higher Class
                  </div>
                  <div className="flex-1 p-2 font-medium">
                    <div className="mb-1">
                      Reg No : -{" "}
                      <span className="font-bold">{formData.regNo}</span>
                    </div>
                    <div className="flex gap-4">
                      <span>
                        Month : -{" "}
                        <span className="uppercase">{formData.examMonth}</span>
                      </span>
                      <span>
                        Year:{" "}
                        <span className="font-bold">{formData.examYear}</span>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Row 14 */}
                <div className="flex border-b-[1px] border-black">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    14
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Whether He/She paid all dues ?
                  </div>
                  <div className="flex-1 p-2 font-medium uppercase">
                    {formData.duesPaid}
                  </div>
                </div>
                {/* Row 15 */}
                <div className="flex">
                  <div className="w-12 border-r-[1px] border-black p-2 text-center font-bold">
                    15
                  </div>
                  <div className="w-1/2 border-r-[1px] border-black p-2 font-bold">
                    Character of the Student
                  </div>
                  <div className="flex-1 p-2 font-medium capitalize">
                    {formData.character}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-16 flex justify-between items-end">
                <div>
                  Date :{" "}
                  {formData.date
                    ? new Date(formData.date).toLocaleDateString("en-GB")
                    : ""}
                </div>
                <div className="text-center">
                  <div className="font-bold">PRINCIPAL</div>
                  <div className="text-xs mt-1">
                    Sri Subramanya Swamy College of Pharmacy
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferCertificate;
