# Makefile for ApexFlow Enterprise CRM Suite
.PHONY: all install build test start clean lint

all: install build test

install:
	npm install

build:
	node js/build.js

test:
	node --test tests/*.test.js

start:
	npm start

lint:
	npm run lint

clean:
	rm -rf dist coverage .nyc_output
