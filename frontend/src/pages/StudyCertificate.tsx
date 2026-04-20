import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { Printer, Download, FileText } from "lucide-react";

const StudyCertificate = () => {
  const printRef = useRef(null);
  const [certType, setCertType] = useState<"bonafide" | "council">("bonafide");

  const [formData, setFormData] = useState({
    // Common / Bonafide
    studentName: "",
    parentName: "",
    admissionNo: "",
    year: "1st", // 1st, 2nd, etc.
    course: "D.PHARMA",
    academicYear: "2024-25",
    date: new Date().toISOString().split("T")[0],
    place: "Shivamogga",

    // Council Specific
    refNo: "SSSCP/SC/2024-25",
    motherName: "",
    dob: "24/09/2000",
    dobWords: "TWENTY FOURTH – SEPTEMBER – TWO THOUSAND",
    qualification: "D. Pharm",
    board: "B E A",
    admissionDate: "01/11/2022",
    regNo: "B558202",
    yearAdmission: "2021",
    yearPassing: "JAN-2024",
    pciLetter:
      "Item No-137, Diploma IR No.6th (Dec-2013) up to 2016-2017. 102 CC Item No.86 Diploma, IR No. 7th Surprise (March-2017) Up to 2019-20. PCI-2336, 2020-23. PCI-2336. Up to 2023-24. 412th EC. 10.8.2024 under Item No.1 up to 2024-25.",

    principalName: "RAVI M C",
    principalRegNo: "26898",
    principalRegDate: "18/09/1999",
    principalMobile: "9632917880",
    principalEmail: "ravimc2020@gmail.com",
    eCertificate: true,

    // Principal Qualifications
    qualDPharm: false,
    qualBPharm: false,
    qualMPharm: true,
    qualPharmD: false,
    qualPharmDPB: false,
    qualPhD: false,
    regDPharm: false,
    regBPharm: false,
    regMPharm: true,
    regPharmD: false,
    regPharmDPB: false,
    regPhD: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;

    const namePart = formData.studentName.trim() || "Student";
    const safeName = namePart.replace(/[^a-z0-9]/gi, "_");
    const typeStr = certType === "bonafide" ? "Bonafide" : "Council";
    const filename = `Study_Certificate_${typeStr}_${safeName}.pdf`;

    const element = printRef.current;
    const opt = {
      margin: [0, 0, 0, 0] as [number, number, number, number],
      filename: filename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        height: element.offsetHeight,
        width: element.offsetWidth,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait" as const,
        putOnlyUsedFonts: true,
        floatPrecision: 16 
      },
      pagebreak: { mode: ["avoid-all"] },
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
        toast.success(`${typeStr} Certificate Downloaded`);
      });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Study Certificate
          </h1>
          <p className="text-muted-foreground mr-4">
            Generate Study Certificates
          </p>
        </div>

        <div className="flex items-center gap-4 bg-muted p-1 rounded-lg">
          <Button
            variant={certType === "bonafide" ? "default" : "ghost"}
            onClick={() => setCertType("bonafide")}
            size="sm"
          >
            Bonafide
          </Button>
          <Button
            variant={certType === "council" ? "default" : "ghost"}
            onClick={() => setCertType("council")}
            size="sm"
          >
            Council Format
          </Button>
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
        <Card className="lg:col-span-1 h-fit no-print max-h-[85vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {certType === "bonafide"
                ? "Bonafide Details"
                : "Council Form Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Common Fields */}
            <div className="space-y-2">
              <Label>Student Name</Label>
              <Input
                value={formData.studentName}
                onChange={(e) =>
                  handleInputChange("studentName", e.target.value)
                }
                placeholder="e.g. NIRANJAN K"
              />
            </div>
            <div className="space-y-2">
              <Label>Father's Name</Label>
              <Input
                value={formData.parentName}
                onChange={(e) =>
                  handleInputChange("parentName", e.target.value)
                }
                placeholder="e.g. KUMARACHAR"
              />
            </div>

            {certType === "council" && (
              <>
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
                  <Label>DOB (DD/MM/YYYY)</Label>
                  <Input
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>DOB (Words)</Label>
                  <Input
                    value={formData.dobWords}
                    onChange={(e) =>
                      handleInputChange("dobWords", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference No</Label>
                  <Input
                    value={formData.refNo}
                    onChange={(e) => handleInputChange("refNo", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Admission No</Label>
              <Input
                value={formData.admissionNo}
                onChange={(e) =>
                  handleInputChange("admissionNo", e.target.value)
                }
              />
            </div>

            {certType === "bonafide" ? (
              // Bonafide Only Fields
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      value={formData.year}
                      onChange={(e) =>
                        handleInputChange("year", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Input
                      value={formData.academicYear}
                      onChange={(e) =>
                        handleInputChange("academicYear", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Input
                    value={formData.course}
                    onChange={(e) =>
                      handleInputChange("course", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Place</Label>
                    <Input
                      value={formData.place}
                      onChange={(e) =>
                        handleInputChange("place", e.target.value)
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              // Council Only Fields
              <>
                <div className="space-y-2 border-t pt-2">
                  <Label className="font-bold text-blue-600">
                    Academic Details
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      placeholder="Qual."
                      value={formData.qualification}
                      onChange={(e) =>
                        handleInputChange("qualification", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Board"
                      value={formData.board}
                      onChange={(e) =>
                        handleInputChange("board", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Adm Date"
                      value={formData.admissionDate}
                      onChange={(e) =>
                        handleInputChange("admissionDate", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Reg No"
                      value={formData.regNo}
                      onChange={(e) =>
                        handleInputChange("regNo", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Year Adm"
                      value={formData.yearAdmission}
                      onChange={(e) =>
                        handleInputChange("yearAdmission", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Year Pass"
                      value={formData.yearPassing}
                      onChange={(e) =>
                        handleInputChange("yearPassing", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>PCI Approval Text</Label>
                    <textarea
                      className="w-full border rounded-md p-2 text-xs"
                      rows={4}
                      value={formData.pciLetter}
                      onChange={(e) =>
                        handleInputChange("pciLetter", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t pt-2">
                  <Label className="font-bold text-blue-600">
                    Principal Details
                  </Label>
                  <Input
                    placeholder="Name"
                    value={formData.principalName}
                    onChange={(e) =>
                      handleInputChange("principalName", e.target.value)
                    }
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      placeholder="Reg No"
                      value={formData.principalRegNo}
                      onChange={(e) =>
                        handleInputChange("principalRegNo", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Reg Date"
                      value={formData.principalRegDate}
                      onChange={(e) =>
                        handleInputChange("principalRegDate", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Mobile"
                      value={formData.principalMobile}
                      onChange={(e) =>
                        handleInputChange("principalMobile", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Email"
                      value={formData.principalEmail}
                      onChange={(e) =>
                        handleInputChange("principalEmail", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.eCertificate}
                      onChange={(e) =>
                        handleInputChange("eCertificate", e.target.checked)
                      }
                    />
                    <Label>Has E-Certificate?</Label>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-2">
                  <Label className="font-bold text-blue-600">
                    Princ. Qualifications
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.qualDPharm}
                        onChange={(e) =>
                          handleInputChange("qualDPharm", e.target.checked)
                        }
                      />{" "}
                      Obt D.Pharm
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.regDPharm}
                        onChange={(e) =>
                          handleInputChange("regDPharm", e.target.checked)
                        }
                      />{" "}
                      Reg D.Pharm
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={formData.qualBPharm}
                        onChange={(e) =>
                          handleInputChange("qualBPharm", e.target.checked)
                        }
                      />{" "}
                      Obt B.Pharm
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.regBPharm}
                        onChange={(e) =>
                          handleInputChange("regBPharm", e.target.checked)
                        }
                      />{" "}
                      Reg B.Pharm
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={formData.qualMPharm}
                        onChange={(e) =>
                          handleInputChange("qualMPharm", e.target.checked)
                        }
                      />{" "}
                      Obt M.Pharm
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.regMPharm}
                        onChange={(e) =>
                          handleInputChange("regMPharm", e.target.checked)
                        }
                      />{" "}
                      Reg M.Pharm
                    </label>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* PDF Preview Area */}
        <div className="lg:col-span-2 bg-gray-500/10 p-4 rounded-xl flex justify-center items-start min-h-[500px] lg:min-h-[800px] overflow-hidden">
          <div className="transform scale-[0.45] md:scale-[0.7] lg:scale-[0.85] xl:scale-100 origin-top transition-transform duration-300">
            <div
              ref={printRef}
              className="bg-white text-black w-[210mm] h-[295mm] overflow-hidden flex flex-col relative"
              style={{ fontFamily: "'Times New Roman', serif" }}
            >
              {certType === "bonafide" ? (
                // === BONAFIDE TEMPLATE ===
                <div className="p-8 h-[295mm] overflow-hidden flex flex-col">
                  {/* 3cm top gap for pre-printed header */}
                  <div style={{ height: "30mm" }}></div>

                  <div className="text-center mb-12 mt-8">
                    <h2 className="text-2xl font-bold uppercase underline underline-offset-4 tracking-wide">
                      STUDY CERTIFICATE
                    </h2>
                  </div>

                  <div className="text-xl leading-10 text-justify mb-8 px-4">
                    <p>
                      This is to certify that Mr./Ms.{" "}
                      <span className="font-bold underline decoration-black underline-offset-4 decoration-2 px-2 uppercase">
                        {formData.studentName || "_________________"}
                      </span>{" "}
                      S/o of Mr.{" "}
                      <span className="font-bold underline decoration-black underline-offset-4 decoration-2 px-2 uppercase">
                        {formData.parentName || "_________________"}
                      </span>
                      , bearing admission number{" "}
                      <span className="font-bold underline decoration-black underline-offset-4 decoration-2 px-1">
                        {formData.admissionNo || "_______"}
                      </span>{" "}
                      is a student of{" "}
                      <span className="font-bold underline decoration-black underline-offset-4 decoration-2 px-1">
                        {formData.year}
                      </span>{" "}
                      Year,{" "}
                      <span className="font-bold underline">
                        {formData.course}
                      </span>{" "}
                      (Diploma in Pharmacy) for the academic year{" "}
                      <span className="font-bold underline decoration-black underline-offset-4 decoration-2 px-1">
                        {formData.academicYear}
                      </span>
                      . He/she is a bonafide student of{" "}
                      <span className="underline font-semibold">
                        Sri Subrahamanya Swamy College of Pharmacy
                      </span>{" "}
                      , Shimoga.
                    </p>
                  </div>

                  <div className="mt-auto px-4 flex justify-between items-end pb-[25mm]">
                    <div>
                      <p className="mb-1">
                        Date:{" "}
                        {formData.date
                          ? new Date(formData.date).toLocaleDateString("en-GB")
                          : ""}
                      </p>
                      <p>Place: {formData.place}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg mb-8">PRINCIPAL</p>
                    </div>
                  </div>
                </div>
              ) : (
                // === COUNCIL FORMAT TEMPLATE ===
                <div className="p-6 h-[295mm] text-[11px] flex flex-col overflow-hidden">
                  {/* 3cm top gap for pre-printed header */}
                  <div style={{ height: "30mm" }}></div>
                  
                  {/* Top Header Row */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold">{formData.refNo}</p>
                    </div>
                    <div>
                      <p className="font-bold">
                        Date:
                        {new Date(formData.date).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>

                  {/* To Address & Photo */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-[60%]">
                      <p>To,</p>
                      <p className="font-bold">The Registrar,</p>
                      <p>Karnataka State Pharmacy Council,</p>
                      <p># 514/E, 1st Main, 2nd Stage,</p>
                      <p>Club Road, Vijayanagar,</p>
                      <p>Bangalore – 560104</p>
                    </div>
                    <div className="w-[100px] h-[120px] border border-black flex items-center justify-center bg-gray-50 text-[10px] text-gray-400">
                      Passport Size Photo
                    </div>
                  </div>

                  {/* Title */}
                  <div
                    className="bg-gray-700 text-white font-bold text-center py-1 uppercase mb-2 print:bg-gray-700 print:text-white"
                    style={{ WebkitPrintColorAdjust: "exact" }}
                  >
                    STUDENT’S STUDY CERTIFICATE AND PRINCIPAL’S DETAILS
                  </div>

                  {/* Student Details Table */}
                  <table className="w-full border-collapse border border-black mb-2">
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 font-bold w-[35%] bg-gray-100">
                          Name of the Student
                        </td>
                        <td className="border border-black p-2 uppercase font-semibold">
                          {formData.studentName}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 font-bold bg-gray-100">
                          Father’s / Guardian’s Name
                        </td>
                        <td className="border border-black p-2 uppercase">
                          {formData.parentName}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 font-bold bg-gray-100">
                          Mother’s Name
                        </td>
                        <td className="border border-black p-2 uppercase">
                          {formData.motherName}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2 font-bold bg-gray-100">
                          Date of Birth
                        </td>
                        <td className="border border-black p-2">
                          {formData.dob}{" "}
                          <span className="uppercase text-[10px] ml-2">
                            ({formData.dobWords})
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Disclaimer */}
                  <p className="text-[10px] mb-1 font-semibold">
                    (Date of Birth as per SSLC Marks Card / Transfer Certificate
                    / Birth Certificate)
                  </p>

                  {/* Academic Table */}
                  <table className="w-full border-collapse border border-black mb-2 text-center">
                    <thead className="bg-gray-100 text-[10px]">
                      <tr>
                        <th className="border border-black p-1">
                          Qualification
                        </th>
                        <th className="border border-black p-1">
                          Board / University*
                        </th>
                        <th className="border border-black p-1">
                          Admission No. and Date (dd.mm.yyyy)
                        </th>
                        <th className="border border-black p-1">Reg. No.</th>
                        <th className="border border-black p-1">
                          Year of Admission
                        </th>
                        <th className="border border-black p-1">
                          Year of Passing
                        </th>
                        <th className="border border-black p-1 w-[35%]">
                          PCI Approval Letter <br /> Ref. No. & Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 font-bold">
                          {formData.qualification}
                        </td>
                        <td className="border border-black p-2">
                          {formData.board}
                        </td>
                        <td className="border border-black p-2">
                          <div>{formData.admissionNo}</div>
                          <div className="text-xs">
                            {formData.admissionDate}
                          </div>
                        </td>
                        <td className="border border-black p-2">
                          {formData.regNo}
                        </td>
                        <td className="border border-black p-2">
                          {formData.yearAdmission}
                        </td>
                        <td className="border border-black p-2">
                          {formData.yearPassing}
                        </td>
                        <td className="border border-black p-2 text-xs text-justify align-top leading-tight">
                          {formData.pciLetter}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Principal Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 border border-black mb-4">
                    {/* Left: Registration Details */}
                    <div className="border-r border-black">
                      <div className="bg-gray-100 font-bold text-center p-1 border-b border-black text-[11px]">
                        State Pharmacy Council Registration Details of the
                        Principal
                      </div>
                      <table className="w-full text-[11px]">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 font-semibold w-1/3">Name</td>
                            <td className="p-2 border-l border-gray-300 uppercase">
                              {formData.principalName}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 font-semibold">Reg. No.</td>
                            <td className="p-2 border-l border-gray-300">
                              {formData.principalRegNo}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 font-semibold">Date of Reg.</td>
                            <td className="p-2 border-l border-gray-300">
                              {formData.principalRegDate}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 font-semibold">E-Certificate</td>
                            <td className="p-2 border-l border-gray-300 flex gap-4">
                              <span className="flex items-center gap-1">
                                {formData.eCertificate ? "☑" : "☐"} Yes
                              </span>
                              <span className="flex items-center gap-1">
                                {!formData.eCertificate ? "☑" : "☐"} No
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="p-2 font-semibold">Mobile No.</td>
                            <td className="p-2 border-l border-gray-300">
                              {formData.principalMobile}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-semibold">E-Mail ID</td>
                            <td className="p-2 border-l border-gray-300 underline">
                              {formData.principalEmail}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right: Qualifications */}
                    <div>
                      <div className="bg-gray-100 font-bold text-center p-1 border-b border-black text-[11px]">
                        Educational Qualifications of the Principal
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 text-[10px]">
                        <div className="border-r border-black">
                          <div className="text-center font-semibold border-b border-black bg-gray-50 p-1">
                            Degree/s Obtained
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.qualDPharm && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>D. Pharm</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.qualBPharm && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>B. Pharm</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.qualMPharm && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>M. Pharm</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.qualPharmD && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>Pharm. D</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.qualPharmDPB && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>Pharm. D (PB)</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.qualPhD && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>Ph. D</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-center font-semibold border-b border-black bg-gray-50 p-1">
                            Registered With KSPC
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.regDPharm && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>D. Pharm</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.regBPharm && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>B. Pharm</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.regMPharm && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>M. Pharm</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.regPharmD && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>Pharm. D</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.regPharmDPB && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>Pharm. D (PB)</span>
                            </div>
                            <div className="flex items-center gap-2 leading-none">
                              <div className="w-[12px] h-[12px] border border-black flex-shrink-0 flex items-center justify-center bg-white">
                                {formData.regPhD && (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </div>
                              <span>Ph. D</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Principal Signature Area with footer gap */}
                  <div className="mt-auto pt-2 flex justify-between items-end pb-[25mm]">
                    <div>
                      <p>Date: {new Date(formData.date).toLocaleDateString("en-GB")}</p>
                      <p>Place: {formData.place}</p>
                    </div>
                    <div className="text-center pr-12">
                      <p className="font-bold underline">Principal</p>
                      <p className="text-xs italic">(Signature & Seal)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCertificate;
