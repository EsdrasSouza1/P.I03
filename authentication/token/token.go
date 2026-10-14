package token

import (
	"fmt"
	"time"

	"github.com/EsdrasSouza1/P.I03/config"
	"github.com/golang-jwt/jwt/v5"
)

// CreateTokenJWT é uma função que gera um token JWT para um usuário autenticado, usando o ID do usuário como payload
func CreateTokenJWT(userID int) (string, error) {
	var secretKey = config.GetToken("JWT_KEY")
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 3).Unix(),
	})
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// ValidateTokenJWT é uma função que valida um token JWT recebido,
// verificando sua assinatura e extraindo as claims (informações) contidas no token
func ValidateTokenJWT(tokenString string) (jwt.MapClaims, error) {
	var secretKey = config.GetToken("JWT_KEY")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("failed to assert claims")
	}

	return claims, nil
}
