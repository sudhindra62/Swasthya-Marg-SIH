import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { MessageSquare, Calendar, Target, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    eligibility: '',
    description: '',
    date: '',
    duration: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [smsStatus, setSmsStatus] = useState('');

  const fetchCampaigns = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCampaigns(data.filter((c: any) => c.createdBy === user.uid));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSmsStatus('');
    try {
      await addDoc(collection(db, 'campaigns'), {
        ...formData,
        createdBy: user.uid,
        createdAt: Date.now()
      });
      
      // Simulate SMS sending via Twilio
      const patientsSnap = await getDocs(collection(db, 'patients'));
      const patientsCount = patientsSnap.size;
      
      if (patientsCount > 0) {
        setSmsStatus(`Simulating Twilio SMS sending to ${patientsCount} eligible patients...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSmsStatus(`SMS successfully sent to ${patientsCount} eligible patients.`);
        setTimeout(() => setSmsStatus(''), 5000);
      } else {
        setSmsStatus('No target patients found.');
        setTimeout(() => setSmsStatus(''), 3000);
      }

      setFormData({
        name: '',
        eligibility: '',
        description: '',
        date: '',
        duration: '',
        location: ''
      });
      fetchCampaigns();
    } catch (error) {
      console.error("Error creating campaign", error);
      alert('Failed to send campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <MessageSquare className="mr-2 text-blue-600" /> Notify Patients of Camp
        </h2>
        
        {smsStatus && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6 text-sm border border-blue-100">
            {smsStatus}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Eligibility</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.eligibility}
                onChange={(e) => setFormData({...formData, eligibility: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (e.g. 2 Days)</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <MessageSquare size={18} className="mr-2" />
              {loading ? 'Sending SMS...' : 'Submit and Notify'}
            </button>
          </div>
        </form>
      </div>

      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Target className="mr-2 text-indigo-600" /> Campaign History
          </h2>
          <div className="space-y-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="border border-slate-100 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{camp.name}</h3>
                  <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    <CheckCircle2 size={12} className="mr-1" /> SMS Sent
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                  <p><span className="font-medium text-slate-700">Date:</span> {camp.date} ({camp.duration})</p>
                  <p><span className="font-medium text-slate-700">Location:</span> {camp.location}</p>
                  <p><span className="font-medium text-slate-700">Eligibility:</span> {camp.eligibility}</p>
                </div>
                <p className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-100">{camp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
