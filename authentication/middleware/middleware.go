package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/EsdrasSouza1/P.I03/authentication/token"
)

func Authenticate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Token ausente ou mal formatado", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		dadosUsuarioRequesicao, err := token.ValidateTokenJWT(tokenString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "user_id", dadosUsuarioRequesicao["user_id"])

		r = r.WithContext(ctx)

		next(w, r)
	}
}
