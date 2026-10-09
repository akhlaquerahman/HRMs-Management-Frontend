import api from '@/lib/axios';

export interface PagePermissionItem {
  id: string;
  title: string;
  href: string;
  category: 'HR Management' | 'Employee Self-Service' | 'Administration' | 'Core';
}

export const ALL_MANAGEABLE_PAGES: PagePermissionItem[] = [
  { id: 'dashboard', title: 'Dashboard', href: '/dashboard', category: 'Core' },
  { id: 'organization', title: 'Organization', href: '/dashboard/organization', category: 'HR Management' },
  { id: 'employee-management', title: 'Employee Management', href: '/dashboard/employee-management', category: 'HR Management' },
  { id: 'attendance', title: 'Attendance Management', href: '/dashboard/attendance', category: 'HR Management' },
  { id: 'shift-management', title: 'Shift Management', href: '/dashboard/shift-management', category: 'HR Management' },
  { id: 'leave-management', title: 'Leave Management', href: '/dashboard/leave-management', category: 'HR Management' },
  { id: 'payroll', title: 'Payroll', href: '/dashboard/payroll', category: 'HR Management' },
  { id: 'recruitment', title: 'Recruitment', href: '/dashboard/recruitment', category: 'HR Management' },
  { id: 'documents', title: 'Documents Management', href: '/dashboard/documents', category: 'HR Management' },
  { id: 'roles', title: 'Roles', href: '/dashboard/roles', category: 'HR Management' },
  { id: 'tenant-employees', title: 'Tenant Employees', href: '/dashboard/tenant-employees', category: 'Administration' },
  { id: 'users', title: 'Users', href: '/dashboard/users', category: 'Administration' },
  { id: 'audit-logs', title: 'Audit Logs', href: '/dashboard/audit-logs', category: 'Administration' },
  { id: 'my-attendance', title: 'My Attendance', href: '/dashboard/my-attendance', category: 'Employee Self-Service' },
  { id: 'leave-request', title: 'Leave Request', href: '/dashboard/leave-request', category: 'Employee Self-Service' },
  { id: 'payslips', title: 'Payslips', href: '/dashboard/payslips', category: 'Employee Self-Service' },
  { id: 'my-documents', title: 'My Documents', href: '/dashboard/my-documents', category: 'Employee Self-Service' },
  { id: 'profile', title: 'Profile', href: '/dashboard/profile', category: 'Core' },
];

export const SUPER_ADMIN_ONLY_PAGES = [
  '/dashboard/tenant-employees',
  '/dashboard/users',
  '/dashboard/audit-logs'
];

export const DEFAULT_HR_PAGES = ALL_MANAGEABLE_PAGES
  .map(p => p.href)
  .filter(href => !SUPER_ADMIN_ONLY_PAGES.includes(href));

export function extractRoleName(roleInput: any): string {
  if (!roleInput) return '';
  if (typeof roleInput === 'string') return roleInput;
  if (typeof roleInput === 'object') {
    return roleInput.name || roleInput.title || roleInput.role || '';
  }
  return String(roleInput);
}

export function getRolePagePermissions(roleInput: any): string[] {
  const rawRole = extractRoleName(roleInput);
  const normalizedRole = rawRole.toUpperCase().trim().replace(/[\s\_]+/g, '_');

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`page_permissions_${normalizedRole}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
  }

  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPER_ADMINISTRATOR') {
    return [
      '/dashboard',
      '/dashboard/tenant-employees',
      '/dashboard/users',
      '/dashboard/roles',
      '/dashboard/audit-logs',
      '/dashboard/profile'
    ];
  }

  if (normalizedRole === 'MANAGER' || normalizedRole === 'DEPT_MANAGER') {
    return [
      '/dashboard',
      '/dashboard/employee-management',
      '/dashboard/attendance',
      '/dashboard/shift-management',
      '/dashboard/leave-management',
      '/dashboard/my-attendance',
      '/dashboard/leave-request',
      '/dashboard/profile'
    ];
  }

  if (
    normalizedRole === 'HR_ADMIN' ||
    normalizedRole === 'HR_MANAGER' ||
    normalizedRole.includes('HR')
  ) {
    return [
      '/dashboard',
      '/dashboard/organization',
      '/dashboard/employee-management',
      '/dashboard/attendance',
      '/dashboard/shift-management',
      '/dashboard/leave-management',
      '/dashboard/payroll',
      '/dashboard/recruitment',
      '/dashboard/documents',
      '/dashboard/roles',
      '/dashboard/profile'
    ];
  }

  // EMPLOYEES
  return [
    '/dashboard',
    '/dashboard/my-attendance',
    '/dashboard/leave-request',
    '/dashboard/payslips',
    '/dashboard/my-documents',
    '/dashboard/profile'
  ];
}

export async function setRolePagePermissions(roleInput: any, allowedHrefs: string[]) {
  const rawRole = extractRoleName(roleInput);
  const normalizedRole = rawRole.toUpperCase().trim().replace(/[\s\_]+/g, '_');
  if (!normalizedRole) return;

  if (typeof window !== 'undefined') {
    localStorage.setItem(`page_permissions_${normalizedRole}`, JSON.stringify(allowedHrefs));
    window.dispatchEvent(new Event('hrms_permissions_updated'));
  }

  try {
    await api.post('/admin/role-page-permissions', {
      roleName: normalizedRole,
      allowedHrefs,
    });
    lastPermissionsFetchTime = 0;
  } catch (error) {
    console.error('Failed to persist role page permissions to backend:', error);
  }
}

let activePermissionsPromise: Promise<void> | null = null;
let lastPermissionsFetchTime = 0;
const PERMISSIONS_CACHE_TTL = 300000; // 5 minutes in-memory cache

export async function fetchAndSyncRolePagePermissions(force: boolean = false) {
  const now = Date.now();
  if (!force && lastPermissionsFetchTime > 0 && now - lastPermissionsFetchTime < PERMISSIONS_CACHE_TTL) {
    return;
  }

  if (activePermissionsPromise) {
    return activePermissionsPromise;
  }

  activePermissionsPromise = (async () => {
    try {
      const res = await api.get('/admin/role-page-permissions');
      const data = res.data?.data || res.data;
      if (data && typeof data === 'object') {
        let updated = false;
        Object.keys(data).forEach((roleKey) => {
          const hrefs = data[roleKey];
          if (Array.isArray(hrefs) && typeof window !== 'undefined') {
            const key = `page_permissions_${roleKey.toUpperCase()}`;
            const current = localStorage.getItem(key);
            const nextVal = JSON.stringify(hrefs);
            if (current !== nextVal) {
              localStorage.setItem(key, nextVal);
              updated = true;
            }
          }
        });
        if (updated && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('hrms_permissions_updated'));
        }
      }
      lastPermissionsFetchTime = Date.now();
    } catch (error) {
      // Silent fail if backend offline or unauthenticated
    } finally {
      activePermissionsPromise = null;
    }
  })();

  return activePermissionsPromise;
}

