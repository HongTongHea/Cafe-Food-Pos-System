// Local development entry point. On Vercel, api/index.js is used instead.
const app = require("./app");
const { port } = require("./config/env");

app.listen(port, () => {
  console.log(`Cafe POS API running on http://localhost:${port}`);
});
