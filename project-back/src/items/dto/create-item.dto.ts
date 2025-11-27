import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  defaultSize?: number;

  @IsString()
  @IsOptional()
  category?: string;
}
