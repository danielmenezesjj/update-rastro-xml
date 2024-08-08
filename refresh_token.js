const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch');

const authenticateUser = async (username, password) => {
    try {
        const response = await fetch("http://192.168.0.14:8990/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `client_id=IntegracaoBimer.js&username=bimerapi&grant_type=password&password=5a53212d3a11c0c19aa46168d854f80c&nonce=123456789`,
        });

        if (!response.ok) {
            throw new Error(`Erro ao autenticar: ${response.statusText}`);
        }

        const tokens = await response.json();
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);

        return tokens.access_token;
    } catch (error) {
        console.error("Erro ao autenticar:", error);
        throw error;
    }
};

const fetchAccessToken = async (refreshToken) => {
    try {
        const response = await fetch("http://192.168.0.14:9898/refresh-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `client_id=IntegracaoBimer.js&username=bimerapi&grant_type=password&password=5a53212d3a11c0c19aa46168d854f80c&nonce=123456789`,
        });

        if (!response.ok) {
            throw new Error(`Erro ao renovar o token: ${response.statusText}`);
        }

        const newToken = await response.json();
        localStorage.setItem("access_token", newToken.access_token);
        localStorage.setItem("refresh_token", newToken.refresh_token);

        return newToken.access_token;
    } catch (error) {
        console.error("Erro ao renovar o token:", error);
        throw error;
    }
};

const updateAccessTokenPeriodically = async () => {
    try {
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
            const newAccessToken = await fetchAccessToken(refreshToken);
            localStorage.setItem("access_token", newAccessToken);
        } else {
            throw new Error("Refresh token não encontrado. O usuário precisa autenticar.");
        }
    } catch (error) {
        console.error("Erro ao atualizar o token:", error);
    }
};

module.exports = {
    authenticateUser,
    fetchAccessToken,
    updateAccessTokenPeriodically,
};
