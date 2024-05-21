const axios = require('axios');

exports.getIamToken = async () => {
  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
  params.append('apikey', 'sCvcjKdnkkCv5v3jJzRVH0gOvGIYELXpjr4nvQbv00Xl');

  try {
    const response = await axios.post('https://iam.cloud.ibm.com/identity/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' } });
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching IAM token:', error);
    throw error;
  }
};