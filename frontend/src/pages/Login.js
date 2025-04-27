// pages/Login.js
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";  // Added useNavigate
import "./Login.css";

const Login = ({ setIsAuthenticated, setUserEmail }) => {
    const navigate = useNavigate();  // Hook for navigation

    const handleSuccess = (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        const email = decoded.email;

        // Save user session info
        localStorage.setItem("userEmail", email);
        setUserEmail(email);
        setIsAuthenticated(true);

        // Redirect to Dashboard after successful login
        navigate("/", { replace: true });
    };

    return (
        <div className="login-wrapper">
            <div className="login-box">
                <h2 className="brand-title">Welcome to Lawtomate</h2>
                <p className="brand-subtitle">Login via Google</p>
                <div className="google-login-wrapper">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => console.log("Login Failed")}
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
