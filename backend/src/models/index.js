const pool = require('../config/database');

const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

const getOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows[0] || null;
};

const getMany = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows || [];
};

const insert = async (table, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
  const columns = keys.join(',');

  const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
  return getOne(text, values);
};

const update = async (table, data, where) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
  const whereClause = whereKeys
    .map((key, i) => `${key} = $${keys.length + i + 1}`)
    .join(' AND ');

  const text = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
  return getOne(text, [...values, ...whereValues]);
};

const remove = async (table, where) => {
  const keys = Object.keys(where);
  const values = Object.values(where);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const text = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
  return getOne(text, values);
};

/**
 * Run a series of queries inside a single transaction.
 * Auto-rollback on any throw, auto-release client on completion.
 *
 * Usage:
 *   const result = await withTransaction(async (client) => {
 *     await client.query('INSERT INTO ...');
 *     await client.query('UPDATE ...');
 *     return finalValue;
 *   });
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* swallow rollback errors */ }
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  getOne,
  getMany,
  insert,
  update,
  remove,
  withTransaction,
  pool,
};
