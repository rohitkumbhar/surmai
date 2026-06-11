package routes

import (
	"backend/cache"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase/core"
)

func ExplorePOIs(e *core.RequestEvent) error {
	var payload struct {
		Query string `json:"query"`
	}
	if err := json.NewDecoder(e.Request.Body).Decode(&payload); err != nil {
		return e.JSON(http.StatusBadRequest, map[string]string{"error": "invalid JSON body"})
	}
	query := strings.TrimSpace(payload.Query)
	if query == "" {
		return e.JSON(http.StatusBadRequest, map[string]string{"error": "query is required"})
	}

	// Create a cache key from the query hash
	hash := sha256.Sum256([]byte(query))
	cacheKey := fmt.Sprintf("overpass-%x", hash)

	// Check cache first
	val, found := cache.Get(cacheKey)
	if found {
		cachedJSON, ok := val.([]byte)
		if ok {
			e.Response.Header().Set("Content-Type", "application/json")
			_, writeErr := e.Response.Write(cachedJSON)
			return writeErr
		}
	}

	// Forward request to Overpass API
	resp, err := http.Post(
		"http://localhost:12346/api/interpreter",
		"application/x-www-form-urlencoded",
		strings.NewReader("data="+query),
	)
	if err != nil {
		return e.JSON(http.StatusBadGateway, map[string]string{"error": "failed to reach Overpass API"})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return e.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to read response"})
	}

	if resp.StatusCode != http.StatusOK {
		return e.JSON(resp.StatusCode, map[string]string{"error": string(body)})
	}

	// Cache the raw bytes for 30 minutes
	cache.Set(cacheKey, body, 30*time.Minute)

	e.Response.Header().Set("Content-Type", "application/json")
	_, writeErr := e.Response.Write(body)
	return writeErr
}
