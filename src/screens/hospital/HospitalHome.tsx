import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Patient, SchemeApplication, Alert, Scheme, Banner } from '../../types';
import { Users, FileText, CheckCircle, Clock, Bell, Info, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HospitalHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, totalApplications: 0, pendingApplications: 0, approvedApplications: 0 });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const patientsQuery = query(collection(db, 'patients'), where('hospitalId', '==', user.uid));
        const patientsSnap = await getDocs(patientsQuery);
        
        const appsQuery = query(collection(db, 'scheme_applications'), where('hospitalId', '==', user.uid));
        const appsSnap = await getDocs(appsQuery);
        
        let pending = 0;
        let approved = 0;
        appsSnap.forEach(doc => {
          const status = doc.data().status;
          if (status === 'pending') pending++;
          if (status === 'approved') approved++;
        });

        setStats({
          totalPatients: patientsSnap.size,
          totalApplications: appsSnap.size,
          pendingApplications: pending,
          approvedApplications: approved
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    const fetchAlerts = async () => {
      try {
        const alertsQuery = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'), limit(3));
        const alertsSnap = await getDocs(alertsQuery);
        setAlerts(alertsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Alert)));
      } catch(err) {
        console.error("Error fetching alerts:", err);
      }
    };

    const fetchBannersAndSchemes = async () => {
      try {
        const bannersQuery = query(collection(db, 'banners'), orderBy('createdAt', 'desc'), limit(5));
        const bannersSnap = await getDocs(bannersQuery);
        setBanners(bannersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));

        const schemesSnap = await getDocs(collection(db, 'schemes'));
        setSchemes(schemesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Scheme)));
      } catch(err) {
        console.error("Error fetching banners and schemes:", err);
      }
    };

    fetchStats();
    fetchAlerts();
    fetchBannersAndSchemes();
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Hospital Overview</h1>

      {banners.length > 0 && (
        <div className="w-full h-72 relative rounded-xl overflow-hidden shadow-sm border border-slate-200 group">
          {banners.map((b, i) => (
            <div key={b.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === currentBanner ? 'opacity-100' : 'opacity-0'}`}>
              <img 
                src={b.imageUrl} 
                alt={b.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-2xl font-bold text-white mb-2">{b.title}</h2>
              </div>
            </div>
          ))}
          <button 
            onClick={() => setCurrentBanner(prev => (prev === 0 ? banners.length - 1 : prev - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 right-6 flex space-x-2">
            {banners.map((_, idx) => (
              <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentBanner ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Total Applications" value={stats.totalApplications} icon={FileText} colorClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Pending Approvals" value={stats.pendingApplications} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
        <StatCard title="Approved Schemes" value={stats.approvedApplications} icon={CheckCircle} colorClass="bg-green-50 text-green-600" />
      </div>

      {alerts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Bell className="mr-2 text-indigo-600" size={20} /> Important Broadcasts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(a => (
              <div key={a.id} className={`p-4 rounded-xl border ${a.type === 'urgent' ? 'border-red-200 bg-red-50' : a.type === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold ${a.type === 'urgent' ? 'text-red-700 bg-red-200' : a.type === 'warning' ? 'text-amber-700 bg-amber-200' : 'text-blue-700 bg-blue-200'}`}>
                    {a.type}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-bold text-slate-900 mt-2">{a.name}</p>
                <p className="font-medium text-slate-700 mt-1">{a.description}</p>
                {(a.district || a.state) && (
                  <p className="text-xs text-slate-500 mt-2">
                    Region: {a.district || 'All Districts'}, {a.state || 'All States'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {schemes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Info className="mr-2 text-teal-600" size={20} /> Available Schemes</h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="divide-y divide-slate-100">
              {schemes.map(s => (
                <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800">{s.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{s.description}</p>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                    ID: {s.id.substring(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

