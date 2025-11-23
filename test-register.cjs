const API_URL = 'http://127.0.0.1:3001/api';

async function registerUser() {
    try {
        console.log('Intentando registrar usuario nuevo...');
        const csrfResponse = await fetch(`${API_URL}/csrf-token`);
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.csrfToken;

        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                fullName: 'Usuario Nuevo',
                email: 'usuario@nuevo.com',
                password: 'Password123!',
                rut: '12.345.678-5',
                organizationId: '4a7a0116-c3cf-4eaf-9bb6-d28455c88802'
            })
        });

        if (response.ok) {
            console.log('✅ Usuario registrado exitosamente!');
            console.log('Email: usuario@nuevo.com');
            console.log('Pass: Password123!');
            console.log('RUT: 12.345.678-5');
        } else {
            console.log(`❌ Falló registro: ${response.status}`);
            const text = await response.text();
            console.log('Respuesta:', text);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

registerUser();
