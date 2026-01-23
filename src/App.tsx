import FolderCleanerUI from '../components/Cleaner';
import BillingPage from '../components/Billing';
import FolderQuestionAnalyzer from '../components/Merger';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UpgradeModal } from '../components/Popup';
function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<FolderCleanerUI />} />
                    <Route path="/billing" element={<BillingPage />} />
                    <Route
                        path="/file-merge"
                        element={<FolderQuestionAnalyzer />}
                    />
                    <Route path="/upgrade-modal" element={<UpgradeModal />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
