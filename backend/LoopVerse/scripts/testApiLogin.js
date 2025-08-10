const axios = require('axios');

async function testApiLogin() {
  try {
    console.log("Testing API login for Sarah Johnson...");
    
    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'sarah.johnson@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Login successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error("❌ Login failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testApiLogin();
