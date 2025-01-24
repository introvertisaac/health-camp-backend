require('dotenv').config();
const app = require('./src/app.js');
const connectDB = require('./src/config/db');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});