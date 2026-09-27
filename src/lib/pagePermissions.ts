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
  { id: 'org-setup', title: 'Organization Setup', href: '/dashboard/org-setup', category: 'HR Management' },
  { id: 'attendance', title: 'Attendance Management', href: '/dashboard/attendance', category: 'HR Management' },
  { id: 'leave-management', title: 'Leave Management', href: '/dashboard/leave-management', category: 'HR Management' },
  { id: 'payroll', title: 'Payroll', href: '/dashboard/payroll', category: 'HR Management' },
  { id: 'recruitment', title: 'Recruitment', href: '/dashboard/recruitment', category: 'HR Management' },
  { id: 'documents', title: 'Documents Management', href: '/dashboard/documents', category: 'HR Management' },
  { id: 'my-attendance', title: 'My Attendance', href: '/dashboard/my-attendance', category: 'Employee Self-Service' },
  { id: 'leave-request', title: 'Leave Request', href: '/dashboard/leave-request', category: 'Employee Self-Service' },
  { id: 'payslips', title: 'Payslips', href: '/dashboard/payslips', category: 'Employee Self-Service' },
  { id: 'my-documents', title: 'My Documents', href: '/dashboard/my-documents', category: 'Employee Self-Service' },
  { id: 'profile', title: 'Profile', href: '/dashboard/profile', category: 'Core' },
];

export const DEFAULT_HR_PAGES = ALL_MANAGEABLE_PAGES.map(p => p.href);

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
    return ALL_MANAGEABLE_PAGES.map(p => p.href).concat([
      '/dashboard/users',
      '/dashboard/roles',
      '/dashboard/audit-logs'
    ]);
  }

  try {
    const keysToTry = [
      `hrms_page_permissions_${normalizedRole}`,
      `hrms_page_permissions_HR_MANAGER`,
      `hrms_page_permissions_HR_ADMIN`
    ];

    for (const key of keysToTry) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Error reading page permissions', e);
  }

  // Default permissions for ANY HR role if no custom permission is set
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

export function setRolePagePermissions(roleInput: any, allowedHrefs: string[]) {
  const rawRole = extractRoleName(roleInput);
  const normalizedRole = rawRole.toUpperCase().trim().replace(/[\s\_]+/g, '_');
  
  try {
    const payload = JSON.stringify(allowedHrefs);
    localStorage.setItem(`hrms_page_permissions_${normalizedRole}`, payload);
    localStorage.setItem(`hrms_page_permissions_HR_MANAGER`, payload);
    localStorage.setItem(`hrms_page_permissions_HR_ADMIN`, payload);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hrms_permissions_updated'));
    }
  } catch (e) {
    console.error('Error saving page permissions', e);
  }
}
