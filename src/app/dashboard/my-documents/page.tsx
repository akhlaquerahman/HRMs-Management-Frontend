import { Metadata } from 'next';
import { DocumentVaultClient } from './components/DocumentVaultClient';

export const metadata: Metadata = {
  title: 'My Documents - HRMS',
  description: 'Manage, upload and securely access your documents in the enterprise vault.',
};

export default function MyDocumentsPage() {
  return <DocumentVaultClient />;
}
