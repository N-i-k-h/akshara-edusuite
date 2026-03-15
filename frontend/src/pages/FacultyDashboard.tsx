import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

interface Period {
  _id: string;
  className: string;
  day: string;
  period: number;
  subject: string;
  teacher: string;
}

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
}

const FacultyDashboard = () => {
  const [facultyProfile, setFacultyProfile] = useState<any>(null);
  const [assignedPeriods, setAssignedPeriods] = useState<Period[]>([]);
  const [assignedExams, setAssignedExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
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
        setFacultyProfile(profile);

        // Fetch assigned periods
        const periodsRes = await authFetch(
          `${API_BASE_URL}/faculty/${profile._id}/periods`,
        );
        if (periodsRes.ok) {
          const periods = await periodsRes.json();
          setAssignedPeriods(periods);
        }

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
      console.error("Error fetching faculty data:", error);
      toast.error("Failed to load faculty data");
    } finally {
      setIsLoading(false);
    }
  };

  const getTodaysPeriods = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = days[new Date().getDay()];
    return assignedPeriods.filter((p) => p.day === today);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!facultyProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Faculty profile not found</p>
      </div>
    );
  }

  const todaysPeriods = getTodaysPeriods();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Faculty Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome, {facultyProfile.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Classes
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysPeriods.length}</div>
            <p className="text-xs text-muted-foreground">
              Periods assigned today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedPeriods.length}</div>
            <p className="text-xs text-muted-foreground">Weekly periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Exams
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedExams.length}</div>
            <p className="text-xs text-muted-foreground">Exams to grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facultyProfile.department}
            </div>
            <p className="text-xs text-muted-foreground">
              {facultyProfile.role}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysPeriods.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No classes scheduled for today
            </p>
          ) : (
            <div className="space-y-3">
              {todaysPeriods
                .sort((a, b) => a.period - b.period)
                .map((period) => (
                  <div
                    key={period._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="text-lg font-semibold"
                      >
                        Period {period.period}
                      </Badge>
                      <div>
                        <p className="font-medium">{period.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {period.className}
                        </p>
                      </div>
                    </div>

                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Exams */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Exams for Grading</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedExams.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No exams assigned for grading
            </p>
          ) : (
            <div className="space-y-3">
              {assignedExams.map((exam) => (
                <div
                  key={exam._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{exam.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.className}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {exam.subjects.map((subject, idx) => (
                        <Badge key={idx} variant="secondary">
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={
                        exam.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {exam.status}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/exams/${exam._id}/results`)
                      }
                    >
                      Grade Students
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Assigned Periods */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => {
              const dayPeriods = assignedPeriods.filter((p) => p.day === day);
              if (dayPeriods.length === 0) return null;

              return (
                <div key={day} className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">{day}</h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {dayPeriods
                      .sort((a, b) => a.period - b.period)
                      .map((period) => (
                        <div
                          key={period._id}
                          className="p-2 bg-muted rounded text-sm"
                        >
                          <p className="font-medium">
                            Period {period.period} - {period.subject}
                          </p>
                          <p className="text-muted-foreground">
                            {period.className}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacultyDashboard;
