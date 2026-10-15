package main

import (
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type application struct {
	API_port           string
	API_maxHeaderBytes int
	API_readTimeout    time.Duration
	API_writeTimeout   time.Duration
}

func (app *application) init(r *chi.Mux) {
	server := &http.Server{
		Addr:           app.API_port,
		Handler:        r,
		MaxHeaderBytes: app.API_maxHeaderBytes,
		ReadTimeout:    app.API_readTimeout,
		WriteTimeout:   app.API_writeTimeout,
	}

	if err := server.ListenAndServe(); err != nil {
		log.Panicf("error starting server: %v", err)
	}
}
