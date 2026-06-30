package main



import (

	"fmt"

	"log"

	"net/http"

	"strconv"

	"time"



	"github.com/danielgtaylor/huma/v2"

	"github.com/danielgtaylor/huma/v2/adapters/humagin"

	"github.com/gin-gonic/gin"

	"github.com/schelling/kuro/backend/internal/auth/provider"

	"github.com/schelling/kuro/backend/internal/config"

	"github.com/schelling/kuro/backend/internal/database"

	"github.com/schelling/kuro/backend/internal/handler"

	"github.com/schelling/kuro/backend/internal/handlers"

	"github.com/schelling/kuro/backend/internal/models"

)



func main() {

	cfg := config.Load()



	db, err := database.Connect(cfg.Database)

	if err != nil {

		log.Fatalf("database connection failed: %v", err)

	}

	log.Println("PostgreSQL connection established")



	if err := db.AutoMigrate(&models.Debitor{}, &models.Kontakt{}); err != nil {

		log.Fatalf("database migration failed: %v", err)

	}

	log.Println("Database schema migrated")



	authService, err := provider.NewService(cfg.Auth)

	if err != nil {

		log.Fatalf("auth service init failed: %v", err)

	}

	log.Printf("Auth provider: %s", authService.Provider())



	gin.SetMode(gin.ReleaseMode)

	router := gin.New()

	router.Use(gin.Recovery(), gin.Logger())



	humaCfg := huma.DefaultConfig("Kuro API", "1.0.0")

	humaCfg.Info.Description = "Firmen-Applikation Kuro — Backend API"

	humaCfg.Servers = []*huma.Server{

		{URL: fmt.Sprintf("http://localhost:%d", cfg.Server.Port)},

	}



	api := humagin.New(router, humaCfg)

	handler.RegisterHealth(api, db, string(authService.Provider()))

	handlers.RegisterDebitoren(api, db)

	handlers.RegisterKontakte(api, db)

	handlers.RegisterWaehrungen(api)

	handlers.RegisterAuth(

		api,

		authService,

		cfg.Auth.TokenSecret,

		time.Duration(cfg.Auth.TokenTTLHours)*time.Hour,

	)



	addr := cfg.Server.Host + ":" + strconv.Itoa(cfg.Server.Port)

	log.Printf("Starting server on %s (docs: http://localhost:%d/docs)", addr, cfg.Server.Port)



	if err := http.ListenAndServe(addr, router); err != nil {

		log.Fatalf("server failed: %v", err)

	}

}


