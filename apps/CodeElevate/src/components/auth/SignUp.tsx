import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.svg';

const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUp: React.FC = () => {
  const { signUp, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      await signUp({ email: data.email, password: data.password });
      navigate('/onboarding');
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="auth-card">
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="CodeElevate Logo" className="h-10 w-10 mb-2" />
          <span className="text-2xl font-bold text-text">CodeElevate</span>
        </div>
        <div>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Start your learning journey today</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text mb-2"
              >
                Email address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="auth-error mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text mb-2"
              >
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                className="auth-input"
                placeholder="Create a strong password"
              />
              {errors.password && (
                <p className="auth-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text mb-2"
              >
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                className="auth-input"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="auth-error mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="flex flex-col space-y-4">
            <button type="submit" disabled={isLoading} className="auth-button">
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>

            <div className="text-center">
              <span className="text-text-secondary">
                Already have an account?{' '}
              </span>
              <Link to="/signin" className="auth-link font-medium">
                Sign in instead
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
