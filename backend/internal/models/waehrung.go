package models

const DefaultWaehrung = "CHF"

type WaehrungInfo struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

var SupportedWaehrungen = []WaehrungInfo{
	{Code: "CHF", Name: "Schweizer Franken"},
	{Code: "EUR", Name: "Euro"},
	{Code: "USD", Name: "US-Dollar"},
	{Code: "GBP", Name: "Britisches Pfund"},
	{Code: "JPY", Name: "Japanischer Yen"},
	{Code: "CNY", Name: "Chinesischer Yuan"},
	{Code: "CAD", Name: "Kanadischer Dollar"},
	{Code: "AUD", Name: "Australischer Dollar"},
	{Code: "SEK", Name: "Schwedische Krone"},
	{Code: "NOK", Name: "Norwegische Krone"},
	{Code: "DKK", Name: "Dänische Krone"},
	{Code: "PLN", Name: "Polnischer Zloty"},
	{Code: "CZK", Name: "Tschechische Krone"},
	{Code: "HUF", Name: "Ungarischer Forint"},
	{Code: "TRY", Name: "Türkische Lira"},
	{Code: "INR", Name: "Indische Rupie"},
	{Code: "BRL", Name: "Brasilianischer Real"},
	{Code: "SGD", Name: "Singapur-Dollar"},
	{Code: "HKD", Name: "Hongkong-Dollar"},
	{Code: "ZAR", Name: "Südafrikanischer Rand"},
	{Code: "AED", Name: "VAE-Dirham"},
	{Code: "MXN", Name: "Mexikanischer Peso"},
	{Code: "NZD", Name: "Neuseeland-Dollar"},
	{Code: "KRW", Name: "Südkoreanischer Won"},
	{Code: "RON", Name: "Rumänischer Leu"},
	{Code: "BGN", Name: "Bulgarischer Lew"},
	{Code: "ILS", Name: "Israelischer Schekel"},
	{Code: "THB", Name: "Thailändischer Baht"},
	{Code: "MYR", Name: "Malaysischer Ringgit"},
	{Code: "PHP", Name: "Philippinischer Peso"},
}

func IsValidWaehrung(code string) bool {
	for _, w := range SupportedWaehrungen {
		if w.Code == code {
			return true
		}
	}
	return false
}

func NormalizeWaehrung(code string) string {
	if code == "" {
		return DefaultWaehrung
	}
	return code
}
