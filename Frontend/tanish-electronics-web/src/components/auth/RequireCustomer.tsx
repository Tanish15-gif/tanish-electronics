import { useAuth } from "@clerk/clerk-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function RequireCustomer() {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] dark:bg-[#11110f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate
        to={`/sign-in?redirect_url=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  return <Outlet />;
}

export default RequireCustomer;
