import { Router } from 'express';

import * as authController from '../../controllers/api/auth.controller';

const router = Router();

router.post('/auth/token', authController.issueToken);
router.post('/auth/logout', authController.logout);

export default router;
