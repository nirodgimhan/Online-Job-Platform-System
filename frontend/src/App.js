import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Provider
import { AuthProvider } from './Components/context/AuthContext';

// Layout Components
import Navbar from './Components/Navbar';
import Sidebar from './Components/Sidebar';
import Home from './Components/Home';
import AboutUs from './Components/AboutUs';
import Services from './Components/Services';
import ContactUs from './Components/ContactUs';
import Login from './Components/Login';
import Register from './Components/Register';
import Dashboard from './Components/Dashboard';
import ProtectedRoute from './Components/ProtectedRoute';

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
import VerificationRequests from './Components/admin/VerificationRequests';
import AdminReports from './Components/admin/AdminReports';
import AdminContactMessages from './Components/admin/AdminContactMessages';

// ========== Layout for Authenticated Users ==========
// This layout includes Sidebar + main content area with centered container
const AuthenticatedLayout = () => {
  return (
    <div className="app-authenticated-layout">
      <Sidebar />
      <div className="app-main-wrapper">
        <div className="app-main-container">
          <Outlet />  {/* Nested routes will render here */}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />  {/* Fixed at top, always visible */}

          <Routes>
            {/* Public Routes – No Sidebar */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public Job Search Routes */}
            <Route path="/jobs" element={<JobSearch />} />
            <Route path="/job/:id" element={<JobDetails />} />

            {/* ========== Protected Routes with Sidebar ========== */}
            <Route element={<ProtectedRoute />}> {/* Generic auth check */}
              <Route element={<AuthenticatedLayout />}>
                {/* Student Routes */}
                <Route path="/student">
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="jobs" element={<JobSearch />} />
                  <Route path="job/:id" element={<JobDetails />} />
                  <Route path="applied-jobs" element={<AppliedJobs />} />
                  <Route path="saved-jobs" element={<SavedJobs />} />
                  <Route path="cv-manager" element={<CvManager />} />
                  <Route path="interviews" element={<StudentInterviews />} />
                </Route>

                {/* Company Routes */}
                <Route path="/company">
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="profile" element={<CompanyProfile />} />
                  <Route path="post-job" element={<PostJob />} />
                  <Route path="manage-jobs" element={<ManageJobs />} />
                  <Route path="applicants" element={<ApplicantsList />} />
                  <Route path="applicant/:id" element={<ApplicantDetails />} />
                  <Route path="edit-job/:id" element={<EditJob />} />
                  <Route path="interviews" element={<CompanyInterviews />} />
                  <Route path="confirmed-interviews" element={<CompanyConfirmedInterviews />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin">
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="profile" element={<AdminProfile />} />
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="companies" element={<ManageCompanies />} />
                  <Route path="verifications" element={<VerificationRequests />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="contact-messages" element={<AdminContactMessages />} />
                  
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

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