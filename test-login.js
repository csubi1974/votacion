// Test login response structure
console.log('Testing login response...\n');

async function testLogin() {
    try {
        const csrfResponse = await fetch('http://localhost:3001/api/csrf-token');
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.csrfToken;

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

        const loginData = await loginResponse.json();
        console.log('Login response:', JSON.stringify(loginData, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();
