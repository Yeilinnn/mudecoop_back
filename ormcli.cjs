// ormcli.cjs
import('typeorm').then(async ({ DataSource }) => {
  const { default: dsConfig } = await import('./dist/data-source.js');
  const ds = new DataSource(dsConfig.options || dsConfig);
  try {
    await ds.initialize();
    const res = await ds.runMigrations();
    console.log('✅ Migrations executed:', res.map(m => m.name));
    await ds.destroy();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
});
