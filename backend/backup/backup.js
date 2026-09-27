// serves as the script to run the backup database.
// dumps the main database to a timestamped archive, restores that archive into
// the backup cluster, then checks every collection has the same count on both sides.
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';

const dumpsDir = path.join(import.meta.dirname, '..', 'dumps');

// run a command with an argument array (no shell), so the URI is never parsed
// by the shell and special characters in the password can't break it.
// mongodump / mongorestore log progress to stderr, so only the exit code matters.
const run = (command, args) =>
    new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) return resolve();
            reject(new Error(`${command} exited with code ${code}`));
        });
    });

// pulls the database name out of the URI path, e.g. /checkpoint -> checkpoint
const getDbName = (uri, envName) => {
    const dbName = new URL(uri).pathname.slice(1);
    if (!dbName) {
        throw new Error(`${envName} has no database name before the "?"`);
    }
    return dbName;
};

// mongorestore treats a database name in --uri like the old --db flag and skips
// everything in the archive not already named that, so strip it out
const withoutDbName = (uri) => {
    const url = new URL(uri);
    url.pathname = '/';
    return url.toString();
};

const countCollections = async (uri) => {
    const connection = await mongoose.createConnection(uri).asPromise();
    try {
        const collections = await connection.db.listCollections().toArray();
        const counts = {};
        for (const { name } of collections) {
            counts[name] = await connection.db.collection(name).countDocuments();
        }
        return counts;
    } finally {
        await connection.close();
    }
};

const backupDatabase = async () => {
    try {
        const sourceUri = process.env.MONGODB_URI;
        const backupUri = process.env.BACKUPMONGO_URI;

        if (!sourceUri || !backupUri) {
            throw new Error(
                'MONGODB_URI and BACKUPMONGO_URI must both be set in backend/.env',
            );
        }

        const sourceDb = getDbName(sourceUri, 'MONGODB_URI');
        const backupDb = getDbName(backupUri, 'BACKUPMONGO_URI');

        // windows filenames can't contain ":" so swap them out of the ISO timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archivePath = path.join(dumpsDir, `${sourceDb}-${timestamp}.archive`);
        await mkdir(dumpsDir, { recursive: true });

        console.log(`Dumping ${sourceDb} to ${archivePath}`);
        await run('mongodump', [
            `--uri=${sourceUri}`,
            `--archive=${archivePath}`,
            '--gzip',
        ]);

        // only reached if the dump succeeded, so a failed dump never wipes the backup
        console.log(`Restoring into backup database ${backupDb}`);
        await run('mongorestore', [
            `--uri=${withoutDbName(backupUri)}`,
            `--archive=${archivePath}`,
            '--gzip',
            '--drop',
            `--nsFrom=${sourceDb}.*`,
            `--nsTo=${backupDb}.*`,
        ]);

        const sourceCounts = await countCollections(sourceUri);
        const backupCounts = await countCollections(backupUri);

        let mismatched = false;
        for (const [name, count] of Object.entries(sourceCounts)) {
            const backupCount = backupCounts[name] ?? 0;
            console.log(`${name}: source ${count}, backup ${backupCount}`);
            if (count !== backupCount) mismatched = true;
        }

        if (mismatched) {
            throw new Error('Backup counts do not match the source database');
        }

        console.log('Backup complete - counts match');
    } catch (error) {
        console.error(`Backup failed: ${error.message}`);
        process.exitCode = 1;
    }
};

// invoke the function here
backupDatabase();
