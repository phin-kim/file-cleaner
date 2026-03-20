import { Router } from 'express';

export const subRouter: Router = Router();
import createLogger from '../utils/logger.js';
const log = createLogger('subscription route');
subRouter.get('/subscription-status', (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    log.info('userId', { data: { userId } });
    /*if (!userId || !users[userId]) {
        return res.status(401).json({ error: 'Unknown User' });
    }
    const user = users[userId];
    log.info('user', { data: { user } });
    res.json({
        subscribed: user.plan === 'pro' || 'admin',
        plan: user.plan,
    });*/
});
