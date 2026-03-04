import ErrorToast from './components/ErrorToast';
import SuccessToast from './components/SuccessToast';
import Pricing from './components/Pricing';
import AuthForm from './Pages/Auth';
import FolderCleanerUI from './Pages/Cleaner';
//import BillingPage from './Pages/Billing';
//import FolderQuestionAnalyzer from './Pages/Merger';
import {
    BrowserRouter,
    Routes,
    Route,
    //Outlet,
    //Navigate,
} from 'react-router-dom';
import { useEffect, useRef } from 'react';
import createClientLogger from './utils/clientLogger';
import handleApiError from './utils/apiError';
import useErrorStore from './Store/ErrorStore';
import { useAuthStore } from './Store/authStore';
const log = createClientLogger('App.tsx');
//import { UpgradeModal } from './components/Popup';
//import WelcomeModal from './Pages/WelcomePage';
//import Header from './components/Header';
/** 
 
Method	Name	React-Ractive?	Use Case
useAuthStore(selector)	Selector hooks	✅ Yes (specific)	React components - when you need reactivity
useAuthStore()	Full store hook	✅ Yes (all)	Avoid unless necessary
useAuthStore.getState()	Store getters	❌ No	Non-React code (interceptors, helpers, outside components)
*/
function App() {
    const { setError } = useErrorStore();
    const refreshExecuted = useRef(false);

    const refreshAuth = useAuthStore((state) => state.refresh);

    useEffect(() => {
        if (refreshExecuted.current) {
            log.warn('refresh already executed skipping duplicate');
            return;
        }
        const restoreSession = async () => {
            refreshExecuted.current = true;
            try {
                await refreshAuth();
                log.info('Session restored');
                const currentUser = useAuthStore.getState().user;
                const currentAuth = useAuthStore.getState().isAuthenticated;
                log.debug(`is authenticated ${currentAuth}`);
                log.highlight(`Log in as ${currentUser?.email}`);
            } catch (error) {
                handleApiError(error, setError);
            }
        };
        restoreSession();
    }, [refreshAuth, setError]);
    return (
        <>
            <ErrorToast />
            <SuccessToast />
            <BrowserRouter>
                <Routes>
                    {/*<Route element={<AppLayout />}>
                        <Route
                            path="/"
                            element={<Navigate to="/welcome" replace />}
                        />
                        <Route path="/welcome" element={<WelcomeModal />} />*/}
                    <Route path="/auth" element={<AuthForm />} />

                    <Route path="/" element={<FolderCleanerUI />} />
                    <Route path="/pricing" element={<Pricing />} />
                    {/*<Route path="/billing" element={<BillingPage />} />
                        <Route
                            path="/file-merge"
                            element={<FolderQuestionAnalyzer />}
                        />
                        <Route
                            path="/upgrade-modal"
                            element={<UpgradeModal />}
                        />*/}
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
{
    /*function AppLayout() {
    return (
        <>
            <Header />
            <Outlet />
        </>
    );
}*/
}
