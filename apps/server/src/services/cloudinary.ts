import streamifier from "streamifier";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";

export async function uploadBuffer(buffer: Buffer, options: { folder: string; publicId: string }) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured");
  }

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: "auto"
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result ?? {});
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}
