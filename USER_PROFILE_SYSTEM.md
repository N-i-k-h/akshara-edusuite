# User Profile System Implementation

## Overview
Implemented a comprehensive user profile system where both admin and faculty users can:
- **View their profile** with dynamic information from the database
- **Edit their profile** including name, email, phone (faculty), and password
- **See their role** displayed in the navbar with initials
- **Access profile** from the top-right dropdown menu

## What's Been Implemented

### 1. Dynamic Navbar with User Info
**File**: `src/components/layout/Navbar.tsx`

**Features**:
- ✅ Shows **dynamic user name** from localStorage
- ✅ Shows **dynamic user email** from localStorage
- ✅ Shows **user initials** in avatar (e.g., "JD" for John Doe)
- ✅ Added **"Profile" menu option** in dropdown
- ✅ Clicking Profile navigates to `/profile` page

**Before**:
```tsx
<p className="text-sm font-medium">Admin</p>
<p className="text-xs text-muted-foreground">admin@akshara.com</p>
```

**After**:
```tsx
<p className="text-sm font-medium">{user.name}</p>
<p className="text-xs text-muted-foreground">{user.email}</p>
```

### 2. Profile Page with Edit Functionality
**File**: `src/pages/Profile.tsx`

**Features**:

#### **View Mode**:
- Shows user avatar with initials
- Displays role badge (Faculty/Administrator)
- Shows all profile information:
  - Full Name
  - Email
  - Phone (faculty only)
  - Department (faculty only)
  - Role (faculty only)
  - Joining Date (faculty only)
  - Assigned Classes (faculty only)
- "Edit Profile" button

#### **Edit Mode**:
- Editable fields:
  - ✅ **Name** - Can be updated
  - ✅ **Email** - Can be updated
  - ✅ **Phone** - Can be updated (faculty only)
  - ✅ **Password** - Optional password change
  - ✅ **Confirm Password** - Password confirmation
- Password validation:
  - Must match confirmation
  - Minimum 6 characters
  - Optional (leave blank to keep current password)
- **Save Changes** button
- **Cancel** button (reverts changes)

#### **For Faculty**:
- Fetches staff profile from `/api/faculty/profile/:userId`
- Shows additional fields: department, role, joining date, assigned classes
- Updates both Staff and User collections when saving

#### **For Admin**:
- Uses user info from localStorage
- Updates User collection when saving

### 3. Backend API Endpoints

#### **Update Staff Profile**
```
PUT /api/staff/:id
Body: {
  name: string,
  email: string,
  phone: string,
  password?: string (optional)
}
```

**Features**:
- Updates staff information
- If password provided, updates both Staff and User collections
- Returns updated staff data without password
- Syncs name and email to User collection

#### **Update User Profile**
```
PUT /api/users/:id
Body: {
  name: string,
  email: string,
  password?: string (optional)
}
```

**Features**:
- Updates admin user information
- If password provided, updates password
- Returns updated user data without password

### 4. Routing
**File**: `src/App.tsx`

Added new route:
```tsx
<Route path="/profile" element={<Profile />} />
```

Available to both admin and faculty users.

## How It Works

### **Viewing Profile**

1. **Click on your name/avatar** in top-right corner
2. **Click "Profile"** from dropdown menu
3. **See your profile information**:
   - Admin: Name, Email, Role
   - Faculty: Name, Email, Phone, Department, Role, Joining Date, Assigned Classes

### **Editing Profile**

1. **Click "Edit Profile"** button
2. **Modify fields** you want to change:
   - Update name
   - Update email
   - Update phone (faculty)
   - Change password (optional)
3. **Enter password confirmation** if changing password
4. **Click "Save Changes"**
5. **Profile updated** and localStorage refreshed

### **Changing Password**

1. **Enter new password** in "New Password" field
2. **Confirm password** in "Confirm New Password" field
3. **Click "Save Changes"**
4. **Password updated** in database
5. **Use new password** for next login

## User Flow Examples

### **Example 1: Faculty Viewing Profile**

1. Faculty logs in as "Dr. John Smith"
2. Navbar shows:
   - Avatar: "JS"
   - Name: "Dr. John Smith"
   - Email: "john.smith@akshara.com"
