require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect } = require('./db');

const settingsRoute = require('./routes/settings');
const staffRoute = require('./routes/staff');
const auditRoute = require('./routes/audit');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/settings', settingsRoute);
app.use('/api/staff', staffRoute);
app.use('/api/audit', auditRoute);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connect(process.env.MONGODB_URI);
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
