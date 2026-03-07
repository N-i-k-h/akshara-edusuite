import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface Exam {
  _id: string;
  name: string;
  className: string;
  subjects: Array<{
    name: string;
    date: string;
    time: string;
    totalMarks: number;
    facultyId?: string;
  }>;
  status: string;
  createdAt: string;
}

const FacultyExams = () => {
  const [assignedExams, setAssignedExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const fetchAssignedExams = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("Please log in again");
        return;
      }

      const user = JSON.parse(userStr);

      // Fetch faculty profile
      const profileRes = await authFetch(
        `${API_BASE_URL}/faculty/profile/${user.id}`,
      );
      if (profileRes.ok) {
        const profile = await profileRes.json();

        // Fetch assigned exams
        const examsRes = await authFetch(
          `${API_BASE_URL}/faculty/${profile._id}/exams`,
        );
        if (examsRes.ok) {
          const exams = await examsRes.json();
          setAssignedExams(exams);
        }
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeExam = (examId: string) => {
    window.location.href = `/exams/${examId}/results`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading exams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exams & Grades</h1>
        <p className="text-muted-foreground">
          Manage and grade exams assigned to you
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedExams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {assignedExams.filter((e) => e.status === "Scheduled").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignedExams.filter((e) => e.status === "Completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams List */}
      {assignedExams.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No exams assigned yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Contact admin to assign exams for grading
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignedExams.map((exam) => (
            <Card key={exam._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{exam.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Class: {exam.className}
                    </p>
                  </div>
                  <Badge
                    className={
                      exam.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : exam.status === "Ongoing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {exam.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Subjects */}
                  <div>
                    <h4 className="font-semibold mb-2">Subjects:</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {exam.subjects.map((subject, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{subject.name}</span>
                            <Badge variant="outline">
                              {subject.totalMarks} marks
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Date: {subject.date}</p>
                            <p>Time: {subject.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={() => handleGradeExam(exam._id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Grade Students
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyExams;
