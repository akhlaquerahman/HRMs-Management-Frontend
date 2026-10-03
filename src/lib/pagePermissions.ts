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
  { id: 'tenant-employees', title: 'Tenant Employees', href: '/dashboard/tenant-employees', category: 'Administration' },
  { id: 'my-attendance', title: 'My Attendance', href: '/dashboard/my-attendance', category: 'Employee Self-Service' },
  { id: 'leave-request', title: 'Leave Request', href: '/dashboard/leave-request', category: 'Employee Self-Service' },
  { id: 'payslips', title: 'Payslips', href: '/dashboard/payslips', category: 'Employee Self-Service' },
  { id: 'my-documents', title: 'My Documents', href: '/dashboard/my-documents', category: 'Employee Self-Service' },
  { id: 'profile', title: 'Profile', href: '/dashboard/profile', category: 'Core' },
];

export const SUPER_ADMIN_ONLY_PAGES = [
  '/dashboard/tenant-employees',
  '/dashboard/users',
  '/dashboard/roles',
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
  if (!rawRole) return DEFAULT_HR_PAGES;

  const normalizedRole = rawRole.toUpperCase().trim().replace(/[\s\_]+/g, '_');
  
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'SUPER_ADMINISTRATOR') {
    return ALL_MANAGEABLE_PAGES.map(p => p.href).concat(SUPER_ADMIN_ONLY_PAGES);
  }

  try {
    const keysToTry = [
      `hrms_page_permissions_${normalizedRole}`,
      ...(normalizedRole.includes('HR') ? ['hrms_page_permissions_HR_MANAGER', 'hrms_page_permissions_HR_ADMIN'] : []),
      ...(normalizedRole.includes('EMPLOYEE') ? ['hrms_page_permissions_EMPLOYEE'] : [])
    ];

    for (const key of keysToTry) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Return saved permissions strictly filtered to exclude Super Admin only pages
          return parsed.filter((href: string) => !SUPER_ADMIN_ONLY_PAGES.includes(href));
        }
      }
    }
  } catch (e) {
    console.error('Error reading page permissions', e);
  }

  // Default permissions for ANY HR role if no custom permission has been saved yet
  if (
    normalizedRole.includes('HR') || 
    normalizedRole === 'HR_MANAGER' || 
    normalizedRole === 'HR_ADMIN' ||
    normalizedRole === 'HR_MANAGEMENT'
  ) {
    return DEFAULT_HR_PAGES;
  }

  // Default permissions for EMPLOYEE
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

  try {
    const payload = JSON.stringify(allowedHrefs);
    localStorage.setItem(`hrms_page_permissions_${normalizedRole}`, payload);

    if (normalizedRole.includes('HR') || normalizedRole === 'HR_MANAGER' || normalizedRole === 'HR_ADMIN') {
      localStorage.setItem('hrms_page_permissions_HR_MANAGER', payload);
      localStorage.setItem('hrms_page_permissions_HR_ADMIN', payload);
    } else if (normalizedRole.includes('EMPLOYEE')) {
      localStorage.setItem('hrms_page_permissions_EMPLOYEE', payload);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hrms_permissions_updated'));
      window.dispatchEvent(new StorageEvent('storage', {
        key: `hrms_page_permissions_${normalizedRole}`,
        newValue: payload
      }));
    }

    // Persist to Database via API
    await api.post('/admin/role-page-permissions', {
      roleName: normalizedRole,
      allowedHrefs
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving page permissions', e);
  }
}

export async function fetchAndSyncRolePagePermissions() {
  try {
    const res = await api.get('/admin/role-page-permissions');
    if (res.data?.success && res.data?.data) {
      const permissionsMap = res.data.data;
      let hasChanges = false;
      Object.keys(permissionsMap).forEach(roleKey => {
        const payload = JSON.stringify(permissionsMap[roleKey]);
        const keysToSet = [
          `hrms_page_permissions_${roleKey}`,
          ...(roleKey.includes('HR') ? ['hrms_page_permissions_HR_MANAGER', 'hrms_page_permissions_HR_ADMIN'] : []),
          ...(roleKey.includes('EMPLOYEE') ? ['hrms_page_permissions_EMPLOYEE'] : [])
        ];

        keysToSet.forEach(k => {
          const existing = localStorage.getItem(k);
          if (existing !== payload) {
            localStorage.setItem(k, payload);
            hasChanges = true;
          }
        });
      });
      if (hasChanges && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('hrms_permissions_updated'));
      }
    }
  } catch (e) {
    // Silent fail if network issue
  }
}


