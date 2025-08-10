const axios = require('axios');

async function testLearnerLogin() {
  try {
    console.log("Testing API login for Jane Learner...");
    
    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'learner@demo.com',
      password: 'password'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Learner login successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error("❌ Learner login failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testLearnerLogin();
