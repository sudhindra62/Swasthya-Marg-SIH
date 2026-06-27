import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AlertTriangle, CheckCircle2, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'info'
  });
  const [loading, setLoading] = useState(false);
  const [smsStatus, setSmsStatus] = useState('');

  const fetchAlerts = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAlerts(data.filter((c: any) => c.createdBy === user.uid));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSmsStatus('');
    try {
      await addDoc(collection(db, 'alerts'), {
        ...formData,
        createdBy: user.uid,
        createdAt: Date.now()
      });
      
      // Simulate SMS sending via Twilio
      const patientsSnap = await getDocs(collection(db, 'patients'));
      const patientsCount = patientsSnap.size;
      
      if (patientsCount > 0) {
        setSmsStatus(`Simulating Twilio SMS sending to ${patientsCount} patients in district...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSmsStatus(`SMS successfully sent to ${patientsCount} registered patients.`);
        setTimeout(() => setSmsStatus(''), 5000);
      } else {
        setSmsStatus('No patients found to notify in this district.');
        setTimeout(() => setSmsStatus(''), 3000);
      }

      setFormData({
        name: '',
        description: '',
        type: 'info'
      });
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert", error);
      alert('Failed to send alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-red-50 border border-red-100 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center text-red-700">
          <MessageSquareWarning className="mr-2" /> Broadcast Health Alert
        </h2>
        
        {smsStatus && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6 text-sm border border-blue-100">
            {smsStatus}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-900 mb-1">Alert Name / Subject</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-900 mb-1">Type</label>
              <select
                className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-red-900 mb-1">Description</label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <AlertTriangle size={18} className="mr-2" />
              {loading ? 'Broadcasting...' : 'Submit and Notify'}
            </button>
          </div>
        </form>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <AlertTriangle className="mr-2 text-slate-700" /> Alert History
          </h2>
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="border border-slate-100 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{alert.name}</h3>
                  <div className="flex space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold ${alert.type === 'urgent' ? 'text-red-700 bg-red-200' : alert.type === 'warning' ? 'text-amber-700 bg-amber-200' : 'text-blue-700 bg-blue-200'}`}>
                      {alert.type || 'info'}
                    </span>
                    <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      <CheckCircle2 size={12} className="mr-1" /> SMS Sent
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-100">{alert.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
