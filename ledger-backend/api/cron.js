const { initCronJobs } = require("../src/utils/cronJobs");

export default async function handler(req, res) {
  // Verify secret to prevent unauthorized access
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    await initCronJobs();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}