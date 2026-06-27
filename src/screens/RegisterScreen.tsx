import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { FileText, Building2 } from 'lucide-react';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
         navigate('/hospital'); // Already registered
         return;
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        name: name,
        district: district,
        certificateUrl: certFile ? `mock_url_${certFile.name}` : null,
        role: 'hospital',
        isApproved: false, // Must be approved by Sub-Admin
        createdAt: Date.now()
      });
      
      navigate('/hospital');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Building2 size={48} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Register Hospital</h2>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
            <input type="text" required value={district} onChange={e => setDistrict(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Registration Certificate (PDF)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileText className="w-6 h-6 mb-2 text-slate-500" />
                  <p className="text-xs text-slate-500">{certFile ? certFile.name : 'Click to upload Certificate'}</p>
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={(e) => setCertFile(e.target.files?.[0] || null)} required />
              </label>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2">
            <span>Register with Google</span>
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}
