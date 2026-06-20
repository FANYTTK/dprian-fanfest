const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Necesitas iniciar sesión para hacer esto' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userName = decoded.name;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Tu sesión expiró, vuelve a iniciar sesión' });
  }
};
