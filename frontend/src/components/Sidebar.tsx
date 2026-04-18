import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Wallet,
    History,
    User,
    Settings,
    ChevronLeft,
    ChevronRight,
    BrushCleaning,
    Combine,
} from 'lucide-react';
import { useAuthStore } from '../Store/authStore';
const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthRoute = location.pathname.startsWith('/auth');
    const currentUser = useAuthStore.getState()?.user;

    if (isAuthRoute) return null;

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

    /*const bottomItems = [
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];*/

    const userEmail = currentUser?.email;

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 88 : 280 }}
            className="relative z-100 flex h-full shrink-0 flex-col self-stretch border-r border-slate-100 bg-white"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-8 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:text-purple-600"
            >
                {isCollapsed ? (
                    <ChevronRight size={14} />
                ) : (
                    <ChevronLeft size={14} />
                )}
            </button>

            <div className="flex items-center gap-1.5 overflow-hidden p-8 pb-12">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                    <span className="text-xl font-black">T</span>
                </div>
                {!isCollapsed && (
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
                    className={`mb-4 ml-4 h-4 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase transition-opacity ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}
                >
                    Main menu
                </p>
                {navItems.map((item) => {
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
                                    className="text-sm font-bold"
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

            {/* Bottom Nav 
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
            </div>*/}

            {/* User Section */}
            <div className="mt-auto border-t border-slate-100 p-4">
                <div
                    className={`flex items-center gap-3 overflow-hidden rounded-2xl bg-slate-50 p-3 ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-200 text-sm font-black text-slate-900">
                        {userEmail?.substring(0, 2).toUpperCase()}
                    </div>
                    {!isCollapsed && (
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
        </motion.aside>
    );
};

export default Sidebar;
