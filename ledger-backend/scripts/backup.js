require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const connectDB = require("../src/config/db");

const backupDatabase = async () => {
  try {
    await connectDB();
    
    console.log("💾 Starting database backup...");

    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backup = {
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      data: {}
    };

    for (const collection of collections) {
      const name = collection.name;
      const documents = await mongoose.connection.db.collection(name).find({}).toArray();
      backup.data[name] = documents;
      console.log(`  ✅ Backed up ${documents.length} documents from ${name}`);
    }

    // Write to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ Backup completed successfully: ${backupFile}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
};

backupDatabase();