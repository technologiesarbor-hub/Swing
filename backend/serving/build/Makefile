# Run from backend/serving (service root).

.PHONY: run build tidy test

run:
	go run .

build:
	go build -o build/serving .

tidy:
	go mod tidy

test:
	./build/scripts/run-test.sh
