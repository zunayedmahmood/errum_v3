'use client';

import { useState, useEffect } from 'react';
import hrmService, { AttendanceRecord, SalesTarget } from '@/services/hrmService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function MyHRMPage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attData, perfData] = await Promise.all([
        hrmService.getMyAttendance(),
        hrmService.getMyPerformance()
      ]);
      setAttendance(attData);
      setPerformance(perfData);
    } catch (error) {
      console.error('Failed to load personal HRM data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const todayRecord = attendance.find(r => r.attendance_date === format(new Date(), 'yyyy-MM-dd'));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.name}!</h2>
            <p className="text-gray-500 dark:text-gray-400">Here's your performance and attendance overview for this month.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Today's Status
            </h3>
            {todayRecord ? (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                todayRecord.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {todayRecord.status}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Not Marked
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-sm text-gray-500 dark:text-gray-400">Check In</span>
              <span className="font-medium">{todayRecord?.clock_in || '--:--'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <span className="text-sm text-gray-500 dark:text-gray-400">Check Out</span>
              <span className="font-medium">{todayRecord?.clock_out || '--:--'}</span>
            </div>
          </div>
        </div>

        {/* Sales Target Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Monthly Sales Target
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'MMMM yyyy')}</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">Progress</span>
                <span className="font-semibold">{performance?.achievement_percentage || 0}% Achievement</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(performance?.achievement_percentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider mb-1">Achieved</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  ৳{(performance?.total_sales || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Target</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ৳{(performance?.target_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Attendance</h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {attendance.slice(0, 5).map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    record.status === 'Present' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {record.status === 'Present' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(record.attendance_date), 'EEE, MMM d')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {record.is_late ? 'Late Entry' : 'On Time'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{record.clock_in || '--:--'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{record.clock_out || '--:--'}</p>
                </div>
              </div>
            ))}
            {attendance.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No attendance records found for this period.
              </div>
            )}
          </div>
        </div>

        {/* Rewards & Performance Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Performance Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
              <AlertCircle className="w-6 h-6 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Attendance Note</p>
                <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                  You have been late 3 times this month. Try to be on time to maintain a perfect score!
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <Award className="w-6 h-6 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Sales Achievement</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  Your sales performance is 15% higher than last month. Keep up the great work!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl group transition-all hover:bg-gray-100 dark:hover:bg-gray-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">View Reward/Fine History</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing import recovery
import { Users } from 'lucide-react';
