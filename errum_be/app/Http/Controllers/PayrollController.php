<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\EmployeeOvertime;
use App\Models\EmployeeRewardFine;
use App\Models\EmployeeSalaryAdjustment;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    const TIMEZONE = 'Asia/Dhaka';

    public function getMonthlySalarySheet(Request $request)
    {
        $actor = $this->actor($request);

        $request->validate([
            'month' => 'required|date_format:Y-m',
            'store_id' => 'required|exists:stores,id',
        ]);

        $storeId = (int) $request->query('store_id');
        $this->assertStoreAccess($actor, $storeId);

        $monthStr = $request->query('month');
        $monthStart = Carbon::createFromFormat('Y-m', $monthStr, self::TIMEZONE)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $employees = Employee::query()
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $sheets = [];

        foreach ($employees as $employee) {
            $basicSalary = (float) $employee->salary;

            // Fines
            $fines = EmployeeRewardFine::query()
                ->where('employee_id', $employee->id)
                ->where('store_id', $storeId)
                ->whereBetween('entry_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('entry_type', 'fine')
                ->where('is_applied', false)
                ->sum('amount');

            // Rewards
            $rewards = EmployeeRewardFine::query()
                ->where('employee_id', $employee->id)
                ->where('store_id', $storeId)
                ->whereBetween('entry_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('entry_type', 'reward')
                ->where('is_applied', false)
                ->sum('amount');

            $lateFees = EmployeeAttendance::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('attendance_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('is_applied', false)
                ->sum('late_fee');

            // Overtime
            $overtimePay = EmployeeOvertime::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('overtime_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('is_applied', false)
                ->sum('overtime_pay');

            // Find if already locked via salary adjustment (only checking if basic structure locks exist)
            // But we can also check if there exists an Expense of type salary_payment for this month.
            $alreadyPaid = Expense::query()
                ->where('expense_type', 'salary_payment')
                ->where('store_id', $storeId)
                ->where('description', 'like', "%Salary payment to: {$employee->name} for {$monthStr}%")
                ->exists();

            $totalRewardsAndOvertime = $rewards + $overtimePay;
            $totalFinesAndLate = $fines + $lateFees;
            $netPayable = $basicSalary + $totalRewardsAndOvertime - $totalFinesAndLate;

            $sheets[] = [
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'employee_code' => $employee->employee_code,
                ],
                'basic_salary' => round($basicSalary, 2, PHP_ROUND_HALF_UP),
                'rewards' => round((float)$rewards, 2, PHP_ROUND_HALF_UP),
                'fines' => round((float)$fines, 2, PHP_ROUND_HALF_UP),
                'late_fees' => round((float)$lateFees, 2, PHP_ROUND_HALF_UP),
                'overtime_pay' => round((float)$overtimePay, 2, PHP_ROUND_HALF_UP),
                'net_payable' => round($netPayable, 2, PHP_ROUND_HALF_UP),
                'is_paid' => $alreadyPaid,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $monthStr,
                'store_id' => $storeId,
                'sheet' => $sheets,
            ]
        ]);
    }

    public function payMonthlySalary(Request $request)
    {
        $actor = $this->actor($request);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'store_id' => 'required|exists:stores,id',
            'month' => 'required|date_format:Y-m',
        ]);

        $storeId = (int) $validated['store_id'];
        $this->assertStoreAccess($actor, $storeId);

        $employee = Employee::query()->findOrFail((int) $validated['employee_id']);
        if ((int) $employee->store_id !== $storeId) {
            return response()->json(['success' => false, 'message' => 'Employee does not belong to this store'], 422);
        }

        $monthStr = $validated['month'];
        $monthStart = Carbon::createFromFormat('Y-m', $monthStr, self::TIMEZONE)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        // Check if already paid exactly for this month
        $alreadyPaid = Expense::query()
            ->where('expense_type', 'salary_payment')
            ->where('store_id', $storeId)
            ->where('description', 'like', "%Salary payment to: {$employee->name} for {$monthStr}%")
            ->exists();

        if ($alreadyPaid) {
            return response()->json(['success' => false, 'message' => 'Salary already paid for this month'], 422);
        }

        $result = DB::transaction(function() use ($employee, $storeId, $monthStart, $monthEnd, $monthStr, $actor) {
            $basicSalary = (float) $employee->salary;

            $fines = EmployeeRewardFine::query()
                ->where('employee_id', $employee->id)
                ->where('store_id', $storeId)
                ->whereBetween('entry_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('entry_type', 'fine')
                ->where('is_applied', false);
            $totalFines = (float)$fines->sum('amount');

            $rewards = EmployeeRewardFine::query()
                ->where('employee_id', $employee->id)
                ->where('store_id', $storeId)
                ->whereBetween('entry_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('entry_type', 'reward')
                ->where('is_applied', false);
            $totalRewards = (float)$rewards->sum('amount');

            $lateFees = EmployeeAttendance::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('attendance_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('is_applied', false);
            $totalLateFees = (float)$lateFees->sum('late_fee');
            
            $overtime = EmployeeOvertime::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('overtime_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->where('is_applied', false);
            $totalOvertimePay = (float)$overtime->sum('overtime_pay');

            $netPayable = $basicSalary + $totalRewards + $totalOvertimePay - $totalFines - $totalLateFees;

            // Apply them all so they do not show up again
            $fines->update([
                'is_applied' => true,
                'applied_month' => $monthStart->toDateString(),
                'applied_at' => now(),
                'applied_by' => $actor->id,
                'updated_by' => $actor->id
            ]);

            $rewards->update([
                'is_applied' => true,
                'applied_month' => $monthStart->toDateString(),
                'applied_at' => now(),
                'applied_by' => $actor->id,
                'updated_by' => $actor->id
            ]);

            $lateFees->update([
                'is_applied' => true,
                'applied_at' => now()
            ]);

            $overtime->update([
                'is_applied' => true,
                'applied_at' => now()
            ]);

            // Create Expense
            $expense = Expense::createSalaryPayment($employee, $netPayable, [
                'description' => "Salary payment to: {$employee->name} for {$monthStr}",
                'store_id' => null, // Explicitly assign to overall expense (central accounting)
            ]);

            return [
                'net_payable' => $netPayable,
                'expense_id' => $expense->id
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Salary marked as paid.',
            'data' => $result
        ]);
    }

    private function actor(Request $request): Employee
    {
        return $request->user();
    }

    private function isAdmin(Employee $employee): bool
    {
        $slug = $employee->role?->slug;
        return in_array($slug, ['super-admin', 'super_admin', 'superadmin', 'admin'], true);
    }

    private function isManager(Employee $employee): bool
    {
        return $employee->role?->slug === 'manager';
    }

    private function assertStoreAccess(Employee $actor, int $storeId): void
    {
        if ($this->isAdmin($actor)) {
            return;
        }

        if ($this->isManager($actor) && (int) $actor->store_id !== $storeId) {
            throw new AuthorizationException('Manager can only manage payroll for own store');
        }

        if (!$this->isManager($actor)) {
            throw new AuthorizationException('Unauthorized access to payroll');
        }
    }
}
