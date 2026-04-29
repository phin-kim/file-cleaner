import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { PiBroomBold } from 'react-icons/pi';
const Header = () => {
    const navigate = useNavigate();
    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-linear-to-br from-purple-800 to-violet-900">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div
                    className="flex cursor-pointer items-center gap-2"
                    onClick={() => navigate('/home')}
                >
                    <div className="bg-gradient-purple-blue flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white">
                        <PiBroomBold className="text-2xl" />
                    </div>
                    <span className="text-xl font-bold text-slate-100">
                        Tidy up
                    </span>
                </div>

                <button
                    onClick={() => navigate('/home')}
                    className="group flex w-[10em] items-center justify-center gap-1 rounded-4xl bg-slate-200 p-2 text-sm font-medium text-slate-900 transition-colors hover:text-indigo-600"
                >
                    <FaArrowLeftLong className="transition-all duration-150 group-hover:-translate-x-3" />
                    Switch Tool
                </button>
            </div>
        </header>
    );
};
export default Header;
