const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {String} expiresIn - Token expiration (default: 7d)
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {String} Refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d"
  });
};

/**
 * Verify token
 * @param {String} token - JWT token
 * @param {Boolean} isRefreshToken - Whether this is a refresh token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token, isRefreshToken = false) => {
  const secret = isRefreshToken 
    ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
    : process.env.JWT_SECRET;
  
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken
};