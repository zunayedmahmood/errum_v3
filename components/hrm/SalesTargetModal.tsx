'use client';

import { useState, useEffect } from 'react';
import { X, Target, Save, AlertCircle } from 'lucide-react';
import hrmService from '@/services/hrmService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface SalesTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: { id: number; name: string } | null;
  onSuccess: () => void;
  initialTarget?: number;
  initialMonth?: string;
}

export default function SalesTargetModal({ 
  isOpen, 
  onClose, 
  employee, 
  onSuccess,
  initialTarget,
  initialMonth
}: SalesTargetModalProps) {
  const [targetAmount, setTargetAmount] = useState<string>(initialTarget?.toString() || '');
  const [targetMonth, setTargetMonth] = useState<string>(initialMonth || format(new Date(), 'yyyy-MM'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTarget) setTargetAmount(initialTarget.toString());
    if (initialMonth) setTargetMonth(initialMonth);
  }, [initialTarget, initialMonth]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    setIsLoading(true);
    try {
      const res = await hrmService.setSalesTarget({
        employee_id: employee.id,
        target_amount: Number(targetAmount),
        target_month: targetMonth
      });

      if (res.success) {
        toast.success(`Sales target set for ${employee.name}`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Failed to set target');
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
            <Target className="w-6 h-6 text-emerald-500" />
            Set Sales Target
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Target for</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{employee.name}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Month
              </label>
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Amount (৳)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-4 text-2xl font-bold bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              Setting a target will overwrite any existing target for this employee in the selected month.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-black dark:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Set Monthly Target'}
          </button>
        </form>
      </div>
    </div>
  );
}
