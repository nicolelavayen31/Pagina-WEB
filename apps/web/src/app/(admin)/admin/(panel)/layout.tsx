import { AdminShell } from '@/modules/admin/components/admin-shell';

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
