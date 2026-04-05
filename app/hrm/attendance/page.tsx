'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import hrmService from '@/services/hrmService';
import { 
  Calendar, 
  Search, 
  FileText, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Download,
  Info
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday } from 'date-fns';

export default function AttendanceLogsPage() {
  const { selectedStoreId } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedStoreId) {
      loadReport();
    }
  }, [selectedStoreId, selectedMonth]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const monthDate = new Date(selectedMonth + '-01');
      const from = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const to = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      
      const data = await hrmService.getAttendanceReport({
        store_id: selectedStoreId!,
        from,
        to
      });
      setReportData(data);
    } catch (error) {
      console.error('Failed to load attendance report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const monthDate = new Date(selectedMonth + '-01');
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate)
  });

  const filteredEmployees = reportData?.employees?.filter((item: any) => 
    item.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employee.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-500';
      case 'late': return 'bg-amber-500';
      case 'absent': return 'bg-red-500';
      case 'leave': return 'bg-blue-500';
      case 'half_day': return 'bg-orange-500';
      case 'off_day_auto': return 'bg-gray-200 dark:bg-gray-700';
      case 'holiday_auto': return 'bg-purple-500';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'P';
      case 'late': return 'L';
      case 'absent': return 'A';
      case 'leave': return 'LV';
      case 'half_day': return 'H';
      case 'off_day_auto': return 'OFF';
      case 'holiday_auto': return 'HD';
      default: return '-';
    }
  };

  if (!selectedStoreId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Store Selected</h3>
        <p className="text-gray-500 dark:text-gray-400">Please select a store to view attendance logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Logs & Reports</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Detailed monthly view of employee attendance across the branch.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Calendar className="w-5 h-5 text-blue-500 ml-2" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-none focus:ring-0 bg-transparent text-sm font-bold text-gray-900 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Off Day</span>
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Attendance Matrix</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-black outline-none w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 min-w-[200px] border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">Employee</th>
                <th className="px-4 py-4 text-center border-r border-gray-100 dark:border-gray-700">Summary</th>
                {daysInMonth.map((day) => (
                  <th 
                    key={day.toString()} 
                    className={`px-1 py-4 text-center min-w-[32px] ${isWeekend(day) ? 'bg-orange-50 dark:bg-orange-950/20' : ''} ${isToday(day) ? 'bg-blue-50 dark:bg-blue-950/20 ring-1 ring-inset ring-blue-200' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{format(day, 'dd')}</span>
                      <span className="text-[8px] opacity-70">{format(day, 'EEE')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredEmployees.map((row: any) => (
                <tr key={row.employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                  <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                        {row.employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{row.employee.name}</p>
                        <p className="text-[10px] text-gray-500">{row.employee.employee_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-r border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                        {row.summary.present + row.summary.late}
                      </span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                        {row.summary.absent}
                      </span>
                    </div>
                  </td>
                  {row.daily.map((day: any, idx: number) => (
                    <td 
                      key={idx} 
                      className={`px-1 py-4 text-center group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50 transition-colors ${isWeekend(daysInMonth[idx]) ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}`}
                    >
                      <div 
                        title={`${format(new Date(day.date), 'dd MMM yyyy')} - ${day.status.replace(/_/g, ' ').toUpperCase()}${day.in_time ? ` (IN: ${day.in_time})` : ''}`}
                        className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center text-[8px] font-black text-white hover:scale-125 transition-transform shadow-sm cursor-help ${getStatusColor(day.status)}`}
                      >
                        {getStatusLabel(day.status)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth.length + 2} className="px-6 py-12 text-center text-gray-500">
                    No data available for the selected month and store.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Warning */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="w-5 h-5 shrink-0" />
        <p>
          The system automatically marks holidays and off-days based on the store policy. 
          Manual adjustments should be made through the <strong>Branch Panel</strong>. 
          Only Present and Late entries are counted towards performance scores.
        </p>
      </div>
    </div>
  );
}
