import { useState } from "react";
import { supabase } from "../lib/supabase";

const Auth = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const { data, error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) return setError(error.message);

    if (!isLogin) {
      setSuccess("Sign-up successful! Please check your email to verify your account.");
      return; // Stop execution after signup
    }

    // ✅ Check if user is verified before proceeding
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) return setError(userError.message);
    
    if (!userData?.user?.email_confirmed_at) {
      return setError("Please confirm your email before logging in.");
    }

    // ✅ Only proceed if the email is verified
    onAuthSuccess(userData.user);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isLogin ? "Sign In" : "Sign Up"}
      </h2>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {success && <p className="text-green-500 text-sm text-center">{success}</p>}

      <input
        type="email"
        className="w-full p-3 border rounded mb-2"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        className="w-full p-3 border rounded mb-2"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        className={`w-full p-3 rounded mt-3 ${
          loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
        } text-white`}
        onClick={handleAuth}
        disabled={loading}
      >
        {loading ? (isLogin ? "Logging in..." : "Signing up...") : isLogin ? "Login" : "Sign Up"}
      </button>

      <p className="text-center mt-3">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          className="text-blue-500 hover:underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>
    </div>
  );
};

export default Auth;
