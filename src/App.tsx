import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import Dashboard from "@/pages/Dashboard";
import AdminDashboardPage from "@/pages/AdminDashboard";
import AdminUsersPage from "@/pages/AdminUsers";
import AdminElectionsPage from "@/pages/AdminElections";
import AdminElectionForm from "@/pages/AdminElectionForm";
import ElectionResultsPage from "@/pages/ElectionResults";
import VotingInterface from "@/pages/VotingInterface";
import AuditLogsPage from "@/pages/AuditLogs";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import UserProfile from "@/pages/UserProfile";
import BulkImport from "@/pages/BulkImport";
import AdminUserForm from "@/pages/AdminUserForm";
import ResultsList from "@/pages/ResultsList";
import VoterRegistry from "@/pages/VoterRegistry";
import AdminOrganizations from "@/pages/AdminOrganizations";
import AdminOrganizationForm from "@/pages/AdminOrganizationForm";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes with MainLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Voting */}
            <Route path="voting" element={<VotingInterface />} />

            {/* Results */}
            <Route path="results" element={<ResultsList />} />
            <Route path="results/:id" element={<ElectionResultsPage />} />

            {/* Profile */}
            <Route path="profile" element={<UserProfile />} />

            {/* Admin routes */}
            <Route path="admin">
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/new" element={<AdminUserForm />} />
              <Route path="users/:id/edit" element={<AdminUserForm />} />
              <Route path="bulk-import" element={<BulkImport />} />
              <Route path="elections" element={<AdminElectionsPage />} />
              <Route path="elections/new" element={<AdminElectionForm />} />
              <Route path="elections/:id" element={<ElectionResultsPage />} />
              <Route path="elections/:id/edit" element={<AdminElectionForm />} />
              <Route path="elections/:id/results" element={<ElectionResultsPage />} />
              <Route path="elections/:id/voters" element={<VoterRegistry />} />
              <Route path="organizations" element={<AdminOrganizations />} />
              <Route path="organizations/new" element={<AdminOrganizationForm />} />
              <Route path="organizations/:id" element={<AdminOrganizationForm />} />
              <Route path="audit" element={<AuditLogsPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        duration={4000}
      />
    </>
  );
}
