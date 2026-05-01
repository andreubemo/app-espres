"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/budgets";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setErrorMessage("No se pudo iniciar sesión.");
        return;
      }

      if (result.error) {
        setErrorMessage("Email o contraseña incorrectos.");
        return;
      }

      router.push(result.url || callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("Ha ocurrido un error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-background p-4">
      <div className="w-full max-w-md rounded-md border border-border border-t-2 border-t-primary bg-card-background p-4 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-text-neutral">
            Accede con tu usuario interno para guardar y gestionar presupuestos.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded border px-3 py-2 outline-none focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded border px-3 py-2 outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          {errorMessage && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-primary px-4 py-2 text-white transition hover:bg-primary-strong disabled:opacity-50"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-background p-4">
      <div className="w-full max-w-md rounded-md border border-border border-t-2 border-t-primary bg-card-background p-4 shadow-sm">
        <p className="text-sm text-text-neutral">Cargando formulario de acceso...</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
