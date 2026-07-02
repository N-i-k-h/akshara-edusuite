import { useState } from "react";
import { API_BASE_URL } from "@/config";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate("/");
      } else {
        toast.error(data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        "Unable to connect to server. Please ensure the server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* Left Column: College Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-tr from-emerald-950 via-emerald-800 to-green-900 text-white flex-col justify-between p-16 relative overflow-hidden">
        {/* Radial lights effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wide uppercase">SSSCP ERP</span>
        </div>

        {/* Center Content */}
        <div className="space-y-6 z-10 my-auto">
          <div className="inline-block bg-emerald-500/20 text-emerald-300 font-semibold text-xs px-3 py-1.5 rounded-full border border-emerald-500/30">
            Secure Administrative Portal
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            S.S.S. College of Pharmacy
          </h1>
          <p className="text-emerald-100/80 text-lg leading-relaxed max-w-md font-medium">
            Akshara Campus, Shivamogga. Enter the system to manage student lifecycles, register transactions, track courses, and generate certificates.
          </p>
        </div>

        {/* Footer */}
        <div className="z-10 text-emerald-200/50 text-sm">
          &copy; 2026 SSSCP College. All rights reserved.
        </div>
      </div>

      {/* Right Column: Login Form Container */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          {/* Mobile Header (Visible on mobile only) */}
          <div className="flex flex-col items-center text-center md:hidden mb-6">
            <img
              src="/ssscp_logo.png"
              alt="SSSCP Logo"
              className="h-16 w-auto object-contain mb-3 bg-slate-50 p-1.5 rounded-full border border-emerald-100"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/college_logo.png";
              }}
            />
            <h1 className="text-2xl font-bold text-emerald-950">
              S.S.S. College of Pharmacy
            </h1>
            <p className="text-sm text-slate-500">SSSCP ERP Login</p>
          </div>

          {/* Desktop SSSCP Logo Header */}
          <div className="hidden md:flex flex-col items-start mb-6">
            <img
              src="/ssscp_logo.png"
              alt="SSSCP Logo"
              className="h-20 w-auto object-contain mb-4 bg-slate-50 p-1 rounded-lg border border-emerald-500/10 shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/college_logo.png";
              }}
            />
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Sign In
            </h2>
            <p className="text-slate-500 mt-2">
              Enter your credentials to access your administrative dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@ssscp.com"
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-emerald-700 focus-visible:border-emerald-700 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-700 font-semibold">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-emerald-700 focus-visible:border-emerald-700 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold transition-all shadow-md shadow-emerald-800/10 text-sm tracking-wide uppercase"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  Authenticating...
                </>
              ) : (
                "Sign In to ERP"
              )}
            </Button>
          </form>

          {/* Mobile Footer */}
          <div className="block md:hidden text-center text-slate-400 text-xs mt-8">
            &copy; 2026 SSSCP College. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
