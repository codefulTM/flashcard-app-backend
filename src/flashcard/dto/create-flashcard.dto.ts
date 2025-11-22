import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateFlashcardDto {
  @IsNotEmpty()
  @IsUUID()
  deck_id: string;

  @IsNotEmpty()
  @IsString()
  front_content: string;

  @IsNotEmpty()
  @IsString()
  back_content: string;

  @IsOptional()
  @IsString()
  hint?: string;

  @IsOptional()
  @IsString()
  mnemonic?: string;

  @IsOptional()
  @IsBoolean()
  is_suspended?: boolean;
}
