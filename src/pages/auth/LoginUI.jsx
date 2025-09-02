import LoadingSpinner from "../../components/common/LoadingSpinner";

const LoginUI = ({
  role,
  setRole,
  email,
  setEmail,
  emailError,
  password,
  setPassword,
  passwordError,
  showPassword,
  togglePasswordVisibility,
  isLoading,
  handleSubmit,
  showError,
  errorMsg,
}) => {
  const getRoleIcon = (roleName) => {
    if (roleName === "Ward President") {
      return (
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 7l4 4 4-8 4 8 4-4v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        />
      </svg>
    );
  };

  return (
    <div className="w-1/2 flex flex-col justify-center items-center p-12 bg-white relative">
      {showError && (
        <div className="absolute top-6 left-6 z-10 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center shadow-lg">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errorMsg || "Login failed"}</span>
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="text-right mb-6">
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secure Portal
          </span>
        </div>

        <h2 className="text-3xl font-bold text-gray-800">Sign In</h2>
        <p className="text-gray-500 mt-2 mb-8">
          Welcome back! Please sign in to your account.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="access-level"
            >
              Access Level
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getRoleIcon(role)}
              </div>
              <select
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-[#5C52CF] focus:border-[#5C52CF] appearance-none bg-white"
                id="access-level"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                }}
              >
                <option value="Ward President">
                  Ward President - Ward-level management
                </option>
                <option value="Assembly Head">
                  Assembly Head - Assembly-level management
                </option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="email"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                className={`w-full pl-10 pr-4 py-3 border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#5C52CF] focus:border-[#5C52CF]`}
                id="email"
                placeholder="Enter your official email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                className={`w-full pl-10 pr-12 py-3 border ${
                  passwordError ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-[#5C52CF] focus:border-[#5C52CF]`}
                id="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                type="button"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <input
                className="h-4 w-4 text-[#5C52CF] border-gray-300 rounded focus:ring-[#5C52CF]"
                id="remember-me"
                type="checkbox"
              />
              <label
                className="ml-2 block text-sm text-gray-900"
                htmlFor="remember-me"
              >
                Remember me
              </label>
            </div>
            <a
              className="text-sm font-medium text-[#5C52CF] hover:text-[#4e45b7]"
              href="#"
            >
              Forgot password?
            </a>
          </div>

          <button
            className={`w-full bg-[#5C52CF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#4e45b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C52CF] transition-colors duration-300 flex items-center justify-center ${
              isLoading ? "opacity-75 cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner light />
                <span className="ml-2">Signing in...</span>
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginUI;
