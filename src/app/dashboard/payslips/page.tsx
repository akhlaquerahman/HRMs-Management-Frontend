import { Metadata } from 'next';
import { PayrollManagementClient } from './components/PayrollManagementClient';

export const metadata: Metadata = {
  title: 'Payslips & Payroll - HRMS',
  description: 'View and manage your payslips and payroll details',
};

export default function PayslipsPage() {
  return <PayrollManagementClient />;
}
