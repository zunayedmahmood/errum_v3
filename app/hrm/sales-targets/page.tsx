'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import hrmService, { SalesTarget } from '@/services/hrmService';
import employeeService, { Employee } from '@/services/employeeService';
import SalesTargetModal from '@/components/hrm/SalesTargetModal';
import { 
  Target, 
  Users, 
  TrendingUp, 
  Calendar,
  Search,
  Plus,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';

export default function SalesTargetsPage() {
  const { selectedStoreId } = useStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [report, setReport] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [targetModal, setTargetModal] = useState<{
    isOpen: boolean;
    employee: any;
    initialTarget?: number;
  }>({
    isOpen: false,
    employee: null
  });

  useEffect(() => {
    if (selectedStoreId) {
      loadData();
    }
  }, [selectedStoreId, selectedMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empData, targetData, reportData] = await Promise.all([
        employeeService.getAll({ store_id: selectedStoreId!, is_active: true }),
        hrmService.getSalesTargets({ store_id: selectedStoreId!, month: selectedMonth }),
        hrmService.getPerformanceReport({ store_id: selectedStoreId!, month: selectedMonth })
      ]);
      
      setEmployees(empData);
      setTargets(targetData);
      setReport(reportData);
    } catch (error) {
      console.error('Failed to load sales targets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmpTarget = (empId: number | string) => {
    return targets.find(t => t.employee_id === Number(empId));
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedStoreId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        <Target className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Store Selected</h3>
        <p className="text-gray-500 dark:text-gray-400">Please select a store to manage sales targets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sales Goals & Performance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Set and track monthly sales targets for your team.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Calendar className="w-5 h-5 text-blue-500 ml-2" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none focus:ring-0 bg-transparent text-sm font-bold text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Branch Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-2">Branch Target</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">৳{(report?.branch_target || 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 font-bold">
            <ArrowUpRight className="w-4 h-4" />
            <span>Active Goals</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-2">Current Achievement</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">৳{(report?.total_sales || 0).toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>Updated Real-time</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-end mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Overall Progress</p>
            <p className="text-sm font-black text-emerald-600">{report?.branch_achievement || 0}%</p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min(report?.branch_achievement || 0, 100)}%` }}
            ></div>
          </div>
          <p className="mt-4 text-xs text-gray-400">Target calculated from {targets.length} assigned goals.</p>
        </div>
      </div>

      {/* Target Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Employee Performance</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Monthly Target</th>
                <th className="px-6 py-4">Progress (%)</th>
                <th className="px-6 py-4">Total Achievement</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredEmployees.map((emp) => {
                const target = getEmpTarget(emp.id);
                const achievement = target?.achievement_percentage || 0;
                
                return (
                  <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{emp.name}</td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                      {target ? `৳${target.target_amount.toLocaleString()}` : <span className="text-gray-400 italic">No target set</span>}
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full" 
                            style={{ width: `${Math.min(achievement, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-10">{achievement}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        ৳{(target?.achieved_amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setTargetModal({ isOpen: true, employee: emp, initialTarget: target?.target_amount })}
                        className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-black dark:hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                        title="Edit Target"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Modal */}
      {targetModal.isOpen && (
        <SalesTargetModal
          isOpen={targetModal.isOpen}
          onClose={() => setTargetModal({ ...targetModal, isOpen: false })}
          employee={targetModal.employee}
          onSuccess={loadData}
          initialTarget={targetModal.initialTarget}
          initialMonth={selectedMonth}
        />
      )}
    </div>
  );
}
