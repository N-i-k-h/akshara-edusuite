import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config";
import { Plus, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Exam {
  _id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  classes: string[];
  status: string;
}

const Exams = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newExam, setNewExam] = useState({
    name: "",
    type: "",
    startDate: "",
    endDate: "",
    classes: [] as string[] // Simplified, could use multi-select
  });

  // temporary simplistic grade placeholder
  const grades: any[] = [];

  const fetchExams = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/exams');
      if (response.ok) {
        const data = await response.json();
        setExamsList(data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setNewExam({ ...newExam, [field]: value });
  };

  const handleSaveExam = async () => {
    if (!newExam.name || !newExam.type || !newExam.startDate || !newExam.endDate) {
      toast.error("Please fill in all details");
      return;
    }

    const payload = {
      ...newExam,
      classes: ["All Classes"], // Placeholder default
      status: "Scheduled"
    };

    try {
      const response = await fetch('${API_BASE_URL}/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Exam scheduled successfully");
        setIsAddDialogOpen(false);
        fetchExams();
        setNewExam({ name: "", type: "", startDate: "", endDate: "", classes: [] });
      } else {
        toast.error("Failed to schedule exam");
      }
    } catch (error) {
      console.error("Error scheduling exam:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Upcoming":
        return "bg-blue-100 text-blue-800";
      case "Scheduled":
        return "bg-amber-100 text-amber-800";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exams & Grades</h1>
          <p className="text-muted-foreground">Manage examinations and student grades</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Exam
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Exam</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="examName">Exam Name</Label>
                <Input id="examName" value={newExam.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="e.g., Mid-Term Examination" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <Select value={newExam.type} onValueChange={(val) => handleInputChange("type", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unit Test">Unit Test</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Semester">Semester</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={newExam.startDate} onChange={(e) => handleInputChange("startDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" value={newExam.endDate} onChange={(e) => handleInputChange("endDate", e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveExam}>Schedule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="exams">
        <TabsList>
          <TabsTrigger value="exams">Examinations</TabsTrigger>
          <TabsTrigger value="grades">Grade Book</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center text-muted-foreground">Loading exams...</div>
            ) : examsList.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">No exams scheduled.</div>
            ) : (
              examsList.map((exam) => (
                <Card key={exam._id || (Math.random() + "")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{exam.name}</CardTitle>
                      <Badge className={getStatusColor(exam.status)}>{exam.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Type: {exam.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {exam.startDate} - {exam.endDate}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exam.classes.map((cls) => (
                        <Badge key={cls} variant="outline" className="text-xs">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Enter Grades
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="grades" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Grade Book</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Grades functionality coming soon with real student data integration.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Exams;
