import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Use our mock auth service instead of Supabase
        const user = authService.getCurrentUser();
        if (!isMounted) return;
        
        const hasSession = Boolean(user);
        setIsAuthed(hasSession);
        setIsChecking(false);
        
        if (!hasSession) {
          navigate("/login", { replace: true });
        }
      } catch (e: any) {
        if (!isMounted) return;
        console.error("AuthGate session check exception:", e);
        setIsChecking(false);
        navigate("/login", { replace: true });
      }
    };

    // initial check
    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking session…</div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return <>{children}</>;
};

export default AuthGate;


