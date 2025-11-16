import request from 'supertest';
import app from '../../src/app';
import * as authService from '../../src/services/api/auth.service';
import { ServiceError } from '../../src/services/errors';

jest.mock('../../src/services/api/auth.service');

const mockedIssueToken = authService.issueToken as jest.Mock;
const mockedLogout = authService.logout as jest.Mock;

describe('API Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/token', () => {
    it('returns success payload when token issued', async () => {
      const responsePayload = {
        status: 'success',
        token: 'abc123',
        expired_at: '2025-11-16T00:00:00.000Z'
      };
      mockedIssueToken.mockResolvedValue(responsePayload);

      const res = await request(app)
        .post('/api/auth/token')
        .send({ license: 'KEY', bot_userid: 'BOT', hwid: 'HWID' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(responsePayload);
      expect(mockedIssueToken).toHaveBeenCalledWith({ license: 'KEY', bot_userid: 'BOT', hwid: 'HWID' });
    });

    it('returns error payload when service throws ServiceError', async () => {
      mockedIssueToken.mockRejectedValue(new ServiceError('License not found.'));

      const res = await request(app)
        .post('/api/auth/token')
        .send({ license: 'BAD', bot_userid: 'BOT', hwid: 'HWID' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'error',
        message: 'License not found.'
      });
    });

    it('returns generic error on unexpected failure', async () => {
      mockedIssueToken.mockRejectedValue(new Error('boom'));

      const res = await request(app)
        .post('/api/auth/token')
        .send({ license: 'KEY', bot_userid: 'BOT', hwid: 'HWID' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Unexpected error.'
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns success payload on logout', async () => {
      const responsePayload = {
        status: 'success',
        message: 'Logout successful.'
      };
      mockedLogout.mockResolvedValue(responsePayload);

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ license: 'KEY', bot_userid: 'BOT', hwid: 'HWID' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(responsePayload);
      expect(mockedLogout).toHaveBeenCalledWith({ license: 'KEY', bot_userid: 'BOT', hwid: 'HWID' });
    });

    it('returns error payload when logout fails validation', async () => {
      mockedLogout.mockRejectedValue(new ServiceError('license, bot_userid, and hwid are required.'));

      const res = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'error',
        message: 'license, bot_userid, and hwid are required.'
      });
    });

    it('returns generic error on unexpected logout failure', async () => {
      mockedLogout.mockRejectedValue(new Error('oops'));

      const res = await request(app)
        .post('/api/auth/logout')
        .send({ license: 'KEY', bot_userid: 'BOT', hwid: 'HWID' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'error',
        message: 'Unexpected error.'
      });
    });
  });
});
