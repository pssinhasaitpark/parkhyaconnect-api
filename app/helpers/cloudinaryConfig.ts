import cloudinary from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Cloudinary configuration is missing environment variables.");
}

cloudinary.v2.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const uploadImageToCloudinary = async (
  fileBuffer: Buffer
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { folder: "parkhya-connect" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result.secure_url) {
            resolve(result.secure_url);
          } else {
            resolve(null);
          }
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export { uploadImageToCloudinary };