3. Clicks on profile dropdown → "Profile"
4. Sees profile page with:
   - Name: Dr. John Smith
   - Email: john.smith@akshara.com
   - Phone: 9876543210
   - Department: Pharmacy
   - Role: Professor
   - Joining Date: 2020-01-15
   - Assigned Classes: D.Pharma 1 - A, D.Pharma 2 - B

### **Example 2: Faculty Editing Profile**

1. Clicks "Edit Profile"
2. Changes:
   - Phone: 9876543210 → 9999999999
   - Password: (enters new password)
   - Confirm Password: (confirms)
3. Clicks "Save Changes"
4. Success toast: "Profile updated successfully"
5. Profile updated in database
6. Navbar refreshes with updated info

### **Example 3: Admin Editing Profile**

1. Admin clicks profile → "Profile"
2. Sees:
   - Name: Admin
   - Email: admin@akshara.com
   - Role: Administrator
3. Clicks "Edit Profile"
4. Changes name to "Super Admin"
5. Clicks "Save Changes"
6. Navbar now shows "Super Admin"

## Data Flow

### **Profile Load**:
```
1. User clicks Profile
2. Profile page loads
3. Gets user from localStorage
4. If faculty: Fetch staff profile from API
5. Display profile information
```

### **Profile Update**:
```
1. User edits fields
2. Clicks Save
3. Validate password (if changing)
4. Send PUT request to API
5. API updates database
6. Update localStorage
7. Refresh navbar
8. Show success message
```

### **Password Update**:
```
1. User enters new password
2. Confirms password
3. Validation checks
4. API updates password in:
   - User collection (for login)
   - Staff collection (for reference, if faculty)
5. Password changed
6. User can login with new password
```

## Security Features

✅ **Password validation**
- Minimum 6 characters
- Must match confirmation
- Optional (can skip if not changing)

✅ **Password not displayed**
- Never shown in UI
- Excluded from API responses
- Only updated when explicitly provided

✅ **Data synchronization**
- Faculty: Updates both Staff and User collections
- Ensures login credentials stay in sync

✅ **localStorage update**
- User info refreshed after update
- Navbar shows updated information immediately

## Files Created/Modified

### **Created**:
- `src/pages/Profile.tsx` - Profile page with view/edit functionality

### **Modified**:
- `src/components/layout/Navbar.tsx` - Dynamic user info, Profile menu option
- `backend/server.js` - Added PUT endpoints for user and staff updates
- `src/App.tsx` - Added Profile route

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/:id` | PUT | Update admin user profile |
| `/api/staff/:id` | PUT | Update faculty staff profile |
| `/api/faculty/profile/:userId` | GET | Get faculty profile by userId |

## Testing

### **Test as Admin**:
1. Login as admin (admin@akshara.com / admin)
2. Check navbar shows "Admin" and email
3. Click Profile → See admin info
4. Edit name to "Super Admin"
5. Save → Verify navbar updates
6. Change password
7. Logout and login with new password

### **Test as Faculty**:
1. Login as faculty
2. Check navbar shows faculty name and email
3. Click Profile → See full faculty info
4. Edit phone number
5. Save → Verify update
6. Change password
7. Logout and login with new password

## Features Summary

✅ **Dynamic navbar** - Shows user name, email, and initials
✅ **Profile menu** - Easy access from top-right dropdown
✅ **View profile** - See all user information
✅ **Edit profile** - Update name, email, phone
✅ **Change password** - Secure password update with validation
✅ **Role-specific** - Different fields for admin vs faculty
✅ **Real-time updates** - Navbar refreshes after save
✅ **Data sync** - Faculty updates sync to both Staff and User collections
✅ **Validation** - Password length and match validation
✅ **User feedback** - Toast notifications for success/errors

## Next Steps (Optional Enhancements)

1. **Profile Picture Upload**
   - Allow users to upload profile pictures
   - Store in cloud storage (e.g., Cloudinary)
   - Display in navbar and profile page

2. **Password Strength Indicator**
   - Show password strength meter
   - Require strong passwords

3. **Email Verification**
   - Send verification email when email is changed
   - Verify new email before updating

4. **Activity Log**
   - Show recent profile changes
   - Track when password was last changed

5. **Two-Factor Authentication**
   - Add 2FA for enhanced security
   - SMS or authenticator app

The profile system is now **complete and fully functional**! Users can view and edit their profiles with ease. 🎉
