import { Router } from 'express';
import { users } from '../Users';
export const subRouter = Router();
subRouter.get('/subscription-status', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId || !users[userId]) {
        return res.status(401).json({ error: 'Unnown User' });
    }
    const user = users[userId];
    res.json({
        subscribed: user.plan === 'pro',
        plan: user.plan,
    });
});
