import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ownerLogin } from "../services/owner.api";

const OwnerLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await ownerLogin(email, password);
      navigate("/owners/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Owner login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-5">Owner Login</h1>

      <form onSubmit={onSubmit} className="border border-zinc-200 rounded-lg p-5">
        <input
          type="email"
          placeholder="Owner email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md mb-3 border-zinc-300"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md mb-3 border-zinc-300"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error ? <p className="text-red-600 text-sm mt-3">{error}</p> : null}
      </form>

      <button
        onClick={() => navigate("/")}
        className="mt-4 text-sm underline text-zinc-700 cursor-pointer"
      >
        Back to user login
      </button>
    </div>
  );
};

export default OwnerLogin;
