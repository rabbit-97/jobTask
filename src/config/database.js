import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MongoDB URI가 설정되지 않았습니다.');
    }

    await mongoose.connect(mongoURI, {
      retryWrites: true,
      w: 'majority'
    });

    console.log('MongoDB Atlas에 연결되었습니다.');

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 연결이 끊어졌습니다. 재연결을 시도합니다.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 연결 에러:', err);
    });

  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};
