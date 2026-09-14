import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import {
    deleteAccount,
    fetchProfile,
    removeProfileImage,
    uploadProfileImage,
} from '../controllers/userController';
import multer from 'multer';
export const userRouter: Router = Router();

const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
userRouter.get('/fetch-profile', authenticate, asyncHandler(fetchProfile));
userRouter.post(
    '/fetch-profile',
    authenticate,
    profileUpload.single('image'),
    asyncHandler(uploadProfileImage)
);
userRouter.delete(
    '/profile-image',
    authenticate,
    asyncHandler(removeProfileImage)
);
userRouter.post('/delete-account', authenticate, asyncHandler(deleteAccount));
