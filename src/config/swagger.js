import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth API',
      version: '1.0.0',
      description: '사용자 인증 및 권한 관리를 위한 API',
    },
    servers: [
      {
        url: 'http://13.125.49.254:3000',
        description: '서버 URL',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // routes 디렉토리의 모든 라우트 파일을 문서화
};

export const specs = swaggerJsdoc(options);
