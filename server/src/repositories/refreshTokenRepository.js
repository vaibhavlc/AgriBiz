import RefreshToken from '../models/RefreshToken.js';

class RefreshTokenRepository {
  async findToken(token) {
    return RefreshToken.findOne({ token });
  }

  async create(tokenData) {
    return RefreshToken.create(tokenData);
  }

  async deleteToken(token) {
    return RefreshToken.deleteOne({ token });
  }

  async deleteUserTokens(userId) {
    return RefreshToken.deleteMany({ userId });
  }
}

export default new RefreshTokenRepository();
