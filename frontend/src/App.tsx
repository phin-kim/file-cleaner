import ErrorToast from './components/ErrorToast';
import SuccessToast from './components/SuccessToast';
import Pricing from './Pages/Pricing';
import AuthForm from './Pages/Auth';
import FolderCleanerUI from './Pages/Cleaner';
import BillingPage from './Pages/Billing';
import FolderQuestionAnalyzer from './Pages/Merger';
import {
    BrowserRouter,
    Routes,
    Route,
    Outlet,
    //Navigate,
} from 'react-router-dom';
import { useEffect, useRef } from 'react';
import createClientLogger from './utils/clientLogger';
import handleApiError from './utils/apiError';
import useErrorStore from './Store/ErrorStore';
import { useAuthStore } from './Store/authStore';
const log = createClientLogger('App.tsx');
//import { UpgradeModal } from './components/Popup';
import WelcomeModal from './Pages/WelcomePage';
import Breadcrumb from './components/Navbar';
import ProtectedRoutes from './components/ProtectedRoutes';
import AllTools from './Pages/Alltools';
import { welcomePageApi } from './library/client';
import { useTierStore } from './Store/tierStore';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetSuccess from './components/Auth/ResetSuccess';
import ResetPassword from './components/Auth/ResetPassword';

/** 
 
Method	Name	React-Reactive?	Use Case
useAuthStore(selector)	Selector hooks	✅ Yes (specific)	React components - when you need reactivity
useAuthStore()	Full store hook	✅ Yes (all)	Avoid unless necessary
useAuthStore.getState()	Store getters	❌ No	Non-React code (interceptors, helpers, outside components)
*/
function App() {
    const refreshExecuted = useRef(false);
    const setTierId = useTierStore((state) => state.setTierId);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    log.debug(
        `State of is authenticated after the fetch in app.tsx isAuthenticated: ${isAuthenticated}`
    );
    useEffect(() => {
        if (refreshExecuted.current) {
            log.warn('refresh already executed skipping duplicate');
            return;
        }
        const restoreSession = async () => {
            refreshExecuted.current = true;
            /**
             *  Only restore session if there was a previous session
             * this return caused the refresh endpoint to being hit hence i had to log in every time
             * if (!hasStoredSession) {
                return; }
            */

            try {
                /*const hasSession = localStorage.getItem('hasSession');
                if (!hasSession) {
                    log.info('No stored session skipping refresh');
                    return;
                } else {
                    log.info('Session present');
                }*/
                const refresh = useAuthStore.getState().refresh;

                await refresh();
                const currentUser = useAuthStore.getState().user;
                const currentAuth = useAuthStore.getState().isAuthenticated;
                if (currentAuth) {
                    log.info('Session restored');
                    const response = await welcomePageApi.get('/fetch-profile');
                    log.debug('The fetch profile response ', {
                        data: response,
                    });
                    setTierId(response.data.tierId);
                    log.info(`Tier synchronized: ${response.data.tierId}`);
                    const syncProfile = async () => {
                        const dbUser = response.data;

                        // Overwrite LocalStorage with the fresh DB data
                        const syncStats = {
                            count: dbUser.dailyUsageCount,
                            lastDate: new Date(
                                dbUser.lastUsageDate
                            ).toDateString(),
                        };
                        localStorage.setItem(
                            'upload-stats',
                            JSON.stringify(syncStats)
                        );
                    };

                    syncProfile();
                } else {
                    log.warn('Session restoration failed no valid session');
                    log.error('Failed to sync tier');
                    setTierId('free');
                }
                log.debug(`is authenticated ${currentAuth}`);
                log.highlight(`Logged in as ${currentUser?.email}`);
            } catch (error) {
                log.error('Initialization failed', { data: { error } });
                const { setError } = useErrorStore.getState();
                handleApiError(error, setError);
                setTierId('free');
            }
        };
        restoreSession();
    }, [setTierId]);

    return (
        <>
            <ErrorToast />
            <SuccessToast />
            <BrowserRouter>
                {/**
                        <Route
                            path="/file-merge"
                            element={<FolderQuestionAnalyzer />}
                        />
                        <Route
                            path="/upgrade-modal"
                            element={<UpgradeModal />}
                        /> */}
                <Routes>
                    <Route path="/auth" element={<AuthForm />} />
                    <Route
                        path="/auth/forgot-password"
                        element={<ForgotPassword />}
                    />
                    <Route
                        path="/auth/reset-success"
                        element={<ResetSuccess />}
                    />
                    <Route
                        path="/auth/reset-password"
                        element={<ResetPassword />}
                    />
                    <Route element={<ProtectedRoutes />}>
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<WelcomeModal />} />

                            <Route
                                path="/folder-cleaner"
                                element={<FolderCleanerUI />}
                            />
                            <Route
                                path="/file-merger"
                                element={<FolderQuestionAnalyzer />}
                            />
                            <Route path="/all-tools" element={<AllTools />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route
                                path="/pricing/billing"
                                element={<BillingPage />}
                            />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;

function AppLayout() {
    return (
        <>
            <Breadcrumb />
            <Outlet />
        </>
    );
}
