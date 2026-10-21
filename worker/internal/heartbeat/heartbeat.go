package heartbeat

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	// HeartbeatKey is the Redis key used for the worker heartbeat.
	HeartbeatKey = "worker:heartbeat"
	// HeartbeatInterval is how often the heartbeat is written.
	HeartbeatInterval = 5 * time.Second
	// HeartbeatTTL is the TTL for the heartbeat key (auto-expires if worker dies).
	HeartbeatTTL = 15 * time.Second
)

// Start begins the heartbeat loop, writing the current UTC timestamp to Redis
// every HeartbeatInterval. It runs until the context is cancelled.
func Start(ctx context.Context, client *redis.Client) {
	ticker := time.NewTicker(HeartbeatInterval)
	defer ticker.Stop()

	// Write an initial heartbeat immediately
	writeHeartbeat(ctx, client)

	for {
		select {
		case <-ctx.Done():
			log.Println("Heartbeat goroutine stopping")
			return
		case <-ticker.C:
			writeHeartbeat(ctx, client)
		}
	}
}

func writeHeartbeat(ctx context.Context, client *redis.Client) {
	now := time.Now().UTC().Format(time.RFC3339)
	err := client.Set(ctx, HeartbeatKey, now, HeartbeatTTL).Err()
	if err != nil {
		log.Printf("Error writing heartbeat: %v", err)
		return
	}
	log.Printf("Heartbeat written: %s = %s (TTL %s)", HeartbeatKey, now, HeartbeatTTL)
}
