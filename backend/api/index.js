// Vercel runs every request through this single serverless function.
// vercel.json rewrites all paths here, and Express handles the routing.
module.exports = require("../src/app");
