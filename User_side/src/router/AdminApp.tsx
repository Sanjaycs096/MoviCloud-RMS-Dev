// Wrapper component that imports Admin App
// This allows us to reuse the existing Admin application without duplication

import AdminAppComponent from '@admin/app/App';

export function AdminApp() {
  // The AdminAppComponent already includes AuthProvider and SystemConfigProvider
  return <AdminAppComponent />;
}
