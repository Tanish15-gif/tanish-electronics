import { Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import FloatingWhatsApp from "../common/FloatingWhatsApp";
import SignInExperienceModal from "../common/SignInExperienceModal";
import { useWebsiteVisitTracker } from "../../hooks/useWebsiteVisitTracker";

function PublicLayout() {
  useWebsiteVisitTracker();
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <PublicNavbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
      <FloatingWhatsApp />
      <SignInExperienceModal />
    </div>
  );
}

export default PublicLayout;
