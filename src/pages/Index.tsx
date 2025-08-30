import { TripDashboard } from '@/components/TripDashboard';
import AuthGuard from '@/components/AuthGuard';

const Index = () => {
  return (
    <AuthGuard>
      <TripDashboard />
    </AuthGuard>
  );
};

export default Index;
