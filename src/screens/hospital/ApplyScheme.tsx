import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Patient, Scheme } from '../../types';
import { Search, FileText, CheckCircle2 } from 'lucide-react';

export default function ApplyScheme() {
  const { user } = useAuth();
  const [aadhaarSearch, setAadhaarSearch] = useState('');
  const [patientFound, setPatientFound] = useState<Patient | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState('');
  
  const [incomeCert, setIncomeCert] = useState<File | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSchemes = async () => {
      const sSnap = await getDocs(collection(db, 'schemes'));
      setSchemes(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Scheme)));
    };
    fetchSchemes();
  }, []);

  const handleSearch = async () => {
    if (!aadhaarSearch || aadhaarSearch.length !== 12) {
      setMessage({ type: 'error', text: 'Enter a valid 12-digit Aadhaar number.' });
      return;
    }
    setLoading(true);
    try {
      const pQuery = query(collection(db, 'patients'), where('aadhaar', '==', aadhaarSearch));
      const pSnap = await getDocs(pQuery);
      if (pSnap.empty) {
        setMessage({ type: 'error', text: 'No patient found with this Aadhaar number.' });
        setPatientFound(null);
      } else {
        setPatientFound({ id: pSnap.docs[0].id, ...pSnap.docs[0].data() } as Patient);
        setMessage({ type: '', text: '' });
        setOtpSent(true); // Simulate OTP sending
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error searching for patient.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode === '123456') {
      setOtpVerified(true);
      setMessage({ type: 'success', text: 'OTP Verified Successfully.' });
    } else {
      setMessage({ type: 'error', text: 'Invalid OTP. Try 123456' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientFound || !selectedScheme) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'scheme_applications'), {
        hospitalId: user.uid,
        patientId: patientFound.id,
        schemeId: selectedScheme,
        status: 'pending',
        appliedAt: Date.now(),
        updatedAt: Date.now(),
        // Mock URLs for files since we don't have Supabase storage setup here
        incomeCertificateUrl: incomeCert ? `mock_url_${incomeCert.name}` : null,
        billUrl: billFile ? `mock_url_${billFile.name}` : null
      });
      setMessage({ type: 'success', text: 'Application submitted successfully to the sub-district admin.' });
      setAadhaarSearch('');
      setPatientFound(null);
      setOtpSent(false);
      setOtpVerified(false);
      setSelectedScheme('');
      setIncomeCert(null);
      setBillFile(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit application.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Apply for Health Scheme</h2>
      
      {message.text && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {!otpVerified && (
        <div className="space-y-4 mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Patient Aadhaar Number</label>
            <div className="flex space-x-2">
              <input type="text" maxLength={12} value={aadhaarSearch} onChange={e => setAadhaarSearch(e.target.value)} disabled={otpSent} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="12-digit Aadhaar" />
              <button onClick={handleSearch} disabled={loading || otpSent} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50">
                <Search size={18} className="mr-2" /> {loading ? 'Searching...' : 'Fetch'}
              </button>
            </div>
          </div>
          
          {otpSent && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">An OTP has been sent to the patient's registered mobile number (Simulate with 123456).</p>
              <div className="flex space-x-2">
                <input type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter 6-digit OTP" />
                <button onClick={handleVerifyOtp} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700">
                  <CheckCircle2 size={18} className="mr-2" /> Verify
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {otpVerified && patientFound && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <input type="text" disabled value={patientFound.name} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Contact</label>
              <input type="text" disabled value={patientFound.contact} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gender</label>
              <input type="text" disabled value={patientFound.gender} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Age</label>
              <input type="text" disabled value={patientFound.age} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Address</label>
              <input type="text" disabled value={patientFound.address} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Available Schemes</label>
            <div className="space-y-3">
              {schemes.length === 0 ? <p className="text-sm text-slate-500">No schemes available.</p> : null}
              {schemes.map(s => (
                <label key={s.id} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${selectedScheme === s.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                  <input type="radio" name="scheme" value={s.id} checked={selectedScheme === s.id} onChange={e => setSelectedScheme(e.target.value)} className="mt-1" />
                  <div className="ml-3">
                    <span className="block font-medium text-slate-900">{s.title}</span>
                    <span className="block text-sm text-slate-500 mt-1">{s.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Income Certificate (PDF)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-6 h-6 mb-2 text-slate-500" />
                    <p className="text-xs text-slate-500">{incomeCert ? incomeCert.name : 'Click to upload Income Certificate'}</p>
                  </div>
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => setIncomeCert(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Bill (PDF)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileText className="w-6 h-6 mb-2 text-slate-500" />
                    <p className="text-xs text-slate-500">{billFile ? billFile.name : 'Click to upload Hospital Bill'}</p>
                  </div>
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => setBillFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading || !selectedScheme} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

