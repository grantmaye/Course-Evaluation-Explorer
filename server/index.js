import { createApp } from './app.js';
import { createSqliteStore } from './sqlite.js';

const driver = process.env.DB_DRIVER || 'sqlite';
if (!['sqlite', 'mssql'].includes(driver)) throw new Error('DB_DRIVER must be sqlite or mssql.');
const store = driver === 'mssql' ? await (await import('./mssql.js')).createMssqlStore() : createSqliteStore();
const app = createApp(store);
const port = Number(process.env.PORT || 4100);
app.listen(port, '127.0.0.1', () => console.log(`Evaluation Explorer: http://localhost:${port} (${store.engine})`));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => app.close(async () => { await store.close(); process.exit(0); }));
