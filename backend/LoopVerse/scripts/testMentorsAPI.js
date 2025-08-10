const axios = require('axios');

async function testMentorsAPI() {
  try {
    console.log("Testing mentors API...");
    
    const response = await axios.get('http://localhost:4001/api/mentors', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Mentors API successful!");
    console.log("Status:", response.status);
    console.log("Total mentors:", response.data.data?.mentors?.length || 0);
    
    if (response.data.data?.mentors) {
      console.log("\nMentors list:");
      response.data.data.mentors.forEach((mentor, index) => {
        console.log(`${index + 1}. ${mentor.name} (${mentor.email})`);
        console.log(`   Skills: ${mentor.skills?.join(', ') || 'None'}`);
        console.log(`   Rate: $${mentor.hourlyRate}/hr`);
        console.log(`   Verified: ${mentor.isVerified}`);
        console.log("   ---");
      });
    }
    
  } catch (error) {
    console.error("❌ Mentors API failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testMentorsAPI();
