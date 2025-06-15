import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
};

cloudinary.config(cloudinaryConfig);

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return !!(
    cloudinaryConfig.cloud_name &&
    cloudinaryConfig.api_key &&
    cloudinaryConfig.api_secret
  );
};

/**
 * Upload an image to Cloudinary
 * @param imageBuffer - The image buffer to upload
 * @param folder - Optional folder to store the image in
 * @returns Cloudinary upload response
 */
export async function uploadImage(imageBuffer: Buffer, folder = 'lost-found-system') {
  try {
    // If Cloudinary isn't configured, save locally
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary is not configured. Saving image locally.');
      
      const fs = require('fs');
      const path = require('path');
      
      // Create unique filename
      const timestamp = Date.now();
      const filename = `image-${timestamp}.jpg`;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      
      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Save file locally
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, imageBuffer);
      
      console.log(`Image saved locally to: ${filePath}`);
      
      return {
        url: `/uploads/${filename}`,
        publicId: `local-${timestamp}`,
        width: 800,
        height: 600,
      };
    }
    
    // Convert buffer to base64
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, crop: 'limit' }, // Resize for better performance
      ],
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Image upload failed');
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 */
export async function deleteImage(publicId: string) {
  try {
    // If Cloudinary isn't configured, return success
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary is not configured. Mock deletion successful.');
      return { success: true };
    }
    
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Image deletion failed');
  }
}

export default cloudinary; 