const express = require('express');
const router = express.Router();
const assemblyService = require('../services/assemblyService');

router.get("/token", async (_req, res) => {
    try {     
      const token = await assemblyService.createTemporaryToken(3600);
      res.json({ token });
    } catch (error) {
      console.error('Error fetching token:', error);
      res.status(500).json({ error: 'Failed to fetch token', details: error.message });
    }
});

module.exports = router;
