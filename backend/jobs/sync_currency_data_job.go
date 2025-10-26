package jobs

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type SyncCurrencyDataJob struct {
	Pb *pocketbase.PocketBase
}

type ExchangeApiResponse struct {
	Result              string             `json:"result"`
	Rates               map[string]float64 `json:"rates"`
	TimeSinceLastUpdate string             `json:"time_last_update_utc"`
	TimeNextUpdate      string             `json:"time_next_update_utc"`
	TimeEol             int64              `json:"time_eol_unix"`
	BaseCode            string             `json:"base_code"`
}

func (job *SyncCurrencyDataJob) Execute() {

	l := job.Pb.App.Logger().WithGroup("SyncCurrencyDataJob")

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

	app := job.Pb.App
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

	req, err := http.NewRequest(http.MethodGet, "https://open.er-api.com/v6/latest/USD", nil)
	if err != nil {
		fmt.Printf("client: could not create request: %s\n", err)
		return nil, err
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("client: error making http request: %s\n", err)
		return nil, err
	}

	fmt.Printf("client: got response!\n")
	fmt.Printf("client: status code: %d\n", res.StatusCode)

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		fmt.Printf("client: could not read response body: %s\n", err)
		return nil, err
	}

	data := ExchangeApiResponse{}
	json.Unmarshal(resBody, &data)

	return &data, nil
}

// Force currency conversion updates to happen at max once every 24 hours
func (job *SyncCurrencyDataJob) synchronizationRequired() bool {

	app := job.Pb.App
	recentlyUpdatedCurrencies, _ := app.FindAllRecords("currency_conversions",
		dbx.NewExp("updated > {:threshold} ",
			dbx.Params{"threshold": time.Now().Add(-24 * time.Hour)}))

	return len(recentlyUpdatedCurrencies) == 0
}
