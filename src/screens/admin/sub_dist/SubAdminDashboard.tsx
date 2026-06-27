import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { LogOut, Home, Building2, CheckSquare, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Campaigns from '../shared/Campaigns';

function SubAdminReports() {
  const [data, setData] = useState<any[]>([]);
  const [schemeData, setSchemeData] = useState<any[]>([]);
  const [allApps, setAllApps] = useState<any[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      const snap = await getDocs(collection(db, 'scheme_applications'));
      const apps = snap.docs.map(d => d.data());
      setAllApps(apps);

      const statusCounts = apps.reduce((acc, curr) => {
        const s = curr.status;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as any);
      
      setData([
        { name: 'Pending', count: statusCounts['pending'] || 0 },
        { name: 'Approved', count: statusCounts['approved'] || 0 },
        { name: 'Rejected', count: statusCounts['rejected'] || 0 },
      ]);

      // Join with scheme names
      const sSnap = await getDocs(collection(db, 'schemes'));
      const schemesMap = new Map();
      sSnap.docs.forEach(d => schemesMap.set(d.id, d.data().title));

      const schemeCounts = apps.reduce((acc, curr) => {
        const sName = schemesMap.get(curr.schemeId) || 'Unknown';
        acc[sName] = (acc[sName] || 0) + 1;
        return acc;
      }, {} as any);

      const sDataArray = Object.keys(schemeCounts).map(key => ({
        name: key,
        count: schemeCounts[key]
      }));

      setSchemeData(sDataArray);
      if (sDataArray.length > 0) {
        setSelectedScheme(sDataArray[0].name);
      }
    };
    fetchReport();
  }, []);

  useEffect(() => {
    if (!selectedScheme || allApps.length === 0) return;
    
    const fetchTrend = async () => {
      const sSnap = await getDocs(collection(db, 'schemes'));
      const schemesMap = new Map();
      sSnap.docs.forEach(d => schemesMap.set(d.id, d.data().title));

      const filteredApps = allApps.filter(a => (schemesMap.get(a.schemeId) || 'Unknown') === selectedScheme);
      
      const dateCounts = filteredApps.reduce((acc, curr) => {
        const dateStr = curr.appliedAt 
          ? new Date(curr.appliedAt).toLocaleDateString()
          : new Date().toLocaleDateString();
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      }, {} as any);
      
      const trends = Object.keys(dateCounts).map(date => ({
        date,
        count: dateCounts[date]
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setTrendData(trends);
    };
    fetchTrend();
  }, [selectedScheme, allApps]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <h2 className="text-xl font-bold mb-6">Local Scheme Analytics</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <h2 className="text-xl font-bold mb-6">Applications per Scheme</h2>
        <div className="h-80 w-full">
          {schemeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schemeData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500">No data available.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Scheme Application Trend</h2>
          <select 
            value={selectedScheme} 
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {schemeData.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="h-80 w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={3} dot={{r: 4, fill: '#0d9488'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500">No trend data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}



function SubAdminHome() {
  const [diseaseData, setDiseaseData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      const snap = await getDocs(collection(db, 'patients'));
      const patients = snap.docs.map(d => d.data());
      
      const counts = patients.reduce((acc, curr) => {
        const d = curr.diagnosis || 'Unknown';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as any);

      const dataArray = Object.keys(counts).map(key => ({
        name: key,
        count: counts[key]
      }));

      setDiseaseData(dataArray);
    };
    fetchPatientData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Sub-District Analytics</h1>
      
      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <h2 className="text-xl font-bold mb-6">Patient Disease Frequency</h2>
        <div className="h-80 w-full">
          {diseaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500">No patient data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthHospitals() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [emailStatus, setEmailStatus] = useState('');
  
  useEffect(() => {
    const fetchHospitals = async () => {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      const h = snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(u => u.role === 'hospital');
      setHospitals(h);
    };
    fetchHospitals();
  }, []);

  const toggleApproval = async (id: string, current: boolean, email?: string) => {
    await updateDoc(doc(db, 'users', id), { isApproved: !current });
    setHospitals(hospitals.map(h => h.id === id ? { ...h, isApproved: !current } : h));
    
    if (!current && email) {
      setEmailStatus(`Simulating SendGrid Email sent to ${email} for hospital approval...`);
      setTimeout(() => setEmailStatus(''), 5000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-bold mb-4">Authenticate Hospitals</h2>
      {emailStatus && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 text-sm">
          {emailStatus}
        </div>
      )}
      <div className="space-y-4">
        {hospitals.map(h => (
          <div key={h.id} className="flex justify-between items-center p-4 border rounded-lg">
            <div>
              <p className="font-bold">{h.name}</p>
              <p className="text-sm text-slate-500">{h.district} • {h.email}</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => alert('Simulating Certificate View')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">Certificate</button>
              <button onClick={() => toggleApproval(h.id, !!h.isApproved, h.email)} className={`px-4 py-2 rounded-lg font-medium text-sm ${h.isApproved ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {h.isApproved ? 'Revoke Access' : 'Approve Hospital'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthApplyScheme() {
  const [apps, setApps] = useState<any[]>([]);
  const [smsStatus, setSmsStatus] = useState('');

  useEffect(() => {
    const fetchApps = async () => {
      const snap = await getDocs(collection(db, 'scheme_applications'));
      setApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchApps();
  }, []);

  const updateStatus = async (id: string, status: string, patientId: string) => {
    await updateDoc(doc(db, 'scheme_applications', id), { status, updatedAt: Date.now() });
    setApps(apps.map(a => a.id === id ? { ...a, status } : a));

    if (status === 'approved') {
      setSmsStatus(`Simulating Twilio SMS sent to patient (${patientId}) for scheme approval...`);
      setTimeout(() => setSmsStatus(''), 5000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-xl font-bold mb-4">Scheme Applications Review</h2>
      {smsStatus && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-4 text-sm">
          {smsStatus}
        </div>
      )}
      <div className="space-y-4">
        {apps.filter(a => a.status === 'pending').map(a => (
          <div key={a.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg bg-amber-50 gap-4">
            <div>
              <p className="font-bold text-slate-800">Application ID: {a.id}</p>
              <p className="text-sm text-slate-600 mb-2">Patient ID: {a.patientId}</p>
              <div className="flex space-x-2">
                <button onClick={() => alert(`Simulating Income Certificate View: ${a.incomeCertificateUrl || 'Not uploaded'}`)} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-50">View Income Certificate</button>
                <button onClick={() => alert(`Simulating Bill View: ${a.billUrl || 'Not uploaded'}`)} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600 hover:bg-slate-50">View Bill</button>
              </div>
            </div>
            <div className="space-x-3 flex">
              <button onClick={() => updateStatus(a.id, 'approved', a.patientId)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium whitespace-nowrap">Approve</button>
              <button onClick={() => updateStatus(a.id, 'rejected', a.patientId)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium whitespace-nowrap">Reject</button>
            </div>
          </div>
        ))}
        {apps.filter(a => a.status === 'pending').length === 0 && <p className="text-slate-500">No pending applications.</p>}
      </div>
    </div>
  );
}

export default function SubAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/sub', label: 'Dashboard', icon: Home },
    { path: '/admin/sub/hospitals', label: 'Auth Hospitals', icon: Building2 },
    { path: '/admin/sub/schemes', label: 'Auth Schemes', icon: CheckSquare },
    { path: '/admin/sub/reports', label: 'Reports', icon: BarChart3 },
    { path: '/admin/sub/campaigns', label: 'Campaigns', icon: Target },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Sub-District Admin</h2>
          <p className="text-sm text-slate-500">{profile?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600'}`}>
                <Icon size={20} /><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleSignOut} className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut size={20} /><span>Sign Out</span></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<SubAdminHome />} />
          <Route path="/hospitals" element={<AuthHospitals />} />
          <Route path="/schemes" element={<AuthApplyScheme />} />
          <Route path="/reports" element={<SubAdminReports />} />
          <Route path="/campaigns" element={<Campaigns />} />
        </Routes>
      </div>
    </div>
  );
}
