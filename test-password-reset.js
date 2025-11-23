// Test script to verify password reset flow
console.log('Testing password reset API...\n');

const testEmail = 'admin@voting-platform.com';

async function testPasswordReset() {
    try {
        // Step 1: Get CSRF token
        console.log('1. Fetching CSRF token...');
        const csrfResponse = await fetch('http://localhost:3001/api/csrf-token');
        const csrfData = await csrfResponse.json();
        console.log('   ✓ CSRF Token obtained');

        // Step 2: Request password reset
        console.log('\n2. Requesting password reset...');
        const resetResponse = await fetch('http://localhost:3001/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfData.csrfToken,
            },
            body: JSON.stringify({ email: testEmail }),
        });

        const resetData = await resetResponse.json();
        console.log('   Response:', JSON.stringify(resetData, null, 2));

        if (resetData.devOnly?.resetUrl) {
            console.log('\n✅ SUCCESS! Reset URL generated:');
            console.log('   ' + resetData.devOnly.resetUrl);
            console.log('\n📋 Copy this URL and paste it in your browser to reset the password.');
            console.log('   Token expires at:', resetData.devOnly.expiresAt);
        } else {
            console.log('\n⚠️  No devOnly data in response');
            console.log('   This might mean NODE_ENV is set to production');
            console.log('   Current response:', resetData);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPasswordReset();
