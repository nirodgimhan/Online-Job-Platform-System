import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Provider
import { AuthProvider } from './Components/context/AuthContext';

// Layout Components
import Navbar from './Components/Navbar';
import Home from './Components/Home';
import AboutUs from './Components/AboutUs';
import Services from './Components/Services';
import Featured from './Components/Featured';
import ContactUs from './Components/ContactUs';
import Login from './Components/Login';
import Register from './Components/Register';
import Dashboard from './Components/Dashboard';
import ProtectedRoute from './Components/ProtectedRoute';
import Sidebar from './Components/Sidebar';

// Public Job Search Components
import JobSearch from './Components/student/JobSearch';
import JobDetails from './Components/student/JobDetails';

// Student Components
import StudentProfile from './Components/student/StudentProfile';
import AppliedJobs from './Components/student/AppliedJobs';
import SavedJobs from './Components/student/SavedJobs';
import CvManager from './Components/student/CvManager';
import StudentInterviews from './Components/student/StudentInterviews';

// Company Components
import CompanyProfile from './Components/company/CompanyProfile';
import PostJob from './Components/company/PostJob';
import ManageJobs from './Components/company/ManageJobs';
import ApplicantsList from './Components/company/ApplicantsList';
import ApplicantDetails from './Components/company/ApplicantDetails';
import EditJob from './Components/company/EditJob';
import CompanyInterviews from './Components/company/CompanyInterviews';
import CompanyConfirmedInterviews from './Components/company/CompanyConfirmedInterviews';

// Admin Components
import AdminDashboard from './Components/admin/AdminDashboard';
import ManageUsers from './Components/admin/ManageUsers';
import ManageCompanies from './Components/admin/ManageCompanies';
import AdminProfile from './Components/admin/AdminProfile';
import VerificationRequests from './Components/admin/VerificationRequests'; // ✅ New
import AdminReports from './Components/admin/AdminReports'; // ✅ New

// Wrapper component to apply Sidebar to protected routes
const DashboardPage = ({ children }) => {
  return <Sidebar>{children}</Sidebar>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="app-container">
            <Routes>
              {/* Public Routes - No Sidebar Required */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/services" element={<Services />} />
              <Route path="/featured" element={<Featured />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Public Job Search Routes - Accessible to Everyone */}
              <Route path="/jobs" element={<JobSearch />} />
              <Route path="/job/:id" element={<JobDetails />} />

              {/* Student Routes with Sidebar (Requires Authentication) */}
              <Route path="/student" element={<ProtectedRoute role="student" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={
                  <DashboardPage>
                    <Dashboard />
                  </DashboardPage>
                } />
                <Route path="profile" element={
                  <DashboardPage>
                    <StudentProfile />
                  </DashboardPage>
                } />
                <Route path="jobs" element={
                  <DashboardPage>
                    <JobSearch />
                  </DashboardPage>
                } />
                <Route path="job/:id" element={
                  <DashboardPage>
                    <JobDetails />
                  </DashboardPage>
                } />
                <Route path="applied-jobs" element={
                  <DashboardPage>
                    <AppliedJobs />
                  </DashboardPage>
                } />
                <Route path="saved-jobs" element={
                  <DashboardPage>
                    <SavedJobs />
                  </DashboardPage>
                } />
                <Route path="cv-manager" element={
                  <DashboardPage>
                    <CvManager />
                  </DashboardPage>
                } />
                <Route path="interviews" element={
                  <DashboardPage>
                    <StudentInterviews />
                  </DashboardPage>
                } />
              </Route>

              {/* Company Routes with Sidebar (Requires Authentication) */}
              <Route path="/company" element={<ProtectedRoute role="company" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={
                  <DashboardPage>
                    <Dashboard />
                  </DashboardPage>
                } />
                <Route path="profile" element={
                  <DashboardPage>
                    <CompanyProfile />
                  </DashboardPage>
                } />
                <Route path="post-job" element={
                  <DashboardPage>
                    <PostJob />
                  </DashboardPage>
                } />
                <Route path="manage-jobs" element={
                  <DashboardPage>
                    <ManageJobs />
                  </DashboardPage>
                } />
                <Route path="applicants" element={
                  <DashboardPage>
                    <ApplicantsList />
                  </DashboardPage>
                } />
                <Route path="applicant/:id" element={
                  <DashboardPage>
                    <ApplicantDetails />
                  </DashboardPage>
                } />
                <Route path="edit-job/:id" element={
                  <DashboardPage>
                    <EditJob />
                  </DashboardPage>
                } />
                <Route path="interviews" element={
                  <DashboardPage>
                    <CompanyInterviews />
                  </DashboardPage>
                } />
                <Route path="confirmed-interviews" element={
                  <DashboardPage>
                    <CompanyConfirmedInterviews />
                  </DashboardPage>
                } />
              </Route>

              {/* Admin Routes with Sidebar (Requires Authentication) */}
              <Route path="/admin" element={<ProtectedRoute role="admin" />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={
                  <DashboardPage>
                    <AdminDashboard />
                  </DashboardPage>
                } />
                <Route path="profile" element={
                  <DashboardPage>
                    <AdminProfile />
                  </DashboardPage>
                } />
                <Route path="users" element={
                  <DashboardPage>
                    <ManageUsers />
                  </DashboardPage>
                } />
                <Route path="companies" element={
                  <DashboardPage>
                    <ManageCompanies />
                  </DashboardPage>
                } />
                <Route path="verifications" element={
                  <DashboardPage>
                    <VerificationRequests />
                  </DashboardPage>
                } />
                <Route path="reports" element={
                  <DashboardPage>
                    <AdminReports />
                  </DashboardPage>
                } />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;