import 'express';

declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        username: string;
        email: string;
      };
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }

    interface Locals {
      adminUser?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

export {};
