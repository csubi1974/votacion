import sequelize from '../config/database.js';

async function updateSchema() {
    try {
        console.log('Updating schema...');

        // 1. Add requiresVoterRegistry column to elections table
        try {
            await sequelize.query(`
        ALTER TABLE elections 
        ADD COLUMN requiresVoterRegistry BOOLEAN DEFAULT 0 NOT NULL;
      `);
            console.log('Added requiresVoterRegistry column to elections table');
        } catch (error: any) {
            if (error.message.includes('duplicate column name')) {
                console.log('Column requiresVoterRegistry already exists');
            } else {
                console.error('Error adding column:', error);
            }
        }

        // 2. Create election_voters table
        try {
            await sequelize.query(`
        CREATE TABLE IF NOT EXISTS election_voters (
          id UUID PRIMARY KEY,
          electionId UUID NOT NULL,
          userId UUID NOT NULL,
          isEligible BOOLEAN DEFAULT 1 NOT NULL,
          hasVoted BOOLEAN DEFAULT 0 NOT NULL,
          addedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          addedBy UUID,
          notes TEXT,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (electionId) REFERENCES elections(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (addedBy) REFERENCES users(id)
        );
      `);
            console.log('Created election_voters table');

            // Create indexes
            await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS election_voters_electionId_userId ON election_voters(electionId, userId);`);
            await sequelize.query(`CREATE INDEX IF NOT EXISTS election_voters_electionId ON election_voters(electionId);`);
            await sequelize.query(`CREATE INDEX IF NOT EXISTS election_voters_userId ON election_voters(userId);`);
            await sequelize.query(`CREATE INDEX IF NOT EXISTS election_voters_hasVoted ON election_voters(hasVoted);`);

            console.log('Created indexes for election_voters');
        } catch (error) {
            console.error('Error creating table:', error);
        }

        console.log('Schema update completed');
        process.exit(0);
    } catch (error) {
        console.error('Schema update failed:', error);
        process.exit(1);
    }
}

updateSchema();
