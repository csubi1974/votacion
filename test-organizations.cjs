const API_URL = 'http://127.0.0.1:3001/api';

async function testOrganizations() {
    try {
        // Login first
        console.log('1. Getting CSRF token...');
        const csrfResponse = await fetch(`${API_URL}/csrf-token`);
        const csrfData = await csrfResponse.json();

        console.log('2. Logging in...');
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfData.csrfToken
            },
            body: JSON.stringify({
                rut: '4.067.326-1',
                password: 'Admin123!'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.tokens.accessToken;
        console.log('✅ Login successful');

        // Fetch organizations
        console.log('\n3. Fetching organizations...');
        const orgResponse = await fetch(`${API_URL}/admin/organizations`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-CSRF-Token': csrfData.csrfToken
            }
        });

        console.log('Status:', orgResponse.status);
        const orgData = await orgResponse.json();

        if (orgResponse.ok) {
            console.log('✅ Organizations fetched successfully:');
            console.log(JSON.stringify(orgData.data, null, 2));
        } else {
            console.log('❌ Failed to fetch organizations');
            console.log(orgData);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testOrganizations();
