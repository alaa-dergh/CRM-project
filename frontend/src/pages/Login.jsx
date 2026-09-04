import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grey-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-grey-200 rounded-lg p-8  w-[400px] h-[440px] "
      >
        <h1 className="text-2xl font-bold  mb-2 text-center">Login</h1>
        <p className="text-[11px] text-center text-gray-500 mb-6">Veuillez vous identifier pour accéder à votre espace commercial.</p>

        {error && (
          <p className="text-sm text-charcoal bg-gray-100 border border-grey-200 rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        

        <label className="block text-sm mb-1 text-grey-600 mt-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-grey-200 rounded px-3 py-2 mb-4 focus:outline-none focus:border-ink"
          required
        />

        <label className="block text-sm mb-1 text-grey-600">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-grey-200 rounded px-3 py-2 mb-6 focus:outline-none focus:border-ink"
          required
        />
        <br></br>
        <br></br>

        <button
          type="submit"
          className="w-full bg-ink text-white rounded py-2 hover:bg-charcoal transition"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
