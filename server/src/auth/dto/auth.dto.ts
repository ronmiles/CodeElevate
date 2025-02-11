import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class OnboardingDto {
  @IsString()
  @IsNotEmpty()
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  preferredLanguages: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  learningGoals: string[];
} 