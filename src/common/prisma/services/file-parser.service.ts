import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileParserService {
  private readonly logger = new Logger(FileParserService.name);

  private cleanContent(content: string): string {
    let cleaned = content.replace(/\0/g, '');
    cleaned = cleaned.replace(/[^\x09\x0A\x0D\x20-\x7E\x80-\uFFFF]/g, '');
    cleaned = cleaned.replace(/^\uFEFF/, '');
    return cleaned.trim();
  }

  async parseFile(file: Express.Multer.File): Promise<string> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const fileSizeMB = file.size / (1024 * 1024);

    this.logger.log(
      `📄 Parsing file: ${file.originalname} (${fileSizeMB.toFixed(2)} MB)`,
    );

    try {
      let content = '';

      switch (extension) {
        case 'txt':
        case 'md':
        case 'csv':
        case 'json':
        case 'xml':
        case 'html':
          content = file.buffer.toString('utf-8');
          break;

        case 'pdf':
          this.logger.warn('PDF file detected, using filename as content');
          content = `PDF Document: ${file.originalname}`;
          break;

        case 'docx':
          try {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({
              buffer: file.buffer,
            });
            content = result.value || '';
          } catch (error) {
            throw new BadRequestException(
              `DOCX parsing failed: ${error.message}`,
            );
          }
          break;

        case 'xlsx':
        case 'xls':
          try {
            const XLSX = require('xlsx');
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            let text = '';
            workbook.SheetNames.forEach((sheetName) => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);
              text += `Sheet: ${sheetName}\n`;
              jsonData.forEach((row: any) => {
                text += Object.values(row).join(' ') + '\n';
              });
              text += '\n';
            });
            content = text;
          } catch (error) {
            throw new BadRequestException(
              `Excel parsing failed: ${error.message}`,
            );
          }
          break;

        default:
          try {
            content = file.buffer.toString('utf-8');
          } catch {
            throw new BadRequestException(
              `Unsupported file type: ${extension}`,
            );
          }
      }

      let cleanedContent = this.cleanContent(content);

      if (!cleanedContent || cleanedContent.length < 20) {
        cleanedContent = `Document: ${file.originalname}`;
      }

      this.logger.log(
        `File parsed: ${file.originalname} (${cleanedContent.length} chars)`,
      );
      return cleanedContent;
    } catch (error) {
      this.logger.error(
        `Failed to parse ${file.originalname}: ${error.message}`,
      );
      return `Document: ${file.originalname}`;
    }
  }
}
