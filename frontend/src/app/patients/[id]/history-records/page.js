'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import { 
  Activity, ArrowLeft, Calendar, FileText, User, 
  Phone, Mail, CalendarDays, ClipboardList, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function PatientHistoryRecords() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, API_BASE_URL } = useAuth();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user]);

  const fetchPatientDetails = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve patient clinical file.');
      }
      const data = await res.json();
      setPatient(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchPatientDetails();
    }
  }, [token, id]);

  if (user === null) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8">
        {/* Back navigation */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1 text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-3 text-sm font-semibold">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>Error: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="pulse-loader">
              <div></div>
              <div></div>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-400">Retrieving clinical file...</p>
          </div>
        ) : patient ? (
          <div className="space-y-8">
            {/* Header / Info Summary */}
            <div className="glass p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-2xl">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                    {patient.name}
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wider">
                    Clinical Record File
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Age: {patient.age} yrs
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 capitalize">
                  Gender: {patient.gender}
                </span>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Sidebar Info */}
              <div className="space-y-6">
                <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                    Contact Details
                  </h3>
                  
                  <div className="space-y-3 font-semibold text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-teal-600" />
                      <span>{patient.phoneNumber}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-2 break-all">
                        <Mail className="h-4 w-4 text-teal-600" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                    System Information
                  </h3>
                  
                  <div className="space-y-3 font-semibold text-xxs text-slate-500">
                    <div>
                      <span className="block text-slate-400">Record Created</span>
                      <span>{new Date(patient.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Last Updated</span>
                      <span>{new Date(patient.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* Medical Anamnesis / History */}
                <div className="glass p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-teal-600" />
                    Clinical Background & Anamnesis
                  </h3>
                  
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 leading-6 text-slate-700 dark:text-slate-300 text-sm font-semibold">
                    {patient.medicalHistory ? (
                      patient.medicalHistory
                    ) : (
                      <span className="italic text-slate-400 dark:text-slate-500">No medical history background has been logged for this patient.</span>
                    )}
                  </div>
                </div>

                {/* Consultations and Appointments History */}
                <div className="glass p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-teal-600" />
                    Appointment History Log
                  </h3>

                  {(!patient.appointments || patient.appointments.length === 0) ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm italic py-4">No scheduled or past consultations logged for this patient record.</p>
                  ) : (
                    <div className="space-y-4">
                      {patient.appointments.map((app) => (
                        <div 
                          key={app.id} 
                          className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-500/5 flex flex-col sm:flex-row justify-between gap-4 text-xs font-semibold"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                              <Calendar className="h-3.5 w-3.5 text-teal-600" />
                              {new Date(app.appointmentDate).toLocaleString()}
                            </div>
                            <div className="text-slate-500">
                              <strong>Objective:</strong> {app.reason || 'Not specified'}
                            </div>
                          </div>

                          <div className="flex items-center">
                            <span className={`px-2.5 py-1 rounded text-xxs font-extrabold uppercase border ${
                              app.status === 'COMPLETED' 
                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' 
                                : app.status === 'CANCELLED' 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <FileText className="h-12 w-12 text-slate-400 mx-auto" />
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">Record Not Found</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              The clinical history record folder you are attempting to view does not exist or has been deleted.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
