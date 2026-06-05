import request from 'supertest';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001';

describe('AppController (e2e)', () => {
  it('/ (GET) is public and returns 200 without auth', async () => {
    const res = await request(BASE_URL).get('/').expect(200);
    expect(res.text).toBeTruthy();
  });
});
