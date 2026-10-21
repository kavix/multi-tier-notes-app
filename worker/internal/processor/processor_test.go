package processor

import "testing"

func TestProcessNote(t *testing.T) {
	tests := []struct {
		name          string
		content       string
		wantWordCount int
		wantSummary   string
	}{
		{
			name:          "Empty string",
			content:       "",
			wantWordCount: 0,
			wantSummary:   "",
		},
		{
			name:          "Short note",
			content:       "Hello world! This is a simple note.",
			wantWordCount: 7,
			wantSummary:   "Hello world! This is a simple note.",
		},
		{
			name:          "Multiple spaces and newlines",
			content:       "Line 1\n\nLine 2   with   spaces\t\nLine 3",
			wantWordCount: 8,
			wantSummary:   "Line 1\n\nLine 2   with   spaces\t\nLine 3",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotCount, gotSummary := ProcessNote(tt.content)
			if gotCount != tt.wantWordCount {
				t.Errorf("ProcessNote() wordCount = %v, want %v", gotCount, tt.wantWordCount)
			}
			if gotSummary != tt.wantSummary {
				t.Errorf("ProcessNote() summary = %q, want %q", gotSummary, tt.wantSummary)
			}
		})
	}
}

func TestProcessNoteTruncation(t *testing.T) {
	// 250 characters string
	longContent := "01234567890123456789012345678901234567890123456789" +
		"01234567890123456789012345678901234567890123456789" +
		"01234567890123456789012345678901234567890123456789" +
		"01234567890123456789012345678901234567890123456789" +
		"01234567890123456789012345678901234567890123456789"

	_, summary := ProcessNote(longContent)
	if len(summary) != 203 { // 200 + "..."
		t.Errorf("Expected truncated summary length 203, got %d", len(summary))
	}
	if summary[200:] != "..." {
		t.Errorf("Expected summary to end with '...', got %s", summary[200:])
	}
}
