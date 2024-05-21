require('dotenv').config();
const { AssemblyAI } = require('assemblyai');

class AssemblyService {
  constructor() {
    this.aai = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
  }

  async createTemporaryToken(expiration = 3600) {
    try {
      const token = await this.aai.realtime.createTemporaryToken({ expires_in: expiration });
      return token;
    } catch (error) {
      console.error('Error creating AssemblyAI token:', error);
      throw error;
    }
  }
}

module.exports = new AssemblyService();
