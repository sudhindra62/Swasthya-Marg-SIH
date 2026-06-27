import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { LogOut, Home, Megaphone, BellRing, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Campaigns from '../shared/Campaigns';
import Alerts from '../shared/Alerts';

function DistAdminReports() {
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
        <h2 className="text-xl font-bold mb-6">Regional Scheme Analytics</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
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
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
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
            className="border rounded-lg px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
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

function DistAdminHome() {
  const [diseaseData, setDiseaseData] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      const snap = await getDocs(collection(db, 'patients'));
      const patients = snap.docs.map(d => d.data());
      setAllPatients(patients);
      
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
      if (dataArray.length > 0) {
        setSelectedDisease(dataArray[0].name);
      }
    };
    fetchPatientData();
  }, []);

  useEffect(() => {
    if (!selectedDisease || allPatients.length === 0) return;
    
    const diseasePatients = allPatients.filter(p => (p.diagnosis || 'Unknown') === selectedDisease);
    const dateCounts = diseasePatients.reduce((acc, curr) => {
      const dateStr = curr.createdAt 
        ? new Date(curr.createdAt).toLocaleDateString()
        : new Date().toLocaleDateString();
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {} as any);
    
    const trends = Object.keys(dateCounts).map(date => ({
      date,
      count: dateCounts[date]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTrendData(trends);
  }, [selectedDisease, allPatients]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">District/State Administration</h2>
      
      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <h2 className="text-xl font-bold mb-6">Regional Disease Distribution</h2>
        <div className="h-80 w-full">
          {diseaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500">No patient data available.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Disease Trend</h2>
          <select 
            value={selectedDisease} 
            onChange={(e) => setSelectedDisease(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {diseaseData.map(d => (
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
                <Line type="monotone" dataKey="count" stroke="#e11d48" strokeWidth={3} dot={{r: 4, fill: '#e11d48'}} activeDot={{r: 6}} />
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

export default function DistAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin/dist', label: 'Dashboard', icon: Home },
    { path: '/admin/dist/campaigns', label: 'Campaigns', icon: Megaphone },
    { path: '/admin/dist/alerts', label: 'Broadcasts', icon: BellRing },
    { path: '/admin/dist/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-800">
          <h2 className="text-xl font-bold">District Admin</h2>
          <p className="text-sm text-indigo-300">{profile?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'}`}>
                <Icon size={20} /><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button onClick={() => { signOut(); navigate('/admin/login'); }} className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-indigo-200 hover:bg-red-500 hover:text-white"><LogOut size={20} /><span>Sign Out</span></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<DistAdminHome />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<DistAdminReports />} />
        </Routes>
      </div>
    </div>
  );
}
