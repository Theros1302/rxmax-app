// Standalone migration runner: `npm run migrate`
// Calls the same logic that src/index.js runs on startup, but exits when done.
require('dotenv').config();
const path = require('path');
const { runMigrations } = require(path.join(__dirname, '..', 'src', 'config', 'migrate'));

(async () => {
  try {
    await runMigrations();
    console.log('Migrations complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
})();
