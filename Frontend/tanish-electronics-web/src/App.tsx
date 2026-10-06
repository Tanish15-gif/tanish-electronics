import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import HomePage from "./Pages/HomePage";
import BookRepairPage from "./Pages/BookRepairPage";
import TrackRequestPage from "./Pages/TrackRequestPage";
import ProductsPage from "./Pages/ProductsPage";
import ProductDetailsPage from "./Pages/ProductDetailsPage";
import AdminServiceRequestsPage from "./Pages/admin/AdminServiceRequestsPage";
import AdminServiceRequestDetailsPage from "./Pages/admin/AdminServiceRequestDetailsPage";
import AdminEnquiriesPage from "./Pages/admin/AdminEnquiriesPage";
import AdminProductsPage from "./Pages/admin/AdminProductsPage";
import AdminCreateProductPage from "./Pages/admin/AdminCreateProductPage";
import AdminEditProductPage from "./Pages/admin/AdminEditProductPage";
import AdminDashboardPage from "./Pages/admin/AdminDashboardPage";
import AdminLayout from "./components/layout/AdminLayout";
import SignInPage from "./Pages/auth/SignInPage";
import SignUpPage from "./Pages/auth/SignUpPage";
import RequireAdmin from "./components/auth/RequireAdmin";
import RequireCustomer from "./components/auth/RequireCustomer";
import CustomerDashboardPage from "./Pages/customer/CustomerDashboardPage";
import CustomerLayout from "./components/layout/CustomerLayout";
import CustomerRepairsPage from "./Pages/customer/CustomerRepairsPage";
import CustomerEnquiriesPage from "./Pages/customer/CustomerEnquiriesPage";
import CustomerProfilePage from "./Pages/customer/CustomerProfilePage";
import CustomerRepairDetailsPage from "./Pages/customer/CustomerRepairDetailsPage";
import CustomerNotificationsPage from "./Pages/customer/CustomerNotificationsPage";
import AdminNotificationsPage from "./Pages/admin/AdminNotificationsPage";
import AdminEnquiryDetailsPage from "./Pages/admin/AdminEnquiryDetailsPage";
import AdminFeedbacksPage from "./Pages/admin/AdminFeedbacksPage";
import CustomerFeedbacksPage from "./Pages/customer/CustomerFeedbacksPage";
import AdminAnnouncementsPage from "./Pages/admin/AdminAnnouncementsPage";
import AdminSystemHealthPage from "./Pages/admin/AdminSystemHealthPage";
import ScrollToTop from "./components/UI/ScrollToTop";
import NotFoundPage from "./Pages/NotFoundPage";
import AdminAuditLogsPage from "./Pages/admin/AdminAuditLogsPage";
import AdminAnalyticsPage from "./Pages/admin/AdminAnalyticsPage";
import AdminSettingsPage from "./Pages/admin/AdminSettingsPage";
import ForgotPasswordPage from "./Pages/auth/ForgotPasswordPage";
import AdminAccountPage from "./Pages/admin/AdminAccountPage";
import AccountSecurityPage from "./Pages/account/AccountSecurityPage";
import SessionWatcher from "./components/auth/SessionWatcher";
import AdminUsersPage from "./Pages/admin/AdminUsersPage";
import AdminUserDetailsPage from "./Pages/admin/AdminUserDetailsPage";
import AdminChatLogsPage from "./Pages/admin/AdminChatLogsPage";
import AdminStoreKnowledgePage from "./Pages/admin/AdminStoreKnowledgePage";

function App() {
  return (
    <BrowserRouter>
      <SessionWatcher />
      <ScrollToTop />
      <Routes>
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/book-repair" element={<BookRepairPage />} />
          <Route path="/track-request" element={<TrackRequestPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
        </Route>
        <Route element={<RequireCustomer />}>
          <Route path="/customer" element={<CustomerLayout />}>
            <Route
              index
              element={<Navigate to="/customer/dashboard" replace />}
            />
            <Route path="dashboard" element={<CustomerDashboardPage />} />
            <Route path="repairs" element={<CustomerRepairsPage />} />
            <Route path="repairs/:id" element={<CustomerRepairDetailsPage />} />
            <Route path="feedbacks" element={<CustomerFeedbacksPage />} />
            <Route path="enquiries" element={<CustomerEnquiriesPage />} />
            <Route path="security" element={<AccountSecurityPage />} />
            <Route
              path="notifications"
              element={<CustomerNotificationsPage />}
            />
            <Route path="profile" element={<CustomerProfilePage />} />
          </Route>
        </Route>
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/account" element={<AdminAccountPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route
              path="/admin/users/:appUserId"
              element={<AdminUserDetailsPage />}
            />
            <Route path="/admin/chat-logs" element={<AdminChatLogsPage />} />
            <Route path="/admin/security" element={<AccountSecurityPage />} />

            <Route
              path="/admin/notifications"
              element={<AdminNotificationsPage />}
            />
            <Route
              path="/admin/service-requests"
              element={<AdminServiceRequestsPage />}
            />
            <Route
              path="/admin/service-requests/:id"
              element={<AdminServiceRequestDetailsPage />}
            />
            <Route path="/admin/enquiries" element={<AdminEnquiriesPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route
              path="/admin/products/new"
              element={<AdminCreateProductPage />}
            />
            <Route
              path="/admin/products/:id/edit"
              element={<AdminEditProductPage />}
            />
            <Route
              path="/admin/enquiries/:id"
              element={<AdminEnquiryDetailsPage />}
            />
            <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
            <Route
              path="/admin/announcements"
              element={<AdminAnnouncementsPage />}
            />
            <Route
              path="/admin/store-knowledge"
              element={<AdminStoreKnowledgePage />}
            />

            <Route
              path="/admin/system-health"
              element={<AdminSystemHealthPage />}
            />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
