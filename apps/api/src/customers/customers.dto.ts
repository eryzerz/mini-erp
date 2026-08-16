import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaginationDto } from "@repo/common";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCustomerDto {
  @ApiProperty({ example: "PT Maju Jaya" })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: "hello@majujaya.co.id" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+62 21 555 0134" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "01.234.567.8-901.000" })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: "Jl. Sudirman Kav. 52, Jakarta" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateCustomerDto extends CreateCustomerDto {}

export class ListCustomersQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ["name", "createdAt"] })
  @IsOptional()
  @IsString()
  sort?: "name" | "createdAt";
}
