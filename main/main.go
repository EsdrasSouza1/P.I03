package main

import (
	"context"
	"log"
	"time"

	"github.com/EsdrasSouza1/P.I03/database"
	"github.com/EsdrasSouza1/P.I03/internal/router"
)

func main() {
	app := &application{
		API_port:           ":8080",
		API_maxHeaderBytes: 1 << 20, // 1 MB
		API_readTimeout:    10 * time.Second,
		API_writeTimeout:   10 * time.Second,
	}

	database := &database.MongoDBConfig{
		URI:             "mongodb://localhost:27017",
		Database:        "myapp",
		MaxPoolSize:     100,
		MinPoolSize:     10,
		MaxConnIdleTime: 5 * time.Minute,
		ConnectTimeout:  10 * time.Second,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoConnection := database.Connect()
	log.Print("database connected!")
	defer func() {
		if err := mongoConnection.Disconnect(ctx); err != nil {
			log.Printf("error disconnecting from database: %v", err)
		}
	}()

	r := router.LoadRoutes()

	app.init(r)

}
