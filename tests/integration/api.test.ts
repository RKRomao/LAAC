import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server';

describe('API Integration Tests', () => {
  test('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('should serve home page', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.text).toContain('LAAC');
  });

  test('should serve login page', async () => {
    const response = await request(app)
      .get('/login')
      .expect(200);

    expect(response.text).toContain('Login');
  });

  test('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);
  });
});
