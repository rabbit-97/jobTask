import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // useNewUrlParser와 useUnifiedTopology는 더 이상 필요하지 않음 (MongoDB 6.0 이상)
    });

    console.log(`MongoDB 연결 성공: ${conn.connection.host}`);

    // 에러 이벤트 리스너
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 연결 에러:', err);
    });

    // 연결 종료 이벤트 리스너
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 연결이 종료되었습니다.');
    });

    // 프로세스 종료 시 연결 종료
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    process.exit(1);
  }
};

export default connectDB;
