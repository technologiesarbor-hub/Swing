package main

import (
	"os"
	"os/signal"
	"syscall"

	"serving/app/cmd/common"
	"serving/app/pkg/logx"
	"serving/config"
	"serving/web"
)

func startWeb() {
	webShutDown := make(chan bool, 1)

	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		web.ShutDown()
		common.Close()
		webShutDown <- true
	}()

	if err := common.RunStartupTasks(); err != nil {
		logx.Error("startup tasks failed", err)
		panic(err)
	}
	web.Start()
	<-webShutDown
}

func main() {
	config.Init()
	logx.Init(config.IsDev())
	startWeb()
}
