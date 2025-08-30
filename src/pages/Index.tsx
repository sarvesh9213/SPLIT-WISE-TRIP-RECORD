import { TripDashboard } from '@/components/TripDashboardNew';
import AuthGuard from '@/components/AuthGuard';

const Index = () => {
  return (
    <AuthGuard>
      <TripDashboard />
    </AuthGuard>
  );
};

export default Index;
