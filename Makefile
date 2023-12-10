.PHONY: environment build format start test

# Load env
ifneq (,$(wildcard ./.env))
include .env
VARS:=$(shell sed -ne 's/ *\#.*$$//; /./ s/=.*$$// p' .env )
$(foreach v,$(VARS),$(eval $(shell echo export $(v)="$($(v))")))
endif

environment:
	npm install

build:
	npm run build

format:
	npm run prettier

start:
	npm run dev

test:
	npm run test
