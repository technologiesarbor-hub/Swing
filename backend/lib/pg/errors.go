package pg

import (
	"errors"

	"github.com/lib/pq"
)

func IsUniqueViolation(err error) bool {
	var e *pq.Error
	return errors.As(err, &e) && e.Code == "23505"
}
