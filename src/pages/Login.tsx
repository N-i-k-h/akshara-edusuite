import { useState } from "react";
import { API_BASE_URL } from "@/config";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Lock, Mail, Loader2 } from "lucide-react";
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
            const response = await fetch('${API_BASE_URL}/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("user", JSON.stringify(data.user));
                toast.success(`Welcome back, ${data.user.name}!`);
                navigate("/");
            } else {
                toast.error(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            // Fallback for demo purposes if backend isn't running
            if (email === "admin@akshara.com" && password === "admin") {
                toast.warning("Backend unavailable. Logging in with demo credentials.");
                localStorage.setItem("isAuthenticated", "true");
                navigate("/");
            } else {
                toast.error("Unable to connect to server. Please ensure backend is running.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Abstract background shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px]" />
            </div>

            <Card className="w-full max-w-md mx-4 border-white/10 bg-white/10 backdrop-blur-md shadow-2xl relative z-10 animate-fade-in-up">
                <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
                    <div className="h-12 w-12 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">Akshara EduSuite</CardTitle>
                    <CardDescription className="text-slate-300">
                        Enter your credentials to access the portal
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-200">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@akshara.com"
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-200">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400/20"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg shadow-blue-500/25 border-none"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <div className="absolute bottom-4 text-slate-500 text-sm">
                © 2026 Akshara Educational Institutions
            </div>
        </div>
    );
};

export default Login;
