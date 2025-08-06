package cache

import (
	"github.com/patrickmn/go-cache"
	"time"
)

var localCache *cache.Cache

func InitCache() {
	localCache = cache.New(5*time.Minute, 10*time.Minute)
}

func Set(key string, value interface{}, expiration time.Duration) {
	localCache.Set(key, value, expiration)
}

func Get(key string) (interface{}, bool) {
	return localCache.Get(key)
}
