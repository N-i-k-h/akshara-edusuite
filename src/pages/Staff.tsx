import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";

import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface StaffMember {
  _id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  salary: number;
  joiningDate: string;
  status: string;
  password?: string; // Optional since it won't be returned from API
}

const Staff = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "",
    department: "",
    salary: "",
    email: "",
    phone: "",
    password: "",
    joiningDate: new Date().toISOString().split('T')[0],
    status: "Active"
  });

  const fetchStaff = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/staff`);
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setNewStaff({ ...newStaff, [field]: value });
  };

  const handleSaveStaff = async () => {
    if (!newStaff.name || !newStaff.role || !newStaff.email || !newStaff.department || !newStaff.phone || !newStaff.salary || !newStaff.password) {
      toast.error("Please fill in all required fields including password");
      return;
    }

    try {
      const payload = {
        ...newStaff,
        salary: Number(newStaff.salary)
      };

      console.log("Sending payload:", payload);

      const response = await authFetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Staff member added successfully");
        setIsAddDialogOpen(false);
        fetchStaff(); // Refresh list
        // Reset form
        setNewStaff({
          name: "",
          role: "",
          department: "",
          salary: "",
          email: "",
          phone: "",
          password: "",
          joiningDate: new Date().toISOString().split('T')[0],
          status: "Active"
        });
      } else {
        let errorData;
        try {
          errorData = await response.json();
          toast.error(`Failed: ${errorData.message} ${errorData.error ? '- ' + errorData.error : ''}`);
        } catch (e) {
          console.error("Non-JSON response:", response.status, response.statusText);
          toast.error(`Failed: Server returned ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      toast.error("Failed to add staff: Network or server error");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!id) {
      toast.error("Error: Invalid staff ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this staff member?")) return;

    try {
      console.log("Deleting staff with ID:", id);
      const response = await authFetch(`${API_BASE_URL}/staff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 404) {
        toast.success("Staff member deleted successfully");
        // Optimistically update UI
        setStaffList(prev => prev.filter(item => item._id !== id));
        // fetchStaff(); // Removed to prevent stale data re-fetch
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Delete failed:", response.status, errorData);
        toast.error(errorData.message || "Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff member. Check console for details.");
    }
  };

  const filteredStaff = staffList.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff & HR</h1>
          <p className="text-muted-foreground">Manage teachers and staff members</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input id="name" value={newStaff.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Enter name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                  <Select value={newStaff.role} onValueChange={(val) => handleInputChange("role", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                  <Input id="department" value={newStaff.department} onChange={(e) => handleInputChange("department", e.target.value)} placeholder="Enter department" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary <span className="text-red-500">*</span></Label>
                  <Input id="salary" type="number" value={newStaff.salary} onChange={(e) => handleInputChange("salary", e.target.value)} placeholder="Enter salary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" value={newStaff.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="Enter email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                  <Input id="phone" value={newStaff.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="Enter phone" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <Input id="password" type="password" value={newStaff.password} onChange={(e) => handleInputChange("password", e.target.value)} placeholder="Enter login password" />
                  <p className="text-xs text-muted-foreground">This will be used for faculty login</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveStaff}>Save Staff</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">Loading staff data...</TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">No staff found</TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow key={member._id || (Math.random() + "")}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "Teacher"
                          ? "default"
                          : member.role === "Admin"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>₹{member.salary?.toLocaleString()}</TableCell>
                  <TableCell>{member.joiningDate}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">{member.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteStaff(member._id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Staff;
