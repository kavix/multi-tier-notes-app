package processor

import (
	"strings"
)

// ProcessNote computes the word count and generates a summary for the given content.
//
// Word count is determined by splitting on whitespace and counting non-empty tokens.
// Summary is the first 200 characters of content with "..." appended if truncated,
// or the full content if it is 200 characters or fewer.
func ProcessNote(content string) (wordCount int, summary string) {
	// Word count: split by whitespace, count non-empty tokens
	fields := strings.Fields(content)
	wordCount = len(fields)

	// Summary: first 200 chars + "..." if truncated
	if len(content) > 200 {
		summary = content[:200] + "..."
	} else {
		summary = content
	}

	return wordCount, summary
}
