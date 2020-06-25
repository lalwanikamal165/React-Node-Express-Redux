const jwt = require('jsonwebtoken');
const config = require('config');

const secret = config.get('jwtSecret');

module.exports = function (req, res, next) {
  //Get token from the header
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, access denied' });
  }

  //verfiy token
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded.user;
    next();
  } catch (error) {
    return res.status(400).json({ msg: 'Token is not valid' });
  }
};
