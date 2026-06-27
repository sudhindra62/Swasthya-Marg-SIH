import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { SchemeApplication, Patient, Scheme } from '../../types';

export default function Enquiry() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const appsQuery = query(collection(db, 'scheme_applications'), where('hospitalId', '==', user.uid));
        const appsSnap = await getDocs(appsQuery);
        
        // Fetch related patients and schemes manually for joining
        const pSnap = await getDocs(query(collection(db, 'patients'), where('hospitalId', '==', user.uid)));
        const patientsMap = new Map();
        pSnap.docs.forEach(d => patientsMap.set(d.id, d.data()));

        const sSnap = await getDocs(collection(db, 'schemes'));
        const schemesMap = new Map();
        sSnap.docs.forEach(d => schemesMap.set(d.id, d.data()));

        const enriched = appsSnap.docs.map(doc => {
          const data = doc.data() as SchemeApplication;
          return {
            ...data,
            id: doc.id,
            patientName: patientsMap.get(data.patientId)?.name || 'Unknown',
            schemeTitle: schemesMap.get(data.schemeId)?.title || 'Unknown',
          };
        });
        
        // Sort by appliedAt desc
        enriched.sort((a, b) => b.appliedAt - a.appliedAt);
        setApplications(enriched);
      } catch (error) {
        console.error("Error fetching applications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <div>Loading records...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Application Status Enquiry</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-sm">
              <th className="p-4 font-medium">Patient Name</th>
              <th className="p-4 font-medium">Scheme</th>
              <th className="p-4 font-medium">Applied On</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No applications found.</td>
              </tr>
            ) : null}
            {applications.map(app => (
              <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{app.patientName}</td>
                <td className="p-4 text-slate-600">{app.schemeTitle}</td>
                <td className="p-4 text-slate-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-amber-100 text-amber-800'}`}>
                    {app.status}
                  </span>
                </td>
                <td className="p-4">
                  {app.status === 'approved' ? (
                    <button 
                      onClick={() => window.open(`/certificate/${app.id}`, '_blank')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                    >
                      View Certificate
                    </button>
                  ) : <span className="text-slate-400 text-sm">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
