// src/modules/search/search.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
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
