'use client';

import { useState, useEffect } from 'react';
import { X, Award, AlertTriangle, Save, Loader2 } from 'lucide-react';
import hrmService from '@/services/hrmService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface RewardFineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: number;
  employee: { id: number; name: string } | null;
  onSuccess: () => void;
  editData?: any;
}

export default function RewardFineDialog({ 
  isOpen, 
  onClose, 
  storeId,
  employee, 
  onSuccess,
  editData
}: RewardFineDialogProps) {
  const [type, setType] = useState<'reward' | 'fine'>('reward');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setType(editData.entry_type);
      setAmount(editData.amount.toString());
      setTitle(editData.title);
      setNotes(editData.notes || '');
      setDate(editData.entry_date);
    } else {
      // Reset for new
      setType('reward');
      setAmount('');
      setTitle('');
      setNotes('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [editData, isOpen]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (editData) {
        res = await hrmService.updateRewardFine(editData.id, {
          entry_date: date,
          entry_type: type,
          amount: Number(amount),
          title: title,
          notes: notes,
          reason: 'Manual update from UI'
        });
      } else {
        res = await hrmService.createRewardFine({
          store_id: storeId,
          employee_id: employee.id,
          entry_date: date,
          entry_type: type,
          amount: Number(amount),
          title: title,
          notes: notes
        });
      }

      if (res.success) {
        toast.success(`${type === 'reward' ? 'Reward' : 'Fine'} ${editData ? 'updated' : 'created'} for ${employee.name}`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Operation failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {type === 'reward' ? (
              <Award className="w-6 h-6 text-yellow-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500" />
            )}
            {editData ? 'Edit Entry' : 'New Reward/Fine'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('reward')}
              className={`py-3 rounded-2xl font-bold text-sm transition-all ${
                type === 'reward' 
                  ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              Reward
            </button>
            <button
              type="button"
              onClick={() => setType('fine')}
              className={`py-3 rounded-2xl font-bold text-sm transition-all ${
                type === 'fine' 
                  ? 'bg-red-100 text-red-700 ring-2 ring-red-500' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              Fine
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Target Employee</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{employee.name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-black text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (৳)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-black text-gray-900 dark:text-white font-bold"
                required
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Overtime Bonus, Late Penalty"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-black text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain the context..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-black text-gray-900 dark:text-white resize-none text-sm"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-black dark:bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {editData ? 'Update Record' : 'Save Record'}
          </button>
        </form>
      </div>
    </div>
  );
}
