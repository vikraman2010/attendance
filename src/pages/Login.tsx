import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const useSession = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  return { data: user };
};

const Login = () => {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("psnapsna");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const emailDomain = "psnacet.edu.in";
    const isValidDomain = /.+@psnacet\.edu\.in$/i.test(email);
    if (!isValidDomain) {
      setLoading(false);
      setError(`Email must be in the format name@${emailDomain}`);
      return;
    }
    
    if (password !== "psnapsna") {
      setLoading(false);
      setError("Password must be: psnapsna");
      return;
    }

    try {
      const { user, error: authError } = await authService.signIn(email, password);
      
      if (authError) {
        // If user doesn't exist, try to create account automatically
        const { user: newUser, error: signUpError } = await authService.signUp(email, password, email.split('@')[0]);
        
        if (signUpError) {
          setLoading(false);
          setError(signUpError);
          return;
        }
        
        if (newUser) {
          setLoading(false);
          navigate("/", { replace: true });
          return;
        }
      }
      
      if (user) {
        setLoading(false);
        navigate("/", { replace: true });
      }
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-muted-foreground">Password must be <span className="font-mono">psnapsna</span></p>
            </div>
            {error && (
              <div className="text-sm text-red-600" role="alert">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;


