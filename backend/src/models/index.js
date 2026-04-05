const pool = require('../config/database');

const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
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

module.exports = {
  query,
  getOne,
  getMany,
  insert,
  update,
  remove,
};
