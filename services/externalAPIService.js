const axios = require('axios');
require('dotenv').config();

exports.getIamToken = async () => {
  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
  params.append('apikey', process.env.IBM_API_KEY);

  try {
    const response = await axios.post('https://iam.cloud.ibm.com/identity/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' } });
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching IAM token:', error);
    throw error;
  }
};