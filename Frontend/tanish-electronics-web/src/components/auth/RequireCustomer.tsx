import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCustomAuth } from "../../contexts/CustomAuthContext";

function RequireCustomer() {
  const { loading, isAuthenticated } = useCustomAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] dark:bg-[#11110f]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

export default RequireCustomer;
