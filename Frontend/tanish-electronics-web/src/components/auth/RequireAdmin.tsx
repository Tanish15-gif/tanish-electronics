import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentAuthUser } from "../../Services/authService";

type AccessStatus = "checking" | "allowed" | "denied" | "signedOut" | "sync";

function RequireAdmin() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [status, setStatus] = useState<AccessStatus>("checking");

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAccess() {
      try {
        if (!isLoaded) {
          return;
        }

        setStatus("checking");

        if (!isSignedIn) {
          if (isMounted) {
            setStatus("signedOut");
          }
          return;
        }

        const token = await getToken();

        if (!token) {
          if (isMounted) {
            setStatus("signedOut");
          }
          return;
        }

        const user = await getCurrentAuthUser(token);

        if (!isMounted) {
          return;
        }

        if (user.isAdmin) {
          setStatus("allowed");
        } else {
          setStatus("denied");
        }
      } catch (error) {
        console.error("RequireAdmin error:", error);

        if (isMounted) {
          setStatus("sync");
        }
      }
    }

    checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, getToken]);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] dark:bg-[#11110f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
      </main>
    );
  }

  if (status === "signedOut") {
    return <Navigate to="/sign-in" replace />;
  }

  if (status === "sync") {
    return <Navigate to="/auth/redirect" replace />;
  }

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RequireAdmin;
