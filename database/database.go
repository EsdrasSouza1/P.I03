package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoDBConfig struct {
	URI             string
	Database        string
	MaxPoolSize     uint64
	MinPoolSize     uint64
	MaxConnIdleTime time.Duration
	ConnectTimeout  time.Duration
}

func (config *MongoDBConfig) Connect() *mongo.Client {

	clientOptions := options.Client().
		ApplyURI(config.URI).
		SetMaxPoolSize(config.MaxPoolSize).
		SetMinPoolSize(config.MinPoolSize).
		SetMaxConnIdleTime(config.MaxConnIdleTime).
		SetConnectTimeout(config.ConnectTimeout)

	client, err := mongo.Connect(clientOptions)
	if err != nil {
		log.Panicf("error connecting to database: %v", err.Error())
	}

	client.Database(config.Database)

	if err := client.Ping(context.Background(), nil); err != nil {
		log.Panicf("error pinging database: %v", err.Error())
	}

	return client
}
