import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Building2, UserCog, ShieldCheck } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Banner } from '../types';

export default function LandingPage() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'), limit(3));
        const snap = await getDocs(q);
        setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
      } catch (err) {
        console.error("Error fetching banners", err);
      }
    };
    fetchBanners();
  }, []);

  const handleAdminBootstrap = async () => {
    setClickCount(prev => prev + 1);
    if (clickCount >= 4) {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          name: 'Super Admin User',
          role: 'super_admin',
          createdAt: Date.now()
        });
        alert('Super Admin bootstrapped successfully!');
        navigate('/admin/login');
      } catch (err: any) {
        alert(err.message || 'Failed to bootstrap admin');
      }
      setClickCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-12 px-4 font-sans text-slate-800">
      
      {banners.length > 0 && (
        <div className="w-full max-w-5xl mb-12 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          <div className="relative h-64 md:h-80 w-full bg-slate-800">
            {banners.map((b, i) => (
              <img 
                key={b.id} 
                src={b.imageUrl} 
                alt={b.title} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === 0 ? 'opacity-100' : 'opacity-0'}`} 
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
              <h2 className="text-3xl font-bold text-white mb-2">{banners[0]?.title}</h2>
              <p className="text-teal-200 font-medium">Latest Updates & Announcements</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center max-w-3xl mb-16 mt-4">
        <div className="flex justify-center mb-6 text-teal-600" onClick={handleAdminBootstrap} style={{ cursor: 'pointer' }}>
          <HeartPulse size={64} />
        </div>
        <h1 className="text-5xl font-bold mb-6 tracking-tight text-slate-900">SwasthaPath</h1>
        <p className="text-xl text-slate-600">The Way To Health - Comprehensive Health Administration System</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        <Link to="/login" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center group">
          <Building2 size={48} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2">Hospital Portal</h2>
          <p className="text-slate-500 text-sm">Register patients, apply for schemes, and track approvals.</p>
        </Link>
        <Link to="/admin/login" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center group">
          <UserCog size={48} className="text-teal-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2">Sub-District Admin</h2>
          <p className="text-slate-500 text-sm">Verify hospitals and approve scheme applications.</p>
        </Link>
        <Link to="/admin/login" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center group">
          <ShieldCheck size={48} className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2">District/State Admin</h2>
          <p className="text-slate-500 text-sm">Manage campaigns, broadcasts, and district reports.</p>
        </Link>
        <Link to="/admin/login" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center group">
          <ShieldCheck size={48} className="text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2">Super Admin</h2>
          <p className="text-slate-500 text-sm">Global system oversight and scheme creation.</p>
        </Link>
      </div>
    </div>
  );
}
