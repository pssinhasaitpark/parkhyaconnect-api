declare module "cloudinary" {
  export const v2: {
    config: (options: {
      cloud_name: string;
      api_key: string;
      api_secret: string;
    }) => void;
    uploader: {
      upload_stream: (
        options: { folder: string },
        callback: (error: any, result: { secure_url?: string }) => void
      ) => { end: (buffer: Buffer) => void };
    };
  };
}