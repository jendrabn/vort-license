import { Router } from 'express';
import type { Request } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

import * as authController from '../../controllers/admin/auth.controller';
import * as userController from '../../controllers/admin/user.controller';
import * as licenseController from '../../controllers/admin/license.controller';
import * as scriptController from '../../controllers/admin/script.controller';
import adminAuthMiddleware from '../../middleware/adminAuth.middleware';

const router = Router();
const licenseRouter = Router();

const scriptUploadDir = path.join(process.cwd(), 'public', 'uploads', 'scripts');

const scriptStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    if (!fs.existsSync(scriptUploadDir)) {
      fs.mkdirSync(scriptUploadDir, { recursive: true });
    }
    cb(null, scriptUploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});

const scriptUpload = multer({ storage: scriptStorage });

router.get('/login', authController.renderLogin);
router.post('/login', authController.handleLogin);

router.get('/forgot-password', authController.renderForgotPassword);
router.post('/forgot-password', authController.handleForgotPassword);

router.get('/reset-password', authController.renderResetPassword);
router.post('/reset-password', authController.handleResetPassword);

router.post('/logout', adminAuthMiddleware, authController.handleLogout);

router.get('/dashboard', adminAuthMiddleware, authController.renderDashboard);

router.get('/users', adminAuthMiddleware, userController.listUsers);
router.get('/users/new', adminAuthMiddleware, userController.renderCreateForm);
router.post('/users', adminAuthMiddleware, userController.createUser);
router.get('/users/:id/edit', adminAuthMiddleware, userController.renderEditForm);
router.post('/users/:id', adminAuthMiddleware, userController.updateUser);
router.post('/users/:id/delete', adminAuthMiddleware, userController.deleteUser);

licenseRouter.get('/generate-key', licenseController.handleGenerateKey);
licenseRouter.get('/', licenseController.listLicenses);
licenseRouter.get('/new', licenseController.renderCreateForm);
licenseRouter.post('/', licenseController.createLicense);
licenseRouter.get('/:id', licenseController.viewLicense);
licenseRouter.get('/:id/edit', licenseController.renderEditForm);
licenseRouter.post('/:id', licenseController.updateLicense);
licenseRouter.post('/:id/reset-binding', licenseController.resetBinding);
licenseRouter.post('/:id/ban', licenseController.banLicense);
licenseRouter.post('/:id/unban', licenseController.unbanLicense);
licenseRouter.post('/:id/delete', licenseController.deleteLicense);
licenseRouter.post('/:id/duplicate', licenseController.duplicateLicense);

router.use('/licenses', adminAuthMiddleware, licenseRouter);

router.get('/scripts', adminAuthMiddleware, scriptController.listScripts);
router.get('/scripts/new', adminAuthMiddleware, scriptController.renderCreateForm);
router.post('/scripts', adminAuthMiddleware, scriptUpload.single('scriptFile'), scriptController.createScript);
router.get('/scripts/:id/edit', adminAuthMiddleware, scriptController.renderEditForm);
router.post('/scripts/:id', adminAuthMiddleware, scriptUpload.single('scriptFile'), scriptController.updateScript);
router.post('/scripts/:id/delete', adminAuthMiddleware, scriptController.deleteScript);

export default router;
