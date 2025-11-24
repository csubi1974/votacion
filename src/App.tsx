import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import AdminLayout from "@/pages/AdminLayout";
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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voting"
            element={
              <ProtectedRoute>
                <VotingInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <ResultsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute>
                <ElectionResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
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
