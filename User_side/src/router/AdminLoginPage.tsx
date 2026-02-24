// Wrapper component that imports Admin LoginPage
// This allows us to reuse the existing Admin login without duplication

import { LoginPage } from '@admin/app/components/login-page';
import { AuthProvider } from '@admin/utils/auth-context';
import { SystemConfigProvider } from '@admin/utils/system-config-context';

export function AdminLoginPage() {
  return (
    <AuthProvider>
      <SystemConfigProvider>
        <LoginPage />
      </SystemConfigProvider>
    </AuthProvider>
  );
}
