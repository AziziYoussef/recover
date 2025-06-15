#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function fixImageUrls() {
  // Database connection config
  const connectionConfig = {
    host: 'localhost',
    user: 'recovr_user',
    password: 'Recovr@2024',
    database: 'recovr_db'
  };

  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(connectionConfig);

    // Get all items with mock image URLs
    const [rows] = await connection.execute(
      'SELECT id, name, image_url FROM items WHERE image_url LIKE "/mock-image-%" ORDER BY id'
    );

    console.log(`Found ${rows.length} items with mock image URLs`);

    // Available images in public/uploads
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const availableImages = fs.readdirSync(uploadsDir)
      .filter(file => file.match(/\.(jpg|jpeg|png)$/i))
      .sort();

    console.log(`Available images in uploads:`, availableImages);

    // Update each item with a real image
    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      const imageIndex = i % availableImages.length; // Cycle through available images
      const newImageUrl = `/uploads/${availableImages[imageIndex]}`;

      await connection.execute(
        'UPDATE items SET image_url = ? WHERE id = ?',
        [newImageUrl, item.id]
      );

      console.log(`Updated item ${item.id} (${item.name}): ${item.image_url} -> ${newImageUrl}`);
    }

    await connection.end();
    console.log('✅ Database image URLs updated successfully!');

  } catch (error) {
    console.error('❌ Error fixing image URLs:', error.message);
    process.exit(1);
  }
}

// Check if mysql2 is available
try {
  require('mysql2/promise');
  fixImageUrls();
} catch (error) {
  console.log('mysql2 not installed. Installing...');
  console.log('Run: npm install mysql2');
  console.log('Then run this script again.');
}