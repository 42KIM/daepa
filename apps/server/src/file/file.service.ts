import { Injectable } from '@nestjs/common';
import { R2Service } from 'src/common/storage/r2/r2.service';
import { UploadImagesRequestDto } from './file.dto';

@Injectable()
export class FileService {
  constructor(private readonly r2Service: R2Service) {}

  async uploadImages({ petId, files }: UploadImagesRequestDto) {
    return await this.r2Service.upload(
      files.map((file, index) => ({
        buffer: file.buffer,
        fileName: `${petId}/profile_${index + 1}`,
        mimeType: file.mimetype,
      })),
    );
  }
}
