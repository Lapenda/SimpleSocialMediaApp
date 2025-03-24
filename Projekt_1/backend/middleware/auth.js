const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, '', (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ message: 'Token is not valid' });
      } else {
        req.user = decoded;
        next();
      }
    });
  } else {
    console.log('No token or incorrect token format provided');
    res.status(401).json({ message: 'Auth token is not supplied or is not in the correct format' });
  }
};