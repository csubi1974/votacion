import { sequelize } from '../config/database.js';
import '../models/index.js'; // Load associations
import { User } from '../models/User.js';
import { Election } from '../models/Election.js';
import { ElectionOption } from '../models/ElectionOption.js';
import { Vote } from '../models/Vote.js';
import { AuthService } from '../services/AuthService.js';

async function simulateVote() {
    try {
        await sequelize.authenticate();

        console.log('Using Admin user to vote...');

        // 1. Find Admin
        const user = await User.findOne({ where: { rut: '14.871.735-4' } });
        if (!user) throw new Error('Admin user not found');

        console.log('Found Admin:', user.id);

        // 2. Get Election
        const election = await Election.findOne({
            where: { title: 'Elección de Directiva 2025' },
            include: [{ model: ElectionOption, as: 'options' }]
        });

        if (!election) throw new Error('Election not found');

        const options = (election as any).options || [];
        if (options.length === 0) throw new Error('No options found');

        // 3. Clear previous votes for this user in this election
        await Vote.destroy({
            where: {
                userId: user.id,
                electionId: election.id
            }
        });
        console.log('Cleared previous votes for Admin');

        // Pick a random option
        const randomOption = options[Math.floor(Math.random() * options.length)];
        console.log(`Voting for option: ${randomOption.text}`);

        // 4. Authenticate and Vote via API
        console.log('Authenticating with API...');

        const authService = new AuthService();
        const loginResult = await authService.login({ rut: '14.871.735-4', password: 'Admin123!' });

        if (!loginResult.success || !loginResult.tokens) {
            throw new Error('Login failed: ' + loginResult.message);
        }

        const token = loginResult.tokens.accessToken;

        console.log(`Sending vote via API for option: ${randomOption.text}`);

        const response = await fetch('http://localhost:3001/api/voting/cast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                electionId: election.id,
                optionIds: [randomOption.id]
            })
        });

        const data = await response.json();
        console.log('API Response:', data);

        if (data.success) {
            console.log('✅ Vote cast via API. Socket event should have been emitted!');
        } else {
            console.error('❌ API Vote failed:', data.message);
        }

    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

simulateVote();
