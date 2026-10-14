package database

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func Connect() (*mongo.Client, error) {

	client, err := mongo.Connect(options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Panicf("error connecting to database: %v", err.Error())
	}

	if err := client.Ping(context.Background(), nil); err != nil {
		log.Panicf("error pinging database: %v", err.Error())
	}

	return client, nil
}
