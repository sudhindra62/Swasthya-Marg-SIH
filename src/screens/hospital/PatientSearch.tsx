import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, UserCheck, AlertCircle } from 'lucide-react';

export default function PatientSearch() {
  const [aadhaar, setAadhaar] = useState('');
  const [patientFound, setPatientFound] = useState<any>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // For update
  const [diagnosis, setDiagnosis] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPatient(null);
    setSuccess('');
    
    if (aadhaar.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'patients'), where('aadhaar', '==', aadhaar));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setError('No patient found with this Aadhaar number.');
      } else {
        const docData = snap.docs[0].data() as any;
        const pData = { id: snap.docs[0].id, ...docData };
        setPatientFound(pData);
        setShowOtp(true);
        setSuccess('An OTP has been sent to the registered mobile number (Simulate with 123456).');
      }
    } catch (err) {
      setError('An error occurred while searching.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = () => {
    if (otp === '123456' && patientFound) {
      setPatient(patientFound);
      setDiagnosis(patientFound.diagnosis || '');
      setShowOtp(false);
      setOtp('');
      setSuccess('OTP Verified Successfully.');
    } else {
      setError('Invalid OTP. Please try 123456.');
    }
  };

  const handleUpdate = async () => {
    if (!patient) return;
    setUpdateLoading(true);
    setSuccess('');
    setError('');
    try {
      const pRef = doc(db, 'patients', patient.id);
      await updateDoc(pRef, { diagnosis });
      setPatient({ ...patient, diagnosis });
      setSuccess('Patient diagnosis updated successfully.');
    } catch (err) {
      setError('Failed to update diagnosis.');
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center"><Search className="mr-2 text-blue-600" /> Patient Enquiry & Update</h2>
        <p className="text-slate-600 mb-6 text-sm">Search for an existing patient using their 12-digit Aadhaar number to view details or update their diagnosis.</p>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter 12-digit Aadhaar Number"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || showOtp}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {showOtp && (
          <div className="mt-4 flex gap-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button
              onClick={verifyOtp}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Verify OTP
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center border border-red-100">
            <AlertCircle size={20} className="mr-2" /> {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-100">
            <UserCheck size={20} className="mr-2" /> {success}
          </div>
        )}
      </div>

      {patient && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold mb-6 border-b pb-4">Patient Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="px-4 py-2 bg-slate-50 border rounded-lg text-slate-800">{patient.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <div className="px-4 py-2 bg-slate-50 border rounded-lg text-slate-800">{patient.phone}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age / Gender</label>
              <div className="px-4 py-2 bg-slate-50 border rounded-lg text-slate-800">{patient.age} / {patient.gender}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Income</label>
              <div className="px-4 py-2 bg-slate-50 border rounded-lg text-slate-800">₹{patient.income}</div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis / Disease</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              rows={3}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Update patient's current diagnosis..."
            />
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpdate}
                disabled={updateLoading || diagnosis === patient.diagnosis}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {updateLoading ? 'Updating...' : 'Update Diagnosis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
