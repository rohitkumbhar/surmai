package jobs

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type SyncCurrencyDataJob struct {
	App core.App

	// BaseURL overrides the exchange rate API address and Client the HTTP
	// client. Both are set by tests; empty values call the public API.
	BaseURL string
	Client  *http.Client
}

// DefaultExchangeApiBaseURL is the open, free exchangerate-api.com endpoint.
const DefaultExchangeApiBaseURL = "https://open.er-api.com"

type ExchangeApiResponse struct {
	Result              string             `json:"result"`
	Rates               map[string]float64 `json:"rates"`
	TimeSinceLastUpdate string             `json:"time_last_update_utc"`
	TimeNextUpdate      string             `json:"time_next_update_utc"`
	TimeEol             int64              `json:"time_eol_unix"`
	BaseCode            string             `json:"base_code"`
}

// defaultCurrencyClient bounds the call so a stalled API cannot hold the job open.
var defaultCurrencyClient = &http.Client{Timeout: 30 * time.Second}

func (job *SyncCurrencyDataJob) Execute() {

	l := job.App.Logger().WithGroup("SyncCurrencyDataJob")

	if job.synchronizationRequired() {
		data, err := job.fetchCurrencyDataForUsd()
		if err != nil {
			l.Error("Could not fetch currency conversion data", "error", err)
		} else if data.Result != "success" {
			l.Error("Result of the fetch call was not a success", "result", data.Result)
		} else {

			if data.TimeEol != 0 {
				l.Warn("Currency data Fetch API marked for EOL", "eolTimestamp", data.TimeEol)
			}

			job.updateDatabase(data)
		}
	}
}

func (job *SyncCurrencyDataJob) updateDatabase(data *ExchangeApiResponse) {

	app := job.App
	l := app.Logger().WithGroup("SyncCurrencyDataJob")

	currencyConversions, _ := app.FindCollectionByNameOrId("currency_conversions")
	count, _ := app.CountRecords("currency_conversions")

	if count == 0 {
		_ = app.RunInTransaction(func(txApp core.App) error {
			for code, value := range data.Rates {
				record := core.NewRecord(currencyConversions)
				record.Set("currencyCode", code)
				record.Set("conversionRate", value)
				if err := txApp.Save(record); err != nil {
					return err
				}
			}
			return nil
		})
		l.Info("Created currency conversion records", "count", len(data.Rates))
	} else {
		records, _ := app.FindAllRecords("currency_conversions")
		_ = app.RunInTransaction(func(txApp core.App) error {
			for _, entry := range records {
				currencyCode := entry.GetString("currencyCode")
				newRate, ok := data.Rates[currencyCode]
				if ok {
					entry.Set("conversionRate", newRate)
					txApp.Save(entry)
				}
			}
			return nil
		})
		l.Info("Updated currency conversion records", "count", len(data.Rates))
	}
}

func (job *SyncCurrencyDataJob) fetchCurrencyDataForUsd() (*ExchangeApiResponse, error) {

	// Fetch the currency conversion data from exchangerate-api.com open/free api endpoint
	// The data uses USD as a base currency and saves all conversions rates wrt USD
	// https://open.er-api.com/v6/latest/USD

	baseURL := job.BaseURL
	if baseURL == "" {
		baseURL = DefaultExchangeApiBaseURL
	}

	req, err := http.NewRequest(http.MethodGet, baseURL+"/v6/latest/USD", nil)
	if err != nil {
		return nil, fmt.Errorf("could not create the request: %w", err)
	}

	client := job.Client
	if client == nil {
		client = defaultCurrencyClient
	}

	res, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("could not reach the exchange rate API: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("the exchange rate API returned status %d", res.StatusCode)
	}

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, fmt.Errorf("could not read the response: %w", err)
	}

	data := ExchangeApiResponse{}
	if err := json.Unmarshal(resBody, &data); err != nil {
		return nil, fmt.Errorf("could not read the exchange rate response: %w", err)
	}

	return &data, nil
}

// Force currency conversion updates to happen at max once every 24 hours
func (job *SyncCurrencyDataJob) synchronizationRequired() bool {

	app := job.App
	recentlyUpdatedCurrencies, _ := app.FindAllRecords("currency_conversions",
		dbx.NewExp("updated > {:threshold} ",
			dbx.Params{"threshold": time.Now().Add(-24 * time.Hour)}))

	return len(recentlyUpdatedCurrencies) == 0
}
