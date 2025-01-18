import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import app from '../app';
import { User } from '../models/User';

describe('Auth API Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  const validUser = {
    username: 'testuser',
    password: '12341234',
    nickname: '테스트유저'
  };

  const adminUser = {
    username: 'admin',
    password: 'admin1234',
    nickname: '관리자',
    authorities: [
      { authorityName: 'ROLE_USER' },
      { authorityName: 'ROLE_ADMIN' }
    ]
  };

  describe('회원가입 테스트', () => {
    test('유효한 데이터로 회원가입 성공', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('username', validUser.username);
      expect(response.body).toHaveProperty('nickname', validUser.nickname);
      expect(response.body.authorities.map(auth => auth.authorityName)).toEqual(['ROLE_USER']);
    });

    test('중복된 username으로 회원가입 실패', async () => {
      await request(app)
        .post('/auth/signup')
        .send(validUser);

      const response = await request(app)
        .post('/auth/signup')
        .send(validUser)
        .expect(409);

      expect(response.body).toHaveProperty('code', 'USERNAME_EXISTS');
      expect(response.body).toHaveProperty('message', '이미 존재하는 사용자 이름입니다.');
    });

    test('필수 필드 누락시 회원가입 실패', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('code', 'MISSING_FIELD');
      expect(response.body).toHaveProperty('message', '모든 필드를 입력해주세요.');
    });
  });

  describe('권한 관리 테스트', () => {
    describe('관리자 계정 생성 테스트', () => {
      test('관리자가 새로운 관리자 계정 생성 성공', async () => {
        // 기존 관리자 생성
        const hashedPassword = await bcrypt.hash(adminUser.password, 10);
        const admin = await User.create({
          ...adminUser,
          password: hashedPassword
        });

        // 관리자로 로그인
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            username: adminUser.username,
            password: adminUser.password
          })
          .expect(200);

        expect(loginResponse.body).toHaveProperty('token');

        const newAdmin = {
          username: 'newadmin',
          password: 'admin5678',
          nickname: '새관리자'
        };

        const response = await request(app)
          .post('/auth/admin')
          .set('Authorization', `Bearer ${loginResponse.body.token}`)
          .send(newAdmin)
          .expect(201);

        expect(response.body).toHaveProperty('username', newAdmin.username);
        expect(response.body.authorities.map(auth => auth.authorityName)).toEqual([
          'ROLE_USER',
          'ROLE_ADMIN'
        ]);
      });

      test('일반 사용자가 관리자 계정 생성 시도시 실패', async () => {
        // 일반 사용자 생성
        const hashedPassword = await bcrypt.hash(validUser.password, 10);
        await User.create({
          ...validUser,
          password: hashedPassword
        });

        // 일반 사용자로 로그인
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            username: validUser.username,
            password: validUser.password
          })
          .expect(200);

        expect(loginResponse.body).toHaveProperty('token');

        const newAdmin = {
          username: 'newadmin',
          password: 'admin5678',
          nickname: '새관리자'
        };

        await request(app)
          .post('/auth/admin')
          .set('Authorization', `Bearer ${loginResponse.body.token}`)
          .send(newAdmin)
          .expect(403);
      });

      test('인증 없이 관리자 계정 생성 시도시 실패', async () => {
        const newAdmin = {
          username: 'newadmin',
          password: 'admin5678',
          nickname: '새관리자'
        };

        const response = await request(app)
          .post('/auth/admin')
          .send(newAdmin)
          .expect(401);

        expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
        expect(response.body).toHaveProperty('message', '인증이 필요합니다.');
      });
    });
  });

  describe('로그인 테스트', () => {
    test('유효한 자격증명으로 로그인 성공', async () => {
      // 사용자 생성
      const hashedPassword = await bcrypt.hash(validUser.password, 10);
      await User.create({
        ...validUser,
        password: hashedPassword
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: validUser.username,
          password: validUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });
  });
}); 