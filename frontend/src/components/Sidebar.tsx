import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Wallet,
    History,
    Menu,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Sparkles,
    Settings,
    User,
    BrushCleaning,
    Combine,
} from 'lucide-react';
import { useProfileStore } from '../Store/profileStore';
import { useAuthStore } from '../Store/authStore';

const Sidebar = ({
    isOpen,
    onToggle,
}: {
    isOpen: boolean;
    onToggle: (val: boolean) => void;
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthRoute = location.pathname.startsWith('/auth');
    const currentUser = useAuthStore((state) => state.user);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isAuthRoute) return null;

    const isMobile = windowWidth < 1024;
    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        {
            icon: BrushCleaning,
            label: 'Folder Cleaner',
            path: '/folder-cleaner',
        },
        { icon: Combine, label: 'Question Merger', path: '/file-merger' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: History, label: 'History', path: '/history' },
    ];

    const bottomItems = [
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const userEmail = currentUser?.email || 'User';
    const getInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };
    const profilePic = useProfileStore((state) => state.profilePic);
    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onToggle(false)}
                        className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: isMobile ? 280 : isCollapsed ? 88 : 280,
                    x: isMobile && !isOpen ? -280 : 0,
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed top-0 z-[160] flex h-screen flex-col border-r border-slate-100 bg-white transition-colors lg:sticky ${isOpen && isMobile ? 'shadow-2xl' : ''}`}
            >
                {/* Toggle Button - Anchored to Sidebar Border */}
                <button
                    onClick={() => {
                        if (isMobile) {
                            onToggle(!isOpen);
                        } else {
                            setIsCollapsed(!isCollapsed);
                        }
                    }}
                    className={`group absolute top-12 right-0 z-[170] flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-100 bg-white text-slate-500 shadow-xl transition-all hover:scale-110 hover:text-purple-600 active:scale-95 ${
                        isMobile && !isOpen
                            ? 'translate-x-[110%]'
                            : 'translate-x-1/2'
                    }`}
                >
                    {(isMobile ? isOpen : !isCollapsed) ? (
                        <ChevronLeft
                            size={20}
                            className="transition-transform group-hover:-translate-x-0.5"
                        />
                    ) : (
                        <ChevronRight
                            size={20}
                            className="transition-transform group-hover:translate-x-0.5"
                        />
                    )}

                    {/* Subtle Pulse for visibility when closed on mobile */}
                    {isMobile && !isOpen && (
                        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-purple-500/10" />
                    )}
                </button>

                {/* Navigation Content Wrapper */}
                <div className="flex h-full flex-col overflow-hidden">
                    {/* Brand */}
                    <div className="flex shrink-0 items-center gap-3 overflow-hidden p-6 pb-12 md:p-8">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                            <span className="text-xl font-black">T</span>
                        </div>
                        {(!isCollapsed || isMobile) && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center"
                            >
                                <span className="text-xl leading-none font-black tracking-tight text-slate-900">
                                    idy Up
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2 px-4 text-slate-500">
                        <p
                            className={`mb-4 ml-4 h-4 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase transition-opacity ${isCollapsed && !isMobile ? 'opacity-0' : 'opacity-100'}`}
                        >
                            Main menu
                        </p>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => {
                                        navigate(item.path);
                                        if (isMobile) onToggle(false);
                                    }}
                                    className={`group relative flex w-full items-center gap-4 rounded-2xl p-4 transition-all ${
                                        isActive
                                            ? 'bg-purple-50 text-purple-600'
                                            : 'hover:bg-slate-50 hover:text-slate-900'
                                    } ${isCollapsed && !isMobile ? 'justify-center p-4' : ''}`}
                                >
                                    <item.icon
                                        size={22}
                                        className={
                                            isActive
                                                ? 'text-purple-600'
                                                : 'transition-colors group-hover:text-purple-600'
                                        }
                                    />
                                    {(!isCollapsed || isMobile) && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-sm font-bold whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-bar"
                                            className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-purple-600"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                    <div className="space-y-2 px-4 py-8">
                        {bottomItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`group relative flex w-full items-center gap-4 rounded-2xl p-4 transition-all ${
                                        isActive
                                            ? 'bg-purple-50 text-purple-600'
                                            : 'hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <item.icon
                                        size={22}
                                        className={
                                            isActive
                                                ? 'text-purple-600'
                                                : 'transition-colors group-hover:text-purple-600'
                                        }
                                    />
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-sm font-bold text-slate-500 group-hover:text-slate-900"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {/* User Section */}
                    <div className="mt-auto border-t border-slate-100 p-4">
                        <div
                            className={`flex items-center gap-3 overflow-hidden rounded-2xl bg-slate-50 p-3 ${isCollapsed && !isMobile ? 'justify-center' : ''}`}
                        >
                            <div className="group relative">
                                {profilePic ? (
                                    <img
                                        src={profilePic}
                                        alt="Profile"
                                        className="h-10 w-10 rounded-full border-2 border-slate-200 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-purple-100 text-sm font-bold text-purple-600">
                                        {getInitials(userEmail)}
                                    </div>
                                )}
                            </div>

                            {(!isCollapsed || isMobile) && (
                                <div className="min-w-0 flex-1 overflow-hidden">
                                    <p className="truncate text-xs font-bold tracking-tight text-slate-900 uppercase">
                                        {userEmail}
                                    </p>
                                    <p className="mt-0.5 text-[10px] font-bold tracking-widest text-purple-600 uppercase">
                                        Signed In
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
