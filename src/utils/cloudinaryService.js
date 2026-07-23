import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import '../config/cloudinary.js';

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};