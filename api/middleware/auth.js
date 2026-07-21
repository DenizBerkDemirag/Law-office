function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect("/login");
}

function isLawyer(req, res, next) {
  if (req.session.role === "lawyer") return next();
  return res.status(403).send("Yetkiniz yok.");
}

function isMember(req, res, next) {
  if (req.session.role === "member") return next();
  return res.status(403).send("Yetkiniz yok.");
}

module.exports = { isAuthenticated, isLawyer, isMember };
