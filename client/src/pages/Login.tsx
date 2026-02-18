import { useState } from "react";
import {
  Button,
  TextField,
  Label,
  Input,
  FieldError,
  Spinner,
} from "@heroui/react";
import { supabase } from "../lib/supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface-secondary">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-surface">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Sidekick</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            name="email"
            type="email"
            isRequired
            value={email}
            onChange={setEmail}
          >
            <Label>Email</Label>
            <Input placeholder="you@example.com" />
          </TextField>

          <TextField
            name="password"
            type="password"
            isRequired
            value={password}
            onChange={setPassword}
          >
            <Label>Password</Label>
            <Input placeholder="••••••••" />
          </TextField>

          {error && (
            <FieldError className="text-sm">{error}</FieldError>
          )}

          <Button type="submit" fullWidth isPending={isLoading}>
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : null}
                {isPending ? "Signing in..." : "Sign In"}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
