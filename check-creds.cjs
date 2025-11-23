const API_URL = 'http://127.0.0.1:3001/api';

async function checkLogin() {
    const creds = [
        { rut: '4.067.326-1', password: 'Admin123!' },
        { rut: '4.067.326-1', password: 'MiNuevaPass123!' }
    ];

    for (const c of creds) {
        try {
            console.log(`Probando RUT: ${c.rut} Pass: ${c.password}...`);
            const csrfResponse = await fetch(`${API_URL}/csrf-token`);
            const csrfData = await csrfResponse.json();

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfData.csrfToken
                },
                body: JSON.stringify(c)
            });

            if (response.ok) {
                console.log('✅ ¡ÉXITO! Credenciales válidas encontradas.');
                console.log(`👉 RUT: ${c.rut}`);
                console.log(`👉 Pass: ${c.password}`);
                return;
            } else {
                console.log(`❌ Falló (${response.status})`);
            }
        } catch (e) {
            console.error('Error de conexión:', e.message);
        }
    }
    console.log('⚠️ Ninguna credencial funcionó.');
}

checkLogin();
