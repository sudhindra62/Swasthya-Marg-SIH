import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { LogOut, Home, PlusCircle, LayoutDashboard, Image as ImageIcon, BarChart3, Target, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Campaigns from '../shared/Campaigns';

function SuperAdminBanners() {
  const [formData, setFormData] = useState({ title: '', imageUrl: '' });
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      const bSnap = await getDocs(collection(db, 'banners'));
      setBanners(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchBanners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'banners'), { ...formData, createdAt: Date.now() });
      setBanners([...banners, { id: docRef.id, ...formData, createdAt: Date.now() }]);
      setFormData({ title: '', imageUrl: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      try {
        await deleteDoc(doc(db, 'banners', id));
        setBanners(banners.filter(b => b.id !== id));
      } catch (err) {
        console.error("Error deleting banner:", err);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-6">Upload Banner</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Banner Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input type="url" required value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium">{loading ? 'Uploading...' : 'Add Banner'}</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4">Active Banners</h2>
        <div className="grid grid-cols-2 gap-4">
          {banners.map(b => (
            <div key={b.id} className="border rounded-lg overflow-hidden relative group">
              <img src={b.imageUrl} alt={b.title} className="w-full h-32 object-cover bg-slate-100" />
              <button 
                onClick={() => handleDelete(b.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Banner"
              >
                <Trash2 size={16} />
              </button>
              <div className="p-3 bg-slate-50"><p className="font-medium text-sm truncate">{b.title}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuperAdminReports() {
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

      const counts = apps.reduce((acc, curr) => {
        const s = curr.status;
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as any);
      
      setData([
        { name: 'Pending', count: counts['pending'] || 0 },
        { name: 'Approved', count: counts['approved'] || 0 },
        { name: 'Rejected', count: counts['rejected'] || 0 },
      ]);

      const schemeCounts = apps.reduce((acc, curr) => {
        const s = curr.schemeId;
        if(s) acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as any);
      
      const schemeSnap = await getDocs(collection(db, 'schemes'));
      const schemeMap: Record<string, string> = {};
      schemeSnap.docs.forEach(d => {
        schemeMap[d.id] = d.data().title;
      });

      const dataArray = Object.keys(schemeCounts).map(key => ({
        name: schemeMap[key] || key,
        count: schemeCounts[key]
      }));
      setSchemeData(dataArray);
      
      if (dataArray.length > 0) {
        setSelectedScheme(dataArray[0].name);
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
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <h2 className="text-xl font-bold mb-6">Scheme Application Status</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="count" fill="#9333ea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <h2 className="text-xl font-bold mb-6">Scheme Popularity (Distribution)</h2>
        <div className="h-80 w-full">
          {schemeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schemeData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500">No application data available.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Scheme Application Trend</h2>
          <select 
            value={selectedScheme} 
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} activeDot={{r: 6}} />
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

function AddScheme() {
  const [formData, setFormData] = useState({ title: '', description: '', eligibility: '', benefits: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [smsStatus, setSmsStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSmsStatus('');
    try {
      await addDoc(collection(db, 'schemes'), { ...formData, createdAt: Date.now() });
      setSuccess('Scheme created successfully!');
      
      // Fetch patients and simulate sending SMS
      setSmsStatus('Fetching patients to send notifications...');
      const patientsSnap = await getDocs(collection(db, 'patients'));
      const patientsCount = patientsSnap.size;
      
      if (patientsCount > 0) {
        setSmsStatus(`Simulating Twilio SMS sending to ${patientsCount} patients...`);
        // Simulate delay for Twilio API calls
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSmsStatus(`SMS successfully sent to ${patientsCount} registered patients.`);
      } else {
        setSmsStatus('No patients found to notify.');
      }

      setFormData({ title: '', description: '', eligibility: '', benefits: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Create New Health Scheme</h2>
      {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">{success}</div>}
      {smsStatus && <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6 text-sm">{smsStatus}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Scheme Title</label>
          <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={3}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Eligibility Criteria</label>
          <textarea required value={formData.eligibility} onChange={e => setFormData({...formData, eligibility: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={2}></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Benefits</label>
          <textarea required value={formData.benefits} onChange={e => setFormData({...formData, benefits: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={2}></textarea>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium">{loading ? 'Creating...' : 'Create Scheme'}</button>
      </form>
    </div>
  );
}

function SuperAdminHome() {
  const [stats, setStats] = useState({ hospitals: 0, patients: 0, schemes: 0 });
  const [diseaseData, setDiseaseData] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const uSnap = await getDocs(collection(db, 'users'));
      const pSnap = await getDocs(collection(db, 'patients'));
      const sSnap = await getDocs(collection(db, 'schemes'));
      setStats({
        hospitals: uSnap.docs.filter(d => d.data().role === 'hospital').length,
        patients: pSnap.size,
        schemes: sSnap.size
      });

      const patients = pSnap.docs.map(d => d.data());
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
    fetchStats();
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Global Platform Statistics</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Total Hospitals</p>
            <p className="text-3xl font-bold mt-2">{stats.hospitals}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Total Patients</p>
            <p className="text-3xl font-bold mt-2">{stats.patients}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <p className="text-sm text-slate-500 font-medium">Active Schemes</p>
            <p className="text-3xl font-bold mt-2">{stats.schemes}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <h2 className="text-xl font-bold mb-6">Global Disease Distribution</h2>
        <div className="h-80 w-full">
          {diseaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-500">No patient data available.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Global Disease Trend</h2>
          <select 
            value={selectedDisease} 
            onChange={(e) => setSelectedDisease(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <Line type="monotone" dataKey="count" stroke="#9333ea" strokeWidth={3} dot={{r: 4, fill: '#9333ea'}} activeDot={{r: 6}} />
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

export default function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/admin/super', label: 'Dashboard', icon: Home },
    { path: '/admin/super/add-scheme', label: 'Add Scheme', icon: PlusCircle },
    { path: '/admin/super/banners', label: 'Banners', icon: ImageIcon },
    { path: '/admin/super/campaigns', label: 'Campaigns', icon: Target },
    { path: '/admin/super/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold">Super Admin</h2>
          <p className="text-sm text-slate-400">{profile?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${isActive ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <Icon size={20} /><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { signOut(); navigate('/admin/login'); }} className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:bg-red-500 hover:text-white"><LogOut size={20} /><span>Sign Out</span></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<SuperAdminHome />} />
          <Route path="/add-scheme" element={<AddScheme />} />
          <Route path="/banners" element={<SuperAdminBanners />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/reports" element={<SuperAdminReports />} />
        </Routes>
      </div>
    </div>
  );
}
