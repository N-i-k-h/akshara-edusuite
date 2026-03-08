import { useState, useEffect } from "react";
import { API_BASE_URL, authFetch } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Edit,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [editedData, setEditedData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("Please log in again");
        return;
      }

      const user = JSON.parse(userStr);
      setUserInfo(user);

      // If faculty, fetch staff profile
      if (user.role === "faculty") {
        const response = await authFetch(
          `${API_BASE_URL}/faculty/profile/${user.id}`,
        );
        if (response.ok) {
          const profile = await response.json();
          setStaffProfile(profile);
          setEditedData({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            password: "",
            confirmPassword: "",
          });
        }
      } else {
        // For admin, use user info
        setEditedData({
          name: user.name || "",
          email: user.email || "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate password if changing
    if (editedData.password) {
      if (editedData.password !== editedData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (editedData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    setIsSaving(true);
    try {
      if (userInfo.role === "faculty" && staffProfile) {
        // Update staff profile
        const updateData: any = {
          name: editedData.name,
          email: editedData.email,
          phone: editedData.phone,
        };

        if (editedData.password) {
          updateData.password = editedData.password;
        }

        const response = await authFetch(
          `${API_BASE_URL}/staff/${staffProfile._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          },
        );

        if (response.ok) {
          const updatedProfile = await response.json();
          setStaffProfile(updatedProfile);

          // Update user in localStorage
          const updatedUser = {
            ...userInfo,
            name: editedData.name,
            email: editedData.email,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUserInfo(updatedUser);

          toast.success("Profile updated successfully");
          setIsEditing(false);
          setEditedData((prev) => ({
            ...prev,
            password: "",
            confirmPassword: "",
          }));
        } else {
          const error = await response.json();
          toast.error(error.message || "Failed to update profile");
        }
      } else {
        // Update admin user
        const updateData: any = {
          name: editedData.name,
          email: editedData.email,
        };

        if (editedData.password) {
          updateData.password = editedData.password;
        }

        const response = await authFetch(
          `${API_BASE_URL}/users/${userInfo.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          },
        );

        if (response.ok) {
          const updatedUser = {
            ...userInfo,
            name: editedData.name,
            email: editedData.email,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUserInfo(updatedUser);

          toast.success("Profile updated successfully");
          setIsEditing(false);
          setEditedData((prev) => ({
            ...prev,
            password: "",
            confirmPassword: "",
          }));
        } else {
          const error = await response.json();
          toast.error(error.message || "Failed to update profile");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data
    if (staffProfile) {
      setEditedData({
        name: staffProfile.name || "",
        email: staffProfile.email || "",
        phone: staffProfile.phone || "",
        password: "",
        confirmPassword: "",
      });
    } else if (userInfo) {
      setEditedData({
        name: userInfo.name || "",
        email: userInfo.email || "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    }
  };

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const displayData = staffProfile || userInfo;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {userInfo.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <CardTitle>{displayData.name}</CardTitle>
              <Badge className="mt-1">
                {userInfo.role === "faculty" ? "Faculty" : "Administrator"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {displayData.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editedData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {displayData.email}
                </p>
              )}
            </div>

            {/* Phone (Faculty only) */}
            {staffProfile && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter your phone"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {staffProfile.phone}
                  </p>
                )}
              </div>
            )}

            {/* Department (Faculty only) */}
            {staffProfile && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department
                </Label>
                <p className="text-sm text-muted-foreground">
                  {staffProfile.department}
                </p>
              </div>
            )}

            {/* Role */}
            {staffProfile && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Role
                </Label>
                <p className="text-sm text-muted-foreground">
                  {staffProfile.role}
                </p>
              </div>
            )}

            {/* Joining Date (Faculty only) */}
            {staffProfile && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joining Date
                </Label>
                <p className="text-sm text-muted-foreground">
                  {staffProfile.joiningDate}
                </p>
              </div>
            )}

            {/* Assigned Classes (Faculty only) */}
            {staffProfile &&
              staffProfile.assignedClasses &&
              staffProfile.assignedClasses.length > 0 && (
                <div className="space-y-2">
                  <Label>Assigned Classes</Label>
                  <div className="flex flex-wrap gap-2">
                    {staffProfile.assignedClasses.map(
                      (className: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {className}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Password Change (Only when editing) */}
            {isEditing && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-4">
                    Change Password (Optional)
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={editedData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={editedData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
