package main

import "time"

type application struct {
	API_port           string
	API_maxHeaderBytes int
	API_readTimeout    time.Duration
	API_writeTimeout   time.Duration
}
