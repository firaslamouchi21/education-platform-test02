const { pool } = require('../config/database');

class User {
  static async create({ firebase_uid, email, role = 'student' }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO users (firebase_uid, email, role) VALUES (?, ?, ?)',
        [firebase_uid, email, role]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async findByFirebaseUid(firebase_uid) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE firebase_uid = ?',
        [firebase_uid]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async update(id, updates) {
    try {
      const allowedUpdates = ['email', 'role'];
      const validUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      if (Object.keys(validUpdates).length === 0) {
        throw new Error('No valid updates provided');
      }

      const setClause = Object.keys(validUpdates)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = [...Object.values(validUpdates), id];

      const [result] = await pool.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  static async findAll({ limit = 10, offset = 0, role = null }) {
    try {
      let query = 'SELECT * FROM users';
      const params = [];

      if (role) {
        query += ' WHERE role = ?';
        params.push(role);
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }
}

module.exports = User; 