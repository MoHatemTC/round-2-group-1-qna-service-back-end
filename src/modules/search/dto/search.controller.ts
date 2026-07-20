import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './search.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @Roles('ADMIN', 'USER') 
  @HttpCode(HttpStatus.OK)
  async search(@Body() searchDto: SearchDto) {
    const results = await this.searchService.search(searchDto);
    return {
      success: true,
      query: searchDto.query,
      count: results.length,
      results,
    };
  }
}
