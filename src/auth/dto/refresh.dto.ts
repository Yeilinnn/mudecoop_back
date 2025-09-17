import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....',
    description: 'Refresh token vigente',
  })
  @IsString()
  @IsNotEmpty({ message: 'El refreshToken es obligatorio' })
  
  refreshToken: string;
  
}
