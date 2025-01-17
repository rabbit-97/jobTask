import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

describe('Auth API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /auth/signup', () => {
    const validUser = {
      username: 'JIN HO',
      password: '12341234',
      nickname: 'Mentos'
    };

    it('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('username', validUser.username);
      expect(response.body).toHaveProperty('nickname', validUser.nickname);
      expect(response.body.authorities).toEqual([{ authorityName: 'ROLE_USER' }]);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not allow duplicate usernames', async () => {
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(400);

      expect(response.body).toHaveProperty('message', '이미 존재하는 사용자입니다.');
    });

    it('should require all necessary fields', async () => {
      const invalidUser = {
        username: 'test'
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      username: 'JIN HO',
      password: '12341234',
      nickname: 'Mentos'
    };

    beforeEach(async () => {
      await request(app)
        .post('/auth/signup')
        .send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', '잘못된 인증 정보입니다.');
    });

    it('should not login with non-existent username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: testUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', '잘못된 인증 정보입니다.');
    });
  });
}); 