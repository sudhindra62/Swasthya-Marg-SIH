import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginScreen() {
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'sub_admin' || role === 'dist_admin' || role === 'super_admin') {
          setPendingUser(role);
          setShowOtp(true);
        } else {
          setError('Unauthorized access for Admin portal.');
          await auth.signOut();
        }
      } else {
        setError('Admin profile not found. Please contact Super Admin.');
        await auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456' && pendingUser) {
      if (pendingUser === 'sub_admin') {
        navigate('/admin/sub');
      } else if (pendingUser === 'dist_admin') {
        navigate('/admin/dist');
      } else if (pendingUser === 'super_admin') {
        navigate('/admin/super');
      }
    } else {
      setError('Invalid OTP. Please try 123456.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <ShieldCheck size={48} className="text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Admin Portal Login</h2>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        
        {!showOtp ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50">
              {loading ? 'Authenticating...' : 'Secure Admin Login with Google'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-center text-slate-600 mb-4">An OTP has been sent to your registered email via SendGrid (Simulate with 123456).</p>
            <div>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 text-center text-xl tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium">
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
