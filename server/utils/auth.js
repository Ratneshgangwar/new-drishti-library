const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// HASH PASSWORD
// ==========================================

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// ==========================================
// COMPARE PASSWORD
// ==========================================

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ==========================================
// GENERATE JWT
// ==========================================

const generateToken = (student) => {
  return jwt.sign(
    {
      id: student._id,
      role: student.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
};