import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Building2 } from 'lucide-react';

export default function LoginScreen() {
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
        if (role === 'hospital') {
          if (!userDoc.data().isApproved) {
            setError('Your hospital account is pending approval by an admin.');
            await auth.signOut();
            return;
          }
          setPendingUser(role);
          setShowOtp(true);
        } else {
          setError('Unauthorized access for this portal.');
          await auth.signOut();
        }
      } else {
        setError('User profile not found. Please register first.');
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
      navigate('/hospital');
    } else {
      setError('Invalid OTP. Please try 123456.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Building2 size={48} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Hospital Portal Login</h2>
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        
        {!showOtp ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
              {loading ? 'Authenticating...' : 'Login with Google'}
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
                className="w-full px-4 py-2 text-center text-xl tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Verify OTP
            </button>
          </form>
        )}
        
        <p className="mt-6 text-center text-sm text-slate-500">
          Not registered? <Link to="/register" className="text-blue-600 hover:underline">Register your hospital</Link>
        </p>
      </div>
    </div>
  );
}
