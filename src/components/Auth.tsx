import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert(error.message);
    }
  };

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Conta criada com sucesso');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-dark-900">
      <div className="w-full max-w-sm bg-dark-800 p-6 rounded-2xl border border-dark-600">

        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          CLINIC-AI 24H
        </h1>

        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-dark-700 text-white border border-dark-500"
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-dark-700 text-white border border-dark-500"
        />

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-accent-700 hover:bg-accent-600 text-white mb-3"
        >
          Entrar
        </button>

        <button
          onClick={handleRegister}
          className="w-full py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-white"
        >
          Criar conta
        </button>
      </div>
    </div>
  );
}