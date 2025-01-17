import { verifyToken } from "../utils/jwt.js";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  const user = verifyToken(token, process.env.JWT_SECRET);

  if (!user) {
    return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }

  req.user = user;
  next();
};

export { authenticateToken };
