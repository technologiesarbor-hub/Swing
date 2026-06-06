module lib

go 1.22

// Sole third-party module: Postgres driver, kept at the lib boundary for audit/vendor.
require github.com/lib/pq v1.10.9
