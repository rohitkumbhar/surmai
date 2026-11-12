/**
 * Stands in for the services the backend calls out to, so the suite never
 * depends on the internet. Started by playwright.config.ts.
 *
 *   /adsbdb   the adsbdb flight route API
 *   /openai   an OpenAI compatible Responses API, for the assistant
 *   /rates    the exchange rate API
 *
 * Responses are canned. Add a route rather than reaching for the real service.
 */
import { createServer } from 'node:http';

const port = Number(process.env.MOCK_SERVICES_PORT || 8099);

// Flight routes, keyed by the flight number the UI looks up.
const flightRoutes = {
  AA100: {
    airline: { name: 'American Airlines', iata: 'AA' },
    origin: {
      iata_code: 'JFK',
      name: 'John F Kennedy International',
      country_iso_name: 'US',
      latitude: 40.639801,
      longitude: -73.7789,
    },
    destination: {
      iata_code: 'LAX',
      name: 'Los Angeles International',
      country_iso_name: 'US',
      latitude: 33.942501,
      longitude: -118.407997,
    },
  },
  AF007: {
    airline: { name: 'Air France', iata: 'AF' },
    origin: {
      iata_code: 'JFK',
      name: 'John F Kennedy International',
      country_iso_name: 'US',
      latitude: 40.639801,
      longitude: -73.7789,
    },
    destination: {
      iata_code: 'CDG',
      name: 'Charles de Gaulle',
      country_iso_name: 'FR',
      latitude: 49.012798,
      longitude: 2.55,
    },
  },
};

const json = (response, status, body) => {
  const payload = JSON.stringify(body);
  response.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  response.end(payload);
};

// The Responses API shape the OpenAI SDK reads.
const responsesReply = (text) => ({
  id: 'resp_mock',
  object: 'response',
  created_at: Math.floor(Date.now() / 1000),
  model: 'mock-model',
  status: 'completed',
  output: [
    {
      id: 'msg_mock',
      type: 'message',
      role: 'assistant',
      status: 'completed',
      content: [{ type: 'output_text', text, annotations: [] }],
    },
  ],
});

const readBody = (request) =>
  new Promise((resolve) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => resolve(body));
  });

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);

  // adsbdb: /adsbdb/v0/callsign/{flightNumber}
  const callsign = url.pathname.match(/^\/adsbdb\/v0\/callsign\/(.+)$/);
  if (callsign) {
    const route = flightRoutes[callsign[1].toUpperCase()];
    if (!route) {
      return json(response, 404, { response: 'unknown callsign' });
    }
    return json(response, 200, { response: { flightroute: { callsign: callsign[1], ...route } } });
  }

  // the assistant's model endpoint
  if (url.pathname === '/openai/responses') {
    const body = await readBody(request);
    // A structured request carries a schema; reply with something that fits it.
    const structured = body.includes('json_schema');
    return json(
      response,
      200,
      responsesReply(structured ? JSON.stringify({ category: 'unknown' }) : 'The assistant is reachable.')
    );
  }

  if (url.pathname === '/rates/v6/latest/USD') {
    return json(response, 200, {
      result: 'success',
      base_code: 'USD',
      rates: { USD: 1, EUR: 0.9, GBP: 0.8, JPY: 150 },
    });
  }

  if (url.pathname === '/health') {
    return json(response, 200, { ok: true });
  }

  json(response, 404, { error: `no mock for ${request.method} ${url.pathname}` });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`mock services listening on http://127.0.0.1:${port}`);
});
