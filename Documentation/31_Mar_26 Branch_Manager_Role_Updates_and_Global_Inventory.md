# Documentation: Branch Manager Role Refinement & Global RBAC Cleanup (31 Mar 2026)

This document summarizes the changes made to the Errum V2 platform to tighten the `branch-manager` role's access, standardize administrative page security, and implement global visibility for key operations like returns and inventory.

## 1. Branch Manager Role Refinement

The `branch-manager` role has been significantly tightened to focus solely on branch operations, removing access to centralized administrative and financial modules.

### Feature Access Restrictions (`lib/accessMap.ts`)
- **Modules Removed**: The following routes are NO LONGER accessible to the `branch-manager`:
    - `/accounting`, `/transaction` (Financials restricted to Admin only)
    - `/vendor`, `/purchase-order` (Procurement restricted to Admin/Moderator)
    - `/employees` (HR restricted to Admin only)
    - `/store-assignment`, `/category`, `/gallery`, `/campaigns` (System setup restricted to Admin only)
- **Social Commerce Scoping**: Access is now strictly limited to `/social-commerce/package`. All other sub-routes (Dashboard, Amount Details, etc.) have been removed for this role.

### Enhanced Features for Branch Managers
- **Purchase History (`app/purchase-history/page.tsx`)**:
    - The manager's assigned store is now **pre-selected** in the filter dropdown by default.
    - Managers retain the ability to switch stores for cross-outlet history lookups.
- **Cross-Store Returns (`app/returns/page.tsx`)**:
    - Granted **global visibility** for returns. Managers can now view return/exchange data from all stores to facilitate easier cross-branch customer service.
    - Updated `productReturnService.ts` to support `skipStoreScope` for this purpose.

---

## 2. Global RBAC Cleanup & Security

Standardized administrative access across the platform to ensure only Super Admins and Admins can modify core system settings.

### Admin-Only Lockdown
The following modules are now restricted to `super-admin` and `admin` roles only:
- `/campaigns`
- `/transaction`
- `/category`
- `/gallery`
- `/accounting`
- `/employees`

### System Cleanup
- **Route Removal**: The `/roles` and `/permissions` management interfaces have been **completely removed** for all users (including admins) to simplify the UI and prevent unauthorized configuration changes.
- **Inventory Reports**: Restricted strictly to `super-admin` and `admin`. Other roles (including `branch-manager`) retain access to stock viewing and management but cannot generate full reports.

---

## 3. Implementation Details

| Component | Change Summary |
| --- | --- |
| `lib/accessMap.ts` | Refined `PAGE_ACCESS` to match the new role restrictions. |
| `contexts/AuthContext.tsx` | Updated `canSelectStore` and `canAccess` helpers to support the new RBAC rules. |
| `app/social-commerce/layout.tsx` | Updated layout guards to allow branch-manager access to child pages. |
| `services/productReturnService.ts` | Added `skipStoreScope` support for global data fetching. |
| `app/returns/page.tsx` | Implemented global visibility logic for branch managers. |
| `app/purchase-history/page.tsx` | Implemented store pre-selection and fixed legacy type issues. |

## 4. Verification

- Verified that `branch-manager` is redirected/blocked from `/accounting`, `/vendor`, etc.
- Verified that `branch-manager` defaults to their own store in Purchase History.
- Verified that Returns and Inventory View show data from all stores for authorized roles.
- Verified that `/roles` and `/permissions` are no longer in the sidebar and are inaccessible via URL.

