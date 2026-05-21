import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    //FaArrowLeft,
    FaUser,
    FaEnvelope,
    FaShieldAlt,
    FaSignOutAlt,
    FaTrashAlt,
    FaCamera,
    FaChevronDown,
    FaUpload,
    FaImage,
} from 'react-icons/fa';

import { useState } from 'react';
import { useAuthStore } from '../Store/authStore';
import createClientLogger from '../utils/clientLogger';
const log = createClientLogger('Profile.tsx');
import { Trash2 } from 'lucide-react';
import { useProfileStore } from '../Store/profileStore';
import authApi from '../library/authApi';
import { welcomePageApi } from '../library/client';
import useSuccessStore from '../Store/SuccessStore';
import useErrorStore from '../Store/ErrorStore';
const Profile: React.FC = () => {
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const logout = useAuthStore((state) => state.logout);
    const deleteAccount = useAuthStore((state) => state.deleteAccount);
    const navigate = useNavigate();
    const handleDeleteAccount = async () => {
        if (deleteConfirm === 'DELETE') {
            setIsDeleting(true);
            try {
                await deleteAccount();
                navigate('/');
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
    const createdAtStore = useAuthStore((state) => state.createdAt);
    const accountCreated = createdAtStore
        ? new Date(createdAtStore).toLocaleString()
        : currentUser?.createdAt
          ? new Date(currentUser.createdAt).toLocaleString()
          : 'N/A';

    // Now you can use formatDate in your UI
    const userData = {
        email: email,
        signInMethod: 'Email & password',
        accountCreated,
        //lastSignIn: 'Apr 24, 2026, 11:52 AM',
    };

    const profilePic = useProfileStore((state) => state.profilePic);
    const setProfilePic = useProfileStore((state) => state.setProfilePic);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsUploadDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    const processFile = async (file: File) => {
        if (file && file.type.startsWith('image/')) {
            const previousPic = profilePic;
            const objectUrl = URL.createObjectURL(file);
            setProfilePic(objectUrl);
            setIsUploadDropdownOpen(false);
            setIsUploading(true);

            const formData = new FormData();
            formData.append('image', file);
            try {
                const { data } = await authApi.post(
                    '/auth/profile-image',
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }
                );
                setProfilePic(
                    typeof data?.profileImageUrl === 'string'
                        ? data.profileImageUrl
                        : null
                );
                useSuccessStore
                    .getState()
                    .setSuccess('Profile photo updated successfully!');
            } catch (error) {
                setProfilePic(previousPic);
                log.error('Failed to upload profile photo', {
                    data: { error },
                });
                useErrorStore
                    .getState()
                    .setError('Failed to save profile photo. Please try again.');
            } finally {
                setIsUploading(false);
                URL.revokeObjectURL(objectUrl);
            }
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) void processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void processFile(file);
    };

    const handleRemovePhoto = async () => {
        const previousPic = profilePic;
        setProfilePic(null);
        setIsUploadDropdownOpen(false);
        setIsUploading(true);
        try {
            await authApi.delete('/auth/profile-image');
            useSuccessStore
                .getState()
                .setSuccess('Profile photo removed successfully!');
        } catch (error) {
            setProfilePic(previousPic);
            log.error('Failed to remove profile photo', { data: { error } });
            useErrorStore
                .getState()
                .setError('Failed to remove profile photo. Please try again.');
        } finally {
            setIsUploading(false);
        }
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
                        <div className="mb-12 flex flex-col items-center gap-8 border-b border-slate-100 pb-12 md:flex-row">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`group relative transition-all duration-300 ${isDragging ? 'scale-110' : ''}`}
                            >
                                {profilePic ? (
                                    <img
                                        src={profilePic}
                                        alt="Profile"
                                        className={`h-32 w-32 rounded-full border-4 object-cover shadow-xl transition-all ${isDragging ? 'border-purple-500' : 'border-white'} group-hover:opacity-90`}
                                    />
                                ) : (
                                    <div
                                        className={`flex h-32 w-32 items-center justify-center rounded-full border-4 text-4xl font-bold shadow-xl transition-all ${isDragging ? 'border-purple-500 bg-purple-200 text-purple-700' : 'border-white bg-purple-100 text-purple-600'}`}
                                    >
                                        {getInitials(email || 'NA')}
                                    </div>
                                )}
                                <div className="absolute right-0 bottom-0 rounded-full border border-slate-100 bg-white p-2 text-slate-400 shadow-lg">
                                    <FaCamera size={14} />
                                </div>
                                {isDragging && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-dashed border-purple-500 bg-purple-600/20 backdrop-blur-xs">
                                        <div className="animate-bounce text-purple-600">
                                            <FaUpload size={24} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-4 md:items-start">
                                <div className="text-center md:text-left">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Profile Photo
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Upload a photo to personalize your
                                        account. You can drag and drop here.
                                    </p>
                                </div>

                                <div className="relative" ref={dropdownRef}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <button
                                                disabled={isUploading}
                                                onClick={() =>
                                                    setIsUploadDropdownOpen(
                                                        !isUploadDropdownOpen
                                                    )
                                                }
                                                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold text-white shadow-md transition-all active:scale-95 ${
                                                    isUploading
                                                        ? 'cursor-not-allowed bg-purple-400'
                                                        : 'bg-purple-600 shadow-purple-100 hover:bg-purple-500'
                                                }`}
                                            >
                                                {isUploading ? (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                ) : null}
                                                {isUploading
                                                    ? 'Saving...'
                                                    : 'Change Photo'}
                                                {!isUploading && (
                                                    <span
                                                        className={`transition-transform duration-300 ${isUploadDropdownOpen ? 'rotate-180' : ''}`}
                                                    >
                                                        <FaChevronDown
                                                            size={12}
                                                        />
                                                    </span>
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {isUploadDropdownOpen && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            y: 10,
                                                            scale: 0.95,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                            scale: 1,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: 10,
                                                            scale: 0.95,
                                                        }}
                                                        className="absolute top-full left-0 z-50 mt-2 w-64 origin-top-left overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl"
                                                    >
                                                        <div className="mb-1 border-b border-slate-50 px-4 py-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                                            Options
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                fileInputRef.current?.click();
                                                                setIsUploadDropdownOpen(
                                                                    false
                                                                );
                                                            }}
                                                            className="group flex w-full items-center gap-3 px-4 py-3 text-left text-slate-700 transition-colors hover:bg-purple-50"
                                                        >
                                                            <div className="rounded-xl bg-purple-100 p-2 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                                                <FaUpload
                                                                    size={14}
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">
                                                                    Upload from
                                                                    device
                                                                </p>
                                                                <p className="text-[10px] text-slate-500">
                                                                    Pick a file
                                                                    from your
                                                                    computer
                                                                </p>
                                                            </div>
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                /* library logic */ setIsUploadDropdownOpen(
                                                                    false
                                                                );
                                                            }}
                                                            className="group flex w-full items-center gap-3 px-4 py-3 text-left text-slate-700 transition-colors hover:bg-violet-50"
                                                        >
                                                            <div className="rounded-xl bg-violet-100 p-2 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
                                                                <FaImage
                                                                    size={14}
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">
                                                                    Select from
                                                                    library
                                                                </p>
                                                                <p className="text-[10px] text-slate-500">
                                                                    Choose from
                                                                    existing
                                                                    assets
                                                                </p>
                                                            </div>
                                                        </button>

                                                        {profilePic && (
                                                            <button
                                                                onClick={
                                                                    handleRemovePhoto
                                                                }
                                                                className="group mt-1 flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-red-600 transition-colors hover:bg-red-50"
                                                            >
                                                                <div className="rounded-xl bg-red-100 p-2 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                                                                    <FaTrashAlt
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-bold">
                                                                    Remove
                                                                    current
                                                                    photo
                                                                </span>
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {profilePic && (
                                            <button
                                                onClick={handleRemovePhoto}
                                                className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-bold text-slate-700 transition-all hover:bg-slate-50"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                            </div>
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
                            onClick={async () => {
                                await logout();
                                navigate('/');
                            }}
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
                                        className="w-full max-w-md border-b border-red-900/50 bg-black/40 p-4 text-lg font-black tracking-widest text-white transition-colors placeholder:text-red-900/20 focus:border-red-500 focus:outline-none"
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
                                        className={`min-w-50 rounded-xl px-8 py-3 text-sm font-bold shadow-lg transition-all ${
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
