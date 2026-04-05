'use client';

import { useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import hrmService from '@/services/hrmService';
import { toast } from 'react-hot-toast';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: { id: number; name: string };
  type: 'check_in' | 'check_out';
  onSuccess: () => void;
}

export default function AttendanceModal({ isOpen, onClose, employee, type, onSuccess }: AttendanceModalProps) {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await hrmService.markAttendance({
        employee_id: employee.id,
        type: type,
        time: time
      });

      if (res.success) {
        toast.success(`${employee.name} ${type === 'check_in' ? 'checked in' : 'checked out'} successfully!`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Failed to mark attendance');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            {type === 'check_in' ? 'Clock In' : 'Clock Out'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-widest font-semibold">Employee</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white underline decoration-blue-500 decoration-4 underline-offset-4">
              {employee.name}
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Transaction Time (Standard: {new Date().toLocaleTimeString()})
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-4xl font-bold text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              Marking {type === 'check_in' ? 'Late Entry' : 'Early Exit'} will automatically trigger policy-based flags.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              ${type === 'check_in' ? 'bg-black dark:bg-blue-600' : 'bg-red-600'}
            `}
          >
            {isLoading ? 'Processing...' : `Confirm ${type === 'check_in' ? 'Check In' : 'Check Out'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
