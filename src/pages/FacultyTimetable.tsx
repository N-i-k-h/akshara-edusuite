import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Period {
    _id: string;
    className: string;
    day: string;
    period: number;
    subject: string;
    teacher: string;
}

const FacultyTimetable = () => {
    const [assignedPeriods, setAssignedPeriods] = useState<Period[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                toast.error("Please log in again");
                return;
            }

            const user = JSON.parse(userStr);

            // Fetch faculty profile
            const profileRes = await authFetch(`${API_BASE_URL}/faculty/profile/${user.id}`);
            if (profileRes.ok) {
                const profile = await profileRes.json();

                // Fetch assigned periods
                const periodsRes = await authFetch(`${API_BASE_URL}/faculty/${profile._id}/periods`);
                if (periodsRes.ok) {
                    const periods = await periodsRes.json();
                    setAssignedPeriods(periods);
                }
            }
        } catch (error) {
            console.error("Error fetching timetable:", error);
            toast.error("Failed to load timetable");
        } finally {
            setIsLoading(false);
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    const getPeriodForSlot = (day: string, periodNum: number) => {
        return assignedPeriods.find(p => p.day === day && p.period === periodNum);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Loading timetable...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Timetable</h1>
                <p className="text-muted-foreground">Your weekly class schedule</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Periods/Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assignedPeriods.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {[...new Set(assignedPeriods.map(p => p.className))].length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {[...new Set(assignedPeriods.map(p => p.subject))].length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Timetable Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border p-2 bg-muted font-semibold text-left min-w-[100px]">
                                        Day / Period
                                    </th>
                                    {periods.map(period => (
                                        <th key={period} className="border p-2 bg-muted font-semibold text-center min-w-[120px]">
                                            Period {period}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {days.map(day => (
                                    <tr key={day}>
                                        <td className="border p-2 font-medium bg-muted/50">{day}</td>
                                        {periods.map(periodNum => {
                                            const period = getPeriodForSlot(day, periodNum);
                                            return (
                                                <td key={`${day}-${periodNum}`} className="border p-2">
                                                    {period ? (
                                                        <div className="space-y-1">
                                                            <Badge className="w-full justify-center">{period.subject}</Badge>
                                                            <p className="text-xs text-muted-foreground text-center">
                                                                {period.className}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-muted-foreground text-sm">-</div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Period List by Day */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Detailed Schedule</h2>
                {days.map(day => {
                    const dayPeriods = assignedPeriods.filter(p => p.day === day);
                    if (dayPeriods.length === 0) return null;

                    return (
                        <Card key={day}>
                            <CardHeader>
                                <CardTitle className="text-base">{day}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {dayPeriods.sort((a, b) => a.period - b.period).map(period => (
                                        <div key={period._id} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline">Period {period.period}</Badge>
                                                <span className="text-xs text-muted-foreground">{period.className}</span>
                                            </div>
                                            <p className="font-medium">{period.subject}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default FacultyTimetable;
