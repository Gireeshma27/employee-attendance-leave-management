'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    setSubmitted(true);
    setError('');
  };

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Forgot Password?</CardTitle>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <>
              <p className="text-gray-600 text-sm mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  required
                />

                <Button type="submit" variant="primary" className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <Alert
              title="Check your email"
              description="We've sent a password reset link to your email address. Click the link to proceed."
              type="success"
              dismissible={false}
            />
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-600 hover:underline text-sm">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
