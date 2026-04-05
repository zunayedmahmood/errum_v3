import axiosInstance from '@/lib/axios';

export interface AttendancePolicy {
  id: number;
  store_id: number;
  shift_start: string;
  shift_end: string;
  late_grace_period: number;
  early_exit_grace_period: number;
  weekend_days: string[];
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  attendance_date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: 'Present' | 'Late' | 'Absent' | 'Holiday' | 'Weekend';
  is_late: boolean;
  is_early_exit: boolean;
  overtime_minutes: number;
  undertime_minutes: number;
  employee?: {
    name: string;
  };
}

export interface SalesTarget {
  id: number;
  employee_id: number;
  target_amount: number;
  target_month: string;
  achieved_amount: number;
  achievement_percentage: number;
  employee?: {
    name: string;
  };
}

const hrmService = {
  // Attendance & Policy
  async getStorePolicy(storeId: number): Promise<AttendancePolicy | null> {
    const response = await axiosInstance.get(`/hrm/attendance/policy/${storeId}`);
    return response.data.success ? response.data.data : null;
  },

  async upsertStorePolicy(data: any): Promise<any> {
    const response = await axiosInstance.post('/hrm/attendance/policy', data);
    return response.data;
  },

  async markAttendance(data: { employee_id: number; type: 'check_in' | 'check_out'; time?: string }): Promise<any> {
    const response = await axiosInstance.post('/hrm/attendance/mark', data);
    return response.data;
  },

  async getTodayAttendance(storeId?: number): Promise<AttendanceRecord[]> {
    const response = await axiosInstance.get('/hrm/attendance/report/today', { params: { store_id: storeId } });
    return response.data.success ? response.data.data : [];
  },

  async getAttendanceHistory(employeeId: number): Promise<AttendanceRecord[]> {
    const response = await axiosInstance.get(`/hrm/attendance/history/${employeeId}`);
    return response.data.success ? response.data.data : [];
  },

  async getAttendanceReport(params: { store_id: number; from: string; to: string; employee_ids?: number[] }): Promise<any> {
    const response = await axiosInstance.get('/hrm/attendance/report/range', { params });
    return response.data.success ? response.data.data : null;
  },

  // Sales Targets
  async getSalesTargets(params?: any): Promise<SalesTarget[]> {
    const response = await axiosInstance.get('/hrm/sales-targets', { params });
    return response.data.success ? response.data.data : [];
  },

  async setSalesTarget(data: { employee_id: number; target_amount: number; target_month: string }): Promise<any> {
    const response = await axiosInstance.post('/hrm/sales-targets', data);
    return response.data;
  },

  async getPerformanceReport(params?: any): Promise<any> {
    const response = await axiosInstance.get('/hrm/sales-targets/report', { params });
    return response.data.success ? response.data.data : null;
  },

  // Employee Self-Service
  async getMyPerformance(): Promise<any> {
    const response = await axiosInstance.get('/hrm/my/performance');
    return response.data.success ? response.data.data : null;
  },

  async getMyAttendance(params?: any): Promise<AttendanceRecord[]> {
    const response = await axiosInstance.get('/hrm/my/attendance', { params });
    return response.data.success ? response.data.data : [];
  },

  async getMyOvertime(): Promise<any[]> {
    const response = await axiosInstance.get('/hrm/my/overtime');
    return response.data.success ? response.data.data : [];
  },

  // Rewards & Fines
  async createRewardFine(data: { store_id: number; employee_id: number; entry_date: string; entry_type: 'reward' | 'fine'; amount: number; title: string; notes?: string }): Promise<any> {
    const response = await axiosInstance.post('/hrm/attendance/rewards-fines', data);
    return response.data;
  },

  async updateRewardFine(id: number, data: any): Promise<any> {
    const response = await axiosInstance.put(`/hrm/attendance/rewards-fines/${id}`, data);
    return response.data;
  },

  async getRewardFineReport(params: any): Promise<any> {
    const response = await axiosInstance.get('/hrm/attendance/rewards-fines/report', { params });
    return response.data.success ? response.data.data : null;
  },

  async getCumulatedRewardFine(params: any): Promise<any> {
    const response = await axiosInstance.get('/hrm/attendance/rewards-fines/cumulated', { params });
    return response.data.success ? response.data.data : [];
  },
};

export default hrmService;
