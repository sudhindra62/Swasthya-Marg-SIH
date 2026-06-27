import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Home, UserPlus, FileText, HelpCircle, Search } from 'lucide-react';
import HospitalHome from './HospitalHome';
import AddPatient from './AddPatient';
import ApplyScheme from './ApplyScheme';
import Enquiry from './Enquiry';
import PatientSearch from './PatientSearch';

export default function HospitalDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/hospital', label: 'Dashboard', icon: Home },
    { path: '/hospital/add-patient', label: 'Add Patient', icon: UserPlus },
    { path: '/hospital/patient-search', label: 'Patient Enquiry', icon: Search },
    { path: '/hospital/apply-scheme', label: 'Apply Scheme', icon: FileText },
    { path: '/hospital/enquiry', label: 'Applications Status', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">SwasthaPath</h2>
          <p className="text-sm text-slate-500 truncate mt-1">{profile?.name || 'Hospital'}</p>
          {!profile?.isApproved && (
            <span className="inline-block mt-2 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded">Pending Approval</span>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-700' : 'text-slate-400'} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {!profile?.isApproved ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6">
            Your hospital account is currently pending approval by the Sub-District Admin. Some features may be restricted.
          </div>
        ) : null}
        <Routes>
          <Route path="/" element={<HospitalHome />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/patient-search" element={<PatientSearch />} />
          <Route path="/apply-scheme" element={<ApplyScheme />} />
          <Route path="/enquiry" element={<Enquiry />} />
        </Routes>
      </div>
    </div>
  );
}
