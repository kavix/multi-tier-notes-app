package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/multi-tier-notes-app/worker/internal/heartbeat"
	"github.com/multi-tier-notes-app/worker/internal/pubsub"
)

// Config holds the application configuration parsed from environment variables.
type Config struct {
	RedisHost string
	RedisPort string
}

func loadConfig() Config {
	cfg := Config{
		RedisHost: "localhost",
		RedisPort: "6379",
	}
	if v := os.Getenv("REDIS_HOST"); v != "" {
		cfg.RedisHost = v
	}
	if v := os.Getenv("REDIS_PORT"); v != "" {
		cfg.RedisPort = v
	}
	return cfg
}

func connectRedis(ctx context.Context, cfg Config) (*redis.Client, error) {
	addr := fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)
	client := redis.NewClient(&redis.Options{
		Addr: addr,
	})

	const maxRetries = 30
	const retryDelay = 2 * time.Second

	for i := 1; i <= maxRetries; i++ {
		err := client.Ping(ctx).Err()
		if err == nil {
			log.Printf("Connected to Redis at %s", addr)
			return client, nil
		}
		log.Printf("Redis connection attempt %d/%d failed: %v", i, maxRetries, err)
		if i < maxRetries {
			time.Sleep(retryDelay)
		}
	}

	return nil, fmt.Errorf("failed to connect to Redis at %s after %d attempts", addr, maxRetries)
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Println("Starting worker service...")

	cfg := loadConfig()
	log.Printf("Config: REDIS_HOST=%s, REDIS_PORT=%s", cfg.RedisHost, cfg.RedisPort)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Connect to Redis with retry logic
	client, err := connectRedis(ctx, cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer func() {
		if err := client.Close(); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
	}()

	// Start heartbeat goroutine
	go heartbeat.Start(ctx, client)
	log.Println("Heartbeat goroutine started")

	// Start pub/sub subscriber in a goroutine
	go pubsub.Subscribe(ctx, client)
	log.Println("Pub/sub subscriber started on channel 'note_jobs'")

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigCh
	log.Printf("Received signal %v, shutting down gracefully...", sig)
	cancel()

	// Give goroutines a moment to clean up
	time.Sleep(500 * time.Millisecond)
	log.Println("Worker service stopped")
}
