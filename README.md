# Surmai

Surmai is a personal travel planning application.

# Rationale

As avid travellers, we (me & SO) split up the planning tasks e.g. booking plane tickets and
making dinner reservations etc, with the receipts / confirmation emails being in our own
respective inboxes. These emails were tagged but were not necessarily organized in the order in
which things would happen. It was also a huge pain to find the right email at the right time, especially
given some low bandwidth connections.

Surmai was built to solve 3 particular challenges while planning a trip:

1. Allow collaborative planning between multiple people.
2. Allow easy access to all the necessary artifacts during the course of the trip.
3. Keep the data private.

# Features

- Organize a trip in one place
- Allow collaboration between multiple users
- Offline access
- Privacy
- Mobile friendly

### Mobile Apps
Surmai is built as a [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app). It's possible 
to install it as a regular app on mobile phones. [Installation Instructions](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid&oco=1)

### Screenshots / Screencasts
TBD



# Installation

The source code provides a `Dockerfile` and a `docker-compose.yaml` to get started. Ill update the documentation as I
have
a ready-to-use docker image hosted somewhere.

## By cloning the repository

### Required Environment Variables

- `SURMAI_ADMIN_EMAIL`: Email address of the initial user to be created. This email will also have admin access to the
Backend
- `SURMAI_ADMIN_PASSWORD`: Password for the initial account. Minimum of 10 characters

```bash
# Check out the source code
git clone https://github.com/rohitkumbhar/surmai.git

# Build a docker image locally
docker-compose build

# Run the docker image
docker-compose up -d
```

# Technical Details

I've been a Backend software engineer for the last ~20 years. My last professional interaction with Javascript was
pre jQuery days when Internet Explorer 5 demanded we test the `navigator` every time something was to be written. I have
been exposed to the "new" Javascript at my current job as a necessity and decided to use this project as a learning
opportunity.

## Backend

Surmai uses [PocketBase](https://pocketbase.io/) as it's backend platform. The API is great and the documentation is
first-class. The PocketBase Admin UI also allows for configuration that is not available from within Surmai (yet).

### Why not SupaBase/AppWrite etc?

They will work honestly but there is some heft involved for a self-hosted, personal application.

## Frontend

Surmai is a React based SPA built using the absolutely phenomenal library [Mantine](https://mantine.dev/). Vite for
building and prettier for formatting.

### Why so ugly tho?

~20 years as a backend dev, I have a tendency to lean towards function over form.

### Why not $other_thing?

I wanted to learn React, that's about it.

# Bundled Data

## Airports
From [OurAirports](https://ourairports.com/data/)

## Cities
From [countries-states-cities-database](https://github.com/dr5hn/countries-states-cities-database)

## Airlines
From [airlines-logos-dataset](https://github.com/imgmongelli/airlines-logos-dataset)