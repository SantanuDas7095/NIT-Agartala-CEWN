'use server';

import { v2 as cloudinary } from 'cloudinary';

// This server action is configured to use environment variables for Cloudinary.
// Make sure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET
// are set in your .env.local file for this to work in local development.
// For deployment, these will need to be set as environment variables on your hosting provider.

export async function uploadPhoto(formData: FormData) {
    const file = formData.get('photo') as File;
    if (!file) {
        return { error: 'No photo provided.' };
    }

    try {
        // Configuration is done inside the action to ensure env vars are loaded.
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });

        const fileBuffer = await file.arrayBuffer();
        const mime = file.type;
        const encoding = 'base64';
        const base64Data = Buffer.from(fileBuffer).toString('base64');
        const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;

        const result = await cloudinary.uploader.upload(fileUri, {
            folder: 'csm-profile-photos'
        });

        if (result.secure_url) {
            return { success: true, url: result.secure_url };
        } else {
            return { error: 'Cloudinary upload succeeded but no secure URL was returned.' };
        }
    } catch (error: any) {
        console.error('Upload action error:', error);
        return { error: error.message || 'An unknown error occurred during upload.' };
    }
}
