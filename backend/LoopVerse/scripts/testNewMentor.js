const axios = require('axios');

async function testNewMentor() {
  try {
    console.log("Testing new mentor login...");
    
    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'mentor@test.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ New mentor login successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error("❌ New mentor login failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testNewMentor();
