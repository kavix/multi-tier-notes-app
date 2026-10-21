package pubsub

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"

	"github.com/multi-tier-notes-app/worker/internal/processor"
)

const (
	// JobChannel is the Redis pub/sub channel to subscribe to for incoming jobs.
	JobChannel = "note_jobs"
	// ResultChannel is the Redis pub/sub channel to publish results to.
	ResultChannel = "note_results"
	// ProcessedCountKey is the Redis key for tracking the number of processed jobs.
	ProcessedCountKey = "worker:processed_count"
)

// JobMessage represents an incoming job from the note_jobs channel.
type JobMessage struct {
	Action  string `json:"action"`
	NoteID  int    `json:"note_id"`
	Content string `json:"content"`
}

// ResultMessage represents the processing result published to note_results.
type ResultMessage struct {
	NoteID    int    `json:"note_id"`
	WordCount int    `json:"word_count"`
	Summary   string `json:"summary"`
}

// Subscribe listens on the note_jobs Redis pub/sub channel and processes incoming
// messages. It runs until the context is cancelled. Errors are logged but do not
// cause the subscriber to crash.
func Subscribe(ctx context.Context, client *redis.Client) {
	sub := client.Subscribe(ctx, JobChannel)
	defer func() {
		if err := sub.Close(); err != nil {
			log.Printf("Error closing subscriber: %v", err)
		}
	}()

	ch := sub.Channel()
	log.Printf("Listening for messages on channel '%s'", JobChannel)

	for {
		select {
		case <-ctx.Done():
			log.Println("Subscriber shutting down")
			return
		case msg, ok := <-ch:
			if !ok {
				log.Println("Subscriber channel closed")
				return
			}
			handleMessage(ctx, client, msg)
		}
	}
}

func handleMessage(ctx context.Context, client *redis.Client, msg *redis.Message) {
	log.Printf("Received message on channel '%s': %s", msg.Channel, msg.Payload)

	// Parse the incoming job message
	var job JobMessage
	if err := json.Unmarshal([]byte(msg.Payload), &job); err != nil {
		log.Printf("Error parsing job message: %v", err)
		return
	}

	if job.Action != "process" {
		log.Printf("Unknown action '%s', skipping", job.Action)
		return
	}

	// Process the note
	wordCount, summary := processor.ProcessNote(job.Content)
	log.Printf("Processed note_id=%d: word_count=%d, summary_len=%d", job.NoteID, wordCount, len(summary))

	// Build and publish the result
	result := ResultMessage{
		NoteID:    job.NoteID,
		WordCount: wordCount,
		Summary:   summary,
	}

	resultJSON, err := json.Marshal(result)
	if err != nil {
		log.Printf("Error marshaling result for note_id=%d: %v", job.NoteID, err)
		return
	}

	if err := client.Publish(ctx, ResultChannel, string(resultJSON)).Err(); err != nil {
		log.Printf("Error publishing result for note_id=%d: %v", job.NoteID, err)
		return
	}
	log.Printf("Published result to '%s' for note_id=%d", ResultChannel, job.NoteID)

	// Increment the processed count
	if err := client.Incr(ctx, ProcessedCountKey).Err(); err != nil {
		log.Printf("Error incrementing processed count: %v", err)
		return
	}
	log.Printf("Incremented %s", ProcessedCountKey)
}
