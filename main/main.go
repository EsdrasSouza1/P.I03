package main

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"unicode/utf8"

	"golang.org/x/crypto/argon2"
)

var demoUsers = struct {
	sync.RWMutex
	users map[string]storedUser
}{users: make(map[string]storedUser)}

type storedUser struct {
	Name         string
	PasswordHash string
}

func main() {
	_, sourceFile, _, ok := runtime.Caller(0)
	if !ok {
		log.Fatal("não foi possível localizar os arquivos do projeto")
	}
	webDir := filepath.Join(filepath.Dir(sourceFile), "..", "web")
	webDir, err := filepath.Abs(webDir)
	if err != nil {
		log.Fatal(err)
	}
	fileServer := http.FileServer(http.Dir(webDir))
	serveHTML := func(file string) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, filepath.Join(webDir, file))
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/login", loginHandler)
	mux.HandleFunc("/api/register", registerHandler)
	mux.HandleFunc("/api/logout", logoutHandler)
	mux.HandleFunc("/dashboard", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("sistfy_demo")
		if err != nil || cookie.Value != "authenticated" {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}
		serveHTML("dashboard.html")(w, r)
	})
	mux.HandleFunc("/cadastro", serveHTML("register.html"))
	mux.Handle("/", fileServer)

	log.Println("Sistfy disponível em http://localhost:8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name: "sistfy_demo", Value: "", Path: "/", MaxAge: -1,
		HttpOnly: true, SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusNoContent)
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}
	var credentials loginRequest
	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		http.Error(w, "dados de login inválidos", http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(credentials.Email))
	validCredentials := email == "demo@sistfy.com" && credentials.Password == "sistfy123"
	demoUsers.RLock()
	user, exists := demoUsers.users[email]
	demoUsers.RUnlock()
	if exists && verifyPassword(credentials.Password, user.PasswordHash) {
		validCredentials = true
	}
	if !validCredentials {
		http.Error(w, "E-mail ou senha incorretos.", http.StatusUnauthorized)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name: "sistfy_demo", Value: "authenticated", Path: "/",
		HttpOnly: true, SameSite: http.SameSiteLaxMode,
	})
	w.WriteHeader(http.StatusOK)
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "método não permitido", http.StatusMethodNotAllowed)
		return
	}
	var input registerRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&input); err != nil {
		http.Error(w, "Confira os dados enviados.", http.StatusBadRequest)
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	if utf8.RuneCountInString(input.Name) < 2 || !strings.Contains(input.Email, "@") || len(input.Password) < 8 {
		http.Error(w, "Informe nome, e-mail válido e senha com pelo menos 8 caracteres.", http.StatusBadRequest)
		return
	}
	hash, err := hashPassword(input.Password)
	if err != nil {
		http.Error(w, "Não foi possível criar a conta agora.", http.StatusInternalServerError)
		return
	}

	demoUsers.Lock()
	defer demoUsers.Unlock()
	if input.Email == "demo@sistfy.com" {
		http.Error(w, "Esse e-mail já está em uso.", http.StatusConflict)
		return
	}
	if _, exists := demoUsers.users[input.Email]; exists {
		http.Error(w, "Esse e-mail já está cadastrado neste servidor.", http.StatusConflict)
		return
	}
	demoUsers.users[input.Email] = storedUser{Name: input.Name, PasswordHash: hash}
	w.WriteHeader(http.StatusCreated)
}

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	derived := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
	return base64.RawStdEncoding.EncodeToString(salt) + "." + base64.RawStdEncoding.EncodeToString(derived), nil
}

func verifyPassword(password, encoded string) bool {
	parts := strings.Split(encoded, ".")
	if len(parts) != 2 {
		return false
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[0])
	if err != nil {
		return false
	}
	expected, err := base64.RawStdEncoding.DecodeString(parts[1])
	if err != nil {
		return false
	}
	actual := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1
}
