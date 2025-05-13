const { pool } = require('../config/database');

class Course {
  static async create({ title, description, level, category, teacher_id }) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO courses (title, description, level, category, teacher_id) VALUES (?, ?, ?, ?, ?)',
        [title, description, level, category, teacher_id]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating course: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, u.email as teacher_email 
         FROM courses c 
         LEFT JOIN users u ON c.teacher_id = u.id 
         WHERE c.id = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding course: ${error.message}`);
    }
  }

  static async update(id, updates) {
    try {
      const allowedUpdates = ['title', 'description', 'level', 'category', 'teacher_id'];
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
        `UPDATE courses SET ${setClause} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating course: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM courses WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting course: ${error.message}`);
    }
  }

  static async findAll({ 
    limit = 10, 
    offset = 0, 
    level = null, 
    category = null,
    search = null 
  }) {
    try {
      let query = `
        SELECT c.*, u.email as teacher_email,
               COUNT(DISTINCT e.user_id) as enrollment_count
        FROM courses c
        LEFT JOIN users u ON c.teacher_id = u.id
        LEFT JOIN enrollments e ON c.id = e.course_id
      `;
      
      const params = [];
      const conditions = [];

      if (level) {
        conditions.push('c.level = ?');
        params.push(level);
      }

      if (category) {
        conditions.push('c.category = ?');
        params.push(category);
      }

      if (search) {
        conditions.push('(c.title LIKE ? OR c.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY c.id LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching courses: ${error.message}`);
    }
  }

  static async enroll(courseId, userId) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO enrollments (course_id, user_id, progress) VALUES (?, ?, 0)',
        [courseId, userId]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Error enrolling in course: ${error.message}`);
    }
  }

  static async updateProgress(courseId, userId, progress) {
    try {
      const [result] = await pool.execute(
        'UPDATE enrollments SET progress = ? WHERE course_id = ? AND user_id = ?',
        [progress, courseId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating course progress: ${error.message}`);
    }
  }

  static async getEnrollments(courseId) {
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.email 
         FROM enrollments e
         JOIN users u ON e.user_id = u.id
         WHERE e.course_id = ?`,
        [courseId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching course enrollments: ${error.message}`);
    }
  }
}

module.exports = Course; 