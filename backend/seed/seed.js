import 'dotenv/config';
import seedData from './data.json' with { type: 'json' };
import { dbConnection, dbDisconnect } from '../config/db.connection.js';
import { User } from '../models/users.mongoSchema.js';

const insertData = async () => {
    try {
        await dbConnection();
        console.log('Connection successful for inserting data');

        // make sure the unique index on email exists before matching on it
        await User.init();

        let matched = 0;
        let modified = 0;
        let upserted = 0;

        for (const user of seedData) {
            const result = await User.updateOne(
                { email: user.email },
                { $set: user },
                { upsert: true, runValidators: true },
            );

            matched += result.matchedCount;
            modified += result.modifiedCount;
            upserted += result.upsertedCount;
        }

        console.log(
            `Seed complete - matched: ${matched}, modified: ${modified}, upserted: ${upserted}`,
        );
    } catch (error) {
        console.error(`Seeding failed: ${error.message}`);
        process.exitCode = 1;
    } finally {
        await dbDisconnect();
    }
};

// invoke the function here 
insertData();
