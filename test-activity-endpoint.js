// Test the my-activity endpoint
console.log('Testing /api/audit/my-activity endpoint...\n');

async function testEndpoint() {
    try {
        // Step 0: Get CSRF token
        console.log('0. Getting CSRF token...');
        const csrfResponse = await fetch('http://localhost:3001/api/csrf-token');
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.csrfToken;
        console.log('✅ CSRF token obtained');

        // Step 1: Login to get a valid token
        console.log('\n1. Logging in...');
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
                rut: '4.067.326-1',
                password: 'MiNuevaPass123!',
            }),
        });

        if (!loginResponse.ok) {
            console.error('❌ Login failed');
            const errorData = await loginResponse.json();
            console.log('Error:', errorData);
            return;
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        const accessToken = loginData.tokens.accessToken;

        // Step 2: Test my-activity endpoint
        console.log('\n2. Fetching activity logs...');
        const activityResponse = await fetch('http://localhost:3001/api/audit/my-activity?limit=10', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('Status:', activityResponse.status);

        if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            console.log('\n✅ Activity logs retrieved successfully!');
            console.log('Total logs:', activityData.total);
            console.log('\nYour recent activity:');
            activityData.data.forEach((log, index) => {
                console.log(`\n${index + 1}. ${log.action}`);
                console.log(`   Date: ${new Date(log.createdAt).toLocaleString()}`);
                console.log(`   IP: ${log.ipAddress}`);
            });
        } else {
            const errorData = await activityResponse.json();
            console.log('\n❌ Error:', errorData);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEndpoint();
