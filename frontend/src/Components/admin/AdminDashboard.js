import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaBuilding, FaBriefcase, FaChartLine } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // You'll need to create these API endpoints
      const usersRes = await axios.get('http://localhost:5000/api/users');
      const companiesRes = await axios.get('http://localhost:5000/api/companies');
      const jobsRes = await axios.get('http://localhost:5000/api/jobs');
      
      setStats({
        totalUsers: usersRes.data.count || 0,
        totalCompanies: companiesRes.data.count || 0,
        totalJobs: jobsRes.data.total || 0,
        totalApplications: 0 // You'll need to add this endpoint
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h2 className="mb-4">Welcome, {user?.name} (Admin)</h2>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Users</h6>
                  <h2 className="mb-0">{stats.totalUsers}</h2>
                </div>
                <FaUsers size={40} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-success">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Companies</h6>
                  <h2 className="mb-0">{stats.totalCompanies}</h2>
                </div>
                <FaBuilding size={40} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-info">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Active Jobs</h6>
                  <h2 className="mb-0">{stats.totalJobs}</h2>
                </div>
                <FaBriefcase size={40} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Applications</h6>
                  <h2 className="mb-0">{stats.totalApplications}</h2>
                </div>
                <FaChartLine size={40} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/admin/users" className="btn btn-outline-primary">
                  <FaUsers className="me-2" />Manage Users
                </Link>
                <Link to="/admin/companies" className="btn btn-outline-primary">
                  <FaBuilding className="me-2" />Manage Companies
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              <p className="text-muted">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;