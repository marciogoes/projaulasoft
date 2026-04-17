'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('E-mail ou senha inválidos');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4">
            <span className="text-2xl">⚖️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Cartorial</h1>
          <p className="text-slate-400 text-sm mt-1">TJPA — Serviços cartoriais digitais</p>
        </div>

        {/* Card de login */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Entrar na sua conta</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                className="input-base"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input-base"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Login Gov.br */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => signIn('keycloak')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5 border-2 border-slate-300 hover:border-teal-500 rounded-xl text-sm font-medium text-slate-700 transition-colors"
            >
              🏛️ Entrar com Gov.br
            </button>
          </div>
        </div>

        {/* Credenciais demo */}
        <div className="mt-4 p-4 bg-white/10 rounded-xl text-xs text-slate-300">
          <p className="font-medium text-slate-200 mb-1">🧪 Credenciais de demonstração:</p>
          <p>Cidadão: <code className="text-teal-300">cidadao@example.com / senha123</code></p>
          <p>Atendente: <code className="text-teal-300">atendente@cartorio.gov.br / senha123</code></p>
        </div>
      </div>
    </div>
  );
}
