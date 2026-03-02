import ErrorToast from './components/ErrorToast';
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
//import { UpgradeModal } from './components/Popup';
//import WelcomeModal from './Pages/WelcomePage';
//import Header from './components/Header';
function App() {
    return (
        <>
            <ErrorToast />
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
