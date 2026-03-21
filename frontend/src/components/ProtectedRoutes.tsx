import { Navigate, Outlet } from 'react-router-dom';
import createClientLogger from '../utils/clientLogger';
import { useAuthStore } from '../Store/authStore';
import LoadingScreen from './Loader';
const log = createClientLogger('ProtectedRoutes');
function ProtectedRoutes() {
    const hasHydrated = useAuthStore((state) => state._hasHydrated);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    if (!hasHydrated) {
        return <LoadingScreen />;
    }
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    log.info('Protected routes', {
        data: user,
    });

    return <Outlet />;
}
export default ProtectedRoutes;
