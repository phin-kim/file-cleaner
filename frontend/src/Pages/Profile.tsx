import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FaArrowLeft,
    FaUser,
    FaEnvelope,
    FaShieldAlt,
    FaSignOutAlt,
    FaTrashAlt,
} from 'react-icons/fa';
import { useState } from 'react';
import { useAuthStore } from '../Store/authStore';
import createClientLogger from '../utils/clientLogger';
const log = createClientLogger('Profile.tsx');
import { Trash2 } from 'lucide-react';
const Profile: React.FC = () => {
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const logout = useAuthStore((state) => state.logout);
    const deleteAccount = useAuthStore((state) => state.deleteAccount);
    //const navigate = useNavigate();
    const handleDeleteAccount = async () => {
        if (deleteConfirm === 'DELETE') {
            setIsDeleting(true);
            try {
                await deleteAccount();
                //navigate('/');
            } catch (error) {
                console.error('Failed to delete account:', error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    // Mock user data based on the provided image
    const currentUser = useAuthStore((state) => state.user);
    const email = currentUser?.email;
    // 1. Declare the variable to hold the raw date
    let createdAtRaw;

    const storage = localStorage.getItem('auth-storage');

    if (!storage) {
        // 2. Fallback to Zustand state
        createdAtRaw = useAuthStore((state) => state.createdAt);
        log.debug('Reading created at from state');
    } else {
        // 3. Read from LocalStorage
        try {
            const parsed = JSON.parse(storage);
            createdAtRaw = parsed.state.user?.createdAt;
            log.debug('Reading created at from local storage');
        } catch (err) {
            log.error('Failed to parse auth-storage');
        }
    }

    // 4. Format the date ONLY after you've retrieved the value
    const formatDate = createdAtRaw
        ? new Date(createdAtRaw).toLocaleString()
        : 'N/A';

    // Now you can use formatDate in your UI
    const userData = {
        email: email,
        signInMethod: 'Email & password',
        accountCreated: formatDate,
        //lastSignIn: 'Apr 24, 2026, 11:52 AM',
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
            <div className="mx-auto max-w-3xl">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-4xl font-bold text-indigo-600"
                >
                    Settings
                </motion.h1>

                <div className="space-y-6">
                    {/* Account Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
                    >
                        <div className="mb-8 flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <FaUser size={16} />
                            </div>
                            <h2 className="text-xl font-bold">Account</h2>
                        </div>

                        <div className="grid gap-8">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Email
                                    </p>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <FaEnvelope size={14} />
                                        <span className="font-medium">
                                            {userData.email}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Sign-in Method
                                    </p>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <FaShieldAlt size={14} />
                                        <span className="font-medium">
                                            {userData.signInMethod}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                <div>
                                    <p className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Account Created
                                    </p>
                                    <p className="font-medium text-slate-700">
                                        {userData.accountCreated}
                                    </p>
                                </div>
                                <div>
                                    {/*<p className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                        Last Sign-in
                                    </p>
                                    <p className="font-medium text-slate-700">
                                        {userData.lastSignIn}
                                    </p>*/}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Session Section */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
                    >
                        <h2 className="mb-2 text-xl font-bold">Session</h2>
                        <p className="mb-6 text-sm text-slate-500">
                            Sign out on this device. You will need to sign in
                            again to use your workspace.
                        </p>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-2 font-bold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            <FaSignOutAlt />
                            Sign out
                        </button>
                    </motion.section>

                    {/* Danger Zone Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-3xl border border-red-100 bg-red-50/50 p-8"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                <Trash2 size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-red-900">
                                Danger Zone
                            </h2>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-[#1C0D0D] p-8 text-white shadow-2xl">
                            <div className="relative z-10 mb-4 flex items-start gap-4">
                                <div className="rounded-lg bg-red-500/20 p-2 text-red-500">
                                    <Trash2 size={20} />
                                </div>
                                <h3 className="text-lg font-bold">
                                    Delete account and data
                                </h3>
                            </div>
                            <p className="relative z-10 mb-8 max-w-xl text-sm leading-relaxed text-red-200/70">
                                Permanently delete your Tidy Up account and the
                                information we store for you. You will not be
                                able to sign back in or recover this account.
                            </p>

                            <div className="relative z-10 space-y-6">
                                <div>
                                    <label className="mb-3 ml-1 block text-[10px] font-black tracking-[0.2em] text-red-400/80 uppercase">
                                        TYPE{' '}
                                        <span className="text-red-500">
                                            DELETE
                                        </span>{' '}
                                        TO CONFIRM
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirm}
                                        onChange={(e) =>
                                            setDeleteConfirm(e.target.value)
                                        }
                                        placeholder="DELETE"
                                        className="w-full max-w-md border-b border-red-900/50 bg-black/40 p-4 text-lg font-black tracking-widest text-white uppercase transition-colors placeholder:text-red-900/20 focus:border-red-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setDeleteConfirm('')}
                                        className="rounded-xl border border-white/5 bg-white/5 px-6 py-3 text-sm font-bold transition-all hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            deleteConfirm !== 'DELETE' ||
                                            isDeleting
                                        }
                                        onClick={handleDeleteAccount}
                                        className={`min-w-[200px] rounded-xl px-8 py-3 text-sm font-bold shadow-lg transition-all ${
                                            deleteConfirm === 'DELETE' &&
                                            !isDeleting
                                                ? 'cursor-pointer bg-red-600 text-white shadow-red-600/20 hover:bg-red-700 active:scale-95'
                                                : 'cursor-not-allowed border border-red-900/20 bg-red-900/20 text-red-900/50'
                                        }`}
                                    >
                                        {isDeleting ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                <span>Deleting...</span>
                                            </div>
                                        ) : (
                                            'Permanently delete account'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Artistic background blur elements */}
                            <div className="absolute top-[-20%] right-[-10%] h-64 w-64 rounded-full bg-red-600/10 blur-[80px]" />
                            <div className="absolute bottom-[-20%] left-[-10%] h-64 w-64 rounded-full bg-red-900/20 blur-[80px]" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
