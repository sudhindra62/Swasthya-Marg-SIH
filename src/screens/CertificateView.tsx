import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HeartPulse, Printer } from 'lucide-react';

export default function CertificateView() {
  const { applicationId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        if (!applicationId) return;
        const appDoc = await getDoc(doc(db, 'scheme_applications', applicationId));
        if (appDoc.exists()) {
          const appData = appDoc.data();
          const patientDoc = await getDoc(doc(db, 'patients', appData.patientId));
          const schemeDoc = await getDoc(doc(db, 'schemes', appData.schemeId));
          const hospitalDoc = await getDoc(doc(db, 'users', appData.hospitalId));
          
          setData({
            application: { id: appDoc.id, ...appData },
            patient: patientDoc.data(),
            scheme: schemeDoc.data(),
            hospital: hospitalDoc.data(),
          });
        }
      } catch (error) {
        console.error("Error fetching certificate data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificateData();
  }, [applicationId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Certificate...</div>;
  if (!data || data.application.status !== 'approved') return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <div className="text-xl text-red-600 font-bold">Certificate Not Available</div>
      <p className="text-slate-600">The application may not exist or is not approved yet.</p>
      <Link to="/" className="text-blue-600 underline">Return Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6 print:hidden">
          <button 
            onClick={() => window.print()} 
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Printer size={20} />
            <span>Print Certificate</span>
          </button>
        </div>

        <div className="bg-white border-8 border-double border-teal-700 p-12 relative shadow-lg print:shadow-none print:border-4 rounded-xl">
          <div className="absolute top-12 left-12 text-teal-700 opacity-20">
            <HeartPulse size={120} />
          </div>
          <div className="absolute top-12 right-12 text-teal-700 opacity-20">
            <HeartPulse size={120} />
          </div>

          <div className="text-center relative z-10 space-y-6">
            <div className="inline-flex items-center justify-center p-4 bg-teal-50 rounded-full mb-4">
              <HeartPulse size={48} className="text-teal-700" />
            </div>
            
            <h1 className="text-5xl font-serif font-bold text-slate-900 mb-2">SwasthaPath</h1>
            <h2 className="text-2xl font-serif text-teal-700 uppercase tracking-widest font-semibold border-b-2 border-teal-200 pb-6 mb-8 inline-block">
              Certificate of Approval
            </h2>

            <p className="text-lg text-slate-700 italic mb-6">
              This is to certify that the health scheme application for
            </p>

            <h3 className="text-4xl font-bold text-slate-900 mb-6 capitalize">
              {data.patient?.name}
            </h3>

            <p className="text-lg text-slate-700 mb-8 max-w-2xl mx-auto leading-relaxed">
              has been officially evaluated and <strong className="text-green-700">APPROVED</strong> for the <strong className="text-slate-900">{data.scheme?.title}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-8 text-left max-w-3xl mx-auto mt-12 pt-8 border-t border-slate-200">
              <div>
                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Patient Details</p>
                <p className="text-slate-900"><span className="font-medium">Age/Gender:</span> {data.patient?.age} / {data.patient?.gender}</p>
                <p className="text-slate-900"><span className="font-medium">Diagnosis:</span> {data.patient?.diagnosis}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Hospital / Clinic</p>
                <p className="text-slate-900 font-bold">{data.hospital?.name}</p>
                <p className="text-slate-900">{data.hospital?.district}</p>
              </div>
            </div>

            <div className="flex justify-between items-end mt-24 pt-8">
              <div className="text-left">
                <p className="text-slate-900 font-mono text-sm border-t border-slate-400 pt-2 w-48 text-center">
                  Application ID
                </p>
                <p className="text-xs text-slate-500 mt-1 text-center font-mono">{data.application?.id}</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 bg-teal-50 rounded-full mx-auto mb-4 border-4 border-teal-100 flex items-center justify-center">
                  <span className="text-teal-700 font-bold transform -rotate-12">SEAL OF<br/>APPROVAL</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-900 font-mono text-sm border-t border-slate-400 pt-2 w-48 text-center">
                  Date of Approval
                </p>
                <p className="text-sm text-slate-700 mt-1 text-center font-medium">
                  {new Date(data.application?.updatedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
