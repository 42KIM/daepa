import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class R2Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_API_BASE_URL ?? '',
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  async upload(
    files: { buffer: Buffer; fileName: string; mimeType: string }[],
  ) {
    const commands = files.map((file) => {
      return new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_IMAGE_BUCKET_NAME ?? '',
        Key: file.fileName,
        Body: file.buffer,
        ContentType: file.mimeType,
      });
    });
    const results = await Promise.all(
      commands.map((command) => this.s3Client.send(command)),
    );
    if (results.some((result) => result.$metadata.httpStatusCode !== 200)) {
      throw new Error('파일 업로드 중 오류가 발생했습니다.');
    }

    const uploadedFiles = files.map(({ fileName, mimeType }) => ({
      id: 0,
      url: '',
      fileName,
      fileSize: 0,
      mimeType,
    }));
    // TODO: 업로드 성공 시 파일 정보 저장

    return uploadedFiles;
  }
}
