import request from 'supertest';

import app from '../app';

describe('Express application', () => {
  it('responds to GET / with rendered html', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Blank Page');
  });

  it('responds to GET /users with a resource message', async () => {
    const response = await request(app).get('/users');

    expect(response.status).toBe(200);
    expect(response.text).toContain('respond with a resource');
  });
});
