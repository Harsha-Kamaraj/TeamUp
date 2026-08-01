/**
 * TEMPORARY local-dev helper (not part of the app — safe to delete).
 * Starts an in-memory MongoDB on a fixed port so the API can run locally
 * without installing MongoDB or signing up for Atlas.
 *   node dev-mongo.mjs
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create({
  instance: { port: 27017, dbName: 'squadly' },
});

console.log(`[dev-mongo] ready at ${mongod.getUri()}`);

async function stop(signal) {
  console.log(`[dev-mongo] ${signal} — stopping`);
  await mongod.stop();
  process.exit(0);
}
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

// Keep the process alive.
setInterval(() => {}, 1 << 30);
