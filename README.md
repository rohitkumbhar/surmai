# Surmai

Surmai is a personal travel planning and logging application. 


# Docker Setup

Sample `docker-compose` file


```yaml
version: '3.7'

volumes:
  surmai_data:

services:
  surmai:
    container_name: surmai
    image: surmai:latest
    volumes:
      - surmai_data:/pb_data
    ports:
      - 8090:8080
    restart: always
    environment:
      SURMAI_ADMIN_EMAIL: rohit@kumbhar.net
      SURMAI_ADMIN_PASSWORD: ul4Mtqcx07gCX
```